# -*- coding: utf-8 -*-
"""
SmartHive - Model Training Module
Train KMeans and KNN models for pollen classification.

Usage:
    python -m src.train_models
    
Or from project root:
    python src/train_models.py
"""

import sys
import os

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from sklearn.preprocessing import Normalizer
from sklearn.cluster import KMeans
from sklearn.neighbors import KNeighborsClassifier
import joblib
import matplotlib
matplotlib.use('Agg')  # Non-GUI backend for saving images
import matplotlib.pyplot as plt

from src.config import (
    DATASETS_DIR, REFERENCES_DIR, MODELS_DIR,
    CLUSTER_PATTERNS_DIR, REFERENCE_PATTERNS_DIR,
    DATASET_FILE, REFERENCE_FILE,
    SENSOR_COLUMNS, SENSOR_COLORS,
    KMEANS_CLUSTERS, KNN_NEIGHBORS,
    ensure_directories
)


def plot_spectrum(cluster_id: str, values: np.ndarray, output_dir, title_prefix: str = "CLUSTER"):
    """
    Generate a bar chart image showing sensor values.
    
    Args:
        cluster_id: Identifier for the cluster/species
        values: Array of sensor values (10 values)
        output_dir: Directory to save the image
        title_prefix: Prefix for the title (e.g., "CLUSTER", "ESPECIE")
    
    Returns:
        Path to the saved image
    """
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.patch.set_facecolor('#1e1e1e')
    ax.set_facecolor('#1e1e1e')
    
    x = np.arange(len(SENSOR_COLUMNS))
    bars = ax.bar(x, values, color=SENSOR_COLORS, edgecolor='none', width=0.7)
    
    # Add value labels on top of bars
    for bar, val in zip(bars, values):
        height = bar.get_height()
        ax.annotate(f'{val:.0f}',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom',
                    color='white', fontsize=10, fontweight='bold')
    
    ax.set_xticks(x)
    ax.set_xticklabels(SENSOR_COLUMNS, color='white', fontsize=11)
    ax.tick_params(axis='y', colors='white')
    ax.set_title(f'{title_prefix} {cluster_id} - ESPECTRO MÃ‰DIO', 
                 color='white', fontsize=14, fontweight='bold')
    
    # Style adjustments
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#555555')
    ax.spines['bottom'].set_color('#555555')
    ax.yaxis.grid(True, linestyle='--', alpha=0.3, color='#555555')
    
    plt.tight_layout()
    filepath = output_dir / f'{title_prefix.lower()}_{cluster_id}.png'
    plt.savefig(filepath, dpi=150, facecolor='#1e1e1e', edgecolor='none')
    plt.close()
    return filepath


def preprocess_data(df: pd.DataFrame):
    """
    Preprocess sensor data for model training.
    
    Args:
        df: DataFrame with sensor columns
        
    Returns:
        Tuple of (valid_df, X_values array)
    """
    # Normalize column names to uppercase
    df.columns = [c.upper() for c in df.columns]
    
    # Check for presence of sensor columns
    cols_present = [c for c in SENSOR_COLUMNS if c in df.columns]
    if len(cols_present) < len(SENSOR_COLUMNS):
        print(f"  [!] Warning: Found only {len(cols_present)} of {len(SENSOR_COLUMNS)} sensor columns.")
    
    # Convert to numeric, handle errors
    df_sensors = df[cols_present].apply(pd.to_numeric, errors='coerce')
    
    # Filter valid rows (no NaNs, all > 0)
    mask_valid = (df_sensors.notna().all(axis=1)) & (df_sensors > 0).all(axis=1)
    df_valid = df[mask_valid].copy()
    X_values = df_sensors[mask_valid].values
    
    return df_valid, X_values


def train_models():
    """Main training pipeline."""
    print("=" * 60)
    print("SmartHive - Model Training Pipeline")
    print("=" * 60)
    
    # Ensure all directories exist
    ensure_directories()
    
    # ==========================================================================
    # 1. Load Dataset
    # ==========================================================================
    dataset_path = DATASETS_DIR / DATASET_FILE
    print(f"\n[*] Loading dataset: {dataset_path}")
    
    try:
        df_full = pd.read_csv(dataset_path)
        df_valid, X_full = preprocess_data(df_full)
        print(f"   [OK] Loaded {len(X_full)} valid samples")
    except FileNotFoundError:
        print(f"   [ERROR] {dataset_path} not found!")
        return False
    
    # ==========================================================================
    # 2. Train Normalizer
    # ==========================================================================
    print("\n[*] Training Normalizer (L1)...")
    normalizer = Normalizer(norm='l1')
    X_norm = normalizer.fit_transform(X_full)
    
    normalizer_path = MODELS_DIR / "normalizer.pkl"
    joblib.dump(normalizer, normalizer_path)
    print(f"   [OK] Saved: {normalizer_path}")
    
    # ==========================================================================
    # 3. Train KMeans (Unsupervised)
    # ==========================================================================
    print(f"\n[*] Training KMeans ({KMEANS_CLUSTERS} clusters)...")
    kmeans = KMeans(n_clusters=KMEANS_CLUSTERS, random_state=42, n_init=10)
    kmeans.fit(X_norm)
    
    kmeans_path = MODELS_DIR / f"kmeans_{KMEANS_CLUSTERS}.pkl"
    joblib.dump(kmeans, kmeans_path)
    print(f"   [OK] Saved: {kmeans_path}")
    
    # Generate cluster pattern images
    print("\n[*] Generating cluster pattern images...")
    labels = kmeans.labels_
    for cluster_id in range(KMEANS_CLUSTERS):
        mask = labels == cluster_id
        cluster_samples = X_full[mask]
        
        if len(cluster_samples) > 0:
            avg_values = cluster_samples.mean(axis=0)
            filepath = plot_spectrum(str(cluster_id), avg_values, 
                                     CLUSTER_PATTERNS_DIR, "CLUSTER")
            print(f"   Cluster {cluster_id}: {len(cluster_samples)} samples  -> {filepath.name}")
        else:
            print(f"   Cluster {cluster_id}: No samples")
    
    # ==========================================================================
    # 4. Train KNN (Supervised)
    # ==========================================================================
    reference_path = REFERENCES_DIR / REFERENCE_FILE
    print(f"\n[*] Loading references: {reference_path}")
    
    try:
        df_ref = pd.read_csv(reference_path)
        df_ref_valid, X_ref = preprocess_data(df_ref)
        
        # Get labels from ESPECIE or TIPO column
        df_ref_valid.columns = [c.upper() for c in df_ref_valid.columns]
        if 'ESPECIE' in df_ref_valid.columns:
            y_ref = df_ref_valid['ESPECIE'].values
            label_col = 'ESPECIE'
        elif 'TIPO' in df_ref_valid.columns:
            y_ref = df_ref_valid['TIPO'].values
            label_col = 'TIPO'
        else:
            y_ref = list(range(len(X_ref)))
            label_col = 'INDEX'
        
        print(f"   [OK] Loaded {len(X_ref)} reference samples (label: {label_col})")
        
        # Normalize and train
        X_ref_norm = normalizer.transform(X_ref)
        
        print(f"\n[*] Training KNN ({KNN_NEIGHBORS} neighbor)...")
        knn = KNeighborsClassifier(n_neighbors=KNN_NEIGHBORS, metric='euclidean')
        knn.fit(X_ref_norm, y_ref)
        
        knn_path = MODELS_DIR / "knn_ref.pkl"
        joblib.dump(knn, knn_path)
        print(f"   [OK] Saved: {knn_path}")
        
        # Generate reference pattern images
        print("\n[*] Generating reference pattern images...")
        for idx in range(len(X_ref)):
            species_id = y_ref[idx]
            values = X_ref[idx]
            filepath = plot_spectrum(str(species_id), values, 
                                     REFERENCE_PATTERNS_DIR, "ESPECIE")
            print(f"   EspÃ©cie {species_id} â†’ {filepath.name}")
        
    except FileNotFoundError:
        print(f"   [!] Warning: {reference_path} not found. KNN training skipped.")
    except Exception as e:
        print(f"   [ERROR] Training KNN: {e}")
    
    # ==========================================================================
    # Done
    # ==========================================================================
    print("\n" + "=" * 60)
    print("[OK] Training complete!")
    print(f"   Models saved to: {MODELS_DIR}")
    print(f"   Cluster patterns: {CLUSTER_PATTERNS_DIR}")
    print(f"   Reference patterns: {REFERENCE_PATTERNS_DIR}")
    print("=" * 60)
    
    return True


if __name__ == "__main__":
    train_models()

