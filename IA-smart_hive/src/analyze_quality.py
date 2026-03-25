# -*- coding: utf-8 -*-
"""
SmartHive - Model Quality Analysis
Evaluate the quality of trained models and dataset characteristics.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from sklearn.preprocessing import Normalizer
from sklearn.cluster import KMeans
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import silhouette_score, calinski_harabasz_score
import joblib

from src.config import (
    DATASETS_DIR, REFERENCES_DIR, MODELS_DIR,
    DATASET_FILE, REFERENCE_FILE, SENSOR_COLUMNS
)


def analyze_dataset(df):
    """Analyze dataset characteristics."""
    print("\n" + "=" * 60)
    print("ANALISE DO DATASET")
    print("=" * 60)
    
    # Basic stats
    print(f"\nTotal de amostras: {len(df)}")
    
    # Check labeling
    if 'TIPO' in df.columns:
        tipo_counts = df['TIPO'].value_counts()
        print(f"\nDistribuicao por TIPO:")
        for tipo, count in tipo_counts.items():
            pct = count / len(df) * 100
            print(f"   {tipo}: {count} amostras ({pct:.1f}%)")
    
    if 'ESPECIE' in df.columns:
        especie_counts = df['ESPECIE'].value_counts()
        n_labeled = df['ESPECIE'].notna().sum()
        n_unlabeled = df['ESPECIE'].isna().sum() + (df['ESPECIE'] == '').sum()
        
        print(f"\nAmostras rotuladas (ESPECIE): {n_labeled} ({n_labeled/len(df)*100:.1f}%)")
        print(f"Amostras NAO rotuladas: {n_unlabeled} ({n_unlabeled/len(df)*100:.1f}%)")
    
    # Check for sensor columns
    sensor_cols = [c for c in SENSOR_COLUMNS if c in df.columns]
    df_sensors = df[sensor_cols].apply(pd.to_numeric, errors='coerce')
    
    print(f"\n--- Estatisticas dos Sensores ---")
    for col in sensor_cols:
        mean_val = df_sensors[col].mean()
        std_val = df_sensors[col].std()
        min_val = df_sensors[col].min()
        max_val = df_sensors[col].max()
        print(f"   {col}: mean={mean_val:.1f}, std={std_val:.1f}, range=[{min_val:.0f}, {max_val:.0f}]")
    
    # Check for potential issues
    print(f"\n--- Problemas Potenciais ---")
    
    # Low signal samples
    signal_sum = df_sensors.sum(axis=1)
    low_signal = (signal_sum < 50).sum()
    print(f"   Amostras com sinal muito baixo (<50): {low_signal} ({low_signal/len(df)*100:.1f}%)")
    
    # Saturated samples (any channel > 65000)
    saturated = (df_sensors > 65000).any(axis=1).sum()
    print(f"   Amostras saturadas (>65000): {saturated} ({saturated/len(df)*100:.1f}%)")
    
    # Near-zero readings
    zero_readings = (df_sensors <= 1).all(axis=1).sum()
    print(f"   Amostras com leituras zero/um: {zero_readings} ({zero_readings/len(df)*100:.1f}%)")
    
    return df_sensors


def analyze_kmeans_quality(X_norm, n_clusters=8):
    """Analyze KMeans clustering quality."""
    print("\n" + "=" * 60)
    print("ANALISE DO MODELO KMEANS")
    print("=" * 60)
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_norm)
    
    # Cluster distribution
    print(f"\nDistribuicao dos Clusters:")
    unique, counts = np.unique(labels, return_counts=True)
    for cluster_id, count in zip(unique, counts):
        pct = count / len(labels) * 100
        print(f"   Cluster {cluster_id}: {count} amostras ({pct:.1f}%)")
    
    # Quality metrics
    silhouette = silhouette_score(X_norm, labels)
    calinski = calinski_harabasz_score(X_norm, labels)
    
    print(f"\n--- Metricas de Qualidade ---")
    print(f"   Silhouette Score: {silhouette:.3f}")
    print(f"      (0-1: quanto maior, melhor. >0.5 = bom, >0.7 = excelente)")
    print(f"   Calinski-Harabasz Index: {calinski:.1f}")
    print(f"      (quanto maior, melhor. Clusters mais densos e separados)")
    
    # Check for problematic clusters
    print(f"\n--- Alertas ---")
    
    # Clusters with very few samples
    small_clusters = [(c, n) for c, n in zip(unique, counts) if n < 5]
    if small_clusters:
        print(f"   [!] Clusters muito pequenos (<5 amostras): {small_clusters}")
        print(f"       -> Considere reduzir o numero de clusters ou revisar os dados")
    
    # Imbalanced clusters
    max_ratio = max(counts) / min(counts)
    if max_ratio > 10:
        print(f"   [!] Clusters muito desbalanceados (ratio {max_ratio:.1f}x)")
        print(f"       -> Maior cluster tem {max_ratio:.0f}x mais amostras que o menor")
    
    if silhouette < 0.3:
        print(f"   [!] Silhouette Score baixo ({silhouette:.3f})")
        print(f"       -> Clusters podem nao estar bem separados")
    
    return silhouette, calinski, labels


def analyze_knn_quality(X_ref, y_ref, X_full, labels_full):
    """Analyze KNN reference quality."""
    print("\n" + "=" * 60)
    print("ANALISE DO MODELO KNN")
    print("=" * 60)
    
    print(f"\nReferencias carregadas: {len(X_ref)} amostras")
    print(f"Especies unicas: {len(np.unique(y_ref))}")
    
    # Check reference distribution
    unique_species, counts = np.unique(y_ref, return_counts=True)
    print(f"\nDistribuicao de referencias:")
    for species, count in zip(unique_species, counts):
        print(f"   Especie {species}: {count} amostra(s)")
    
    # Analyze reference vs full dataset
    normalizer = Normalizer(norm='l1')
    X_ref_norm = normalizer.fit_transform(X_ref)
    X_full_norm = normalizer.transform(X_full)
    
    # Train KNN
    knn = KNeighborsClassifier(n_neighbors=1, metric='euclidean')
    knn.fit(X_ref_norm, y_ref)
    
    # Predict on full dataset
    predictions = knn.predict(X_full_norm)
    
    print(f"\n--- Classificacao do Dataset Completo ---")
    pred_unique, pred_counts = np.unique(predictions, return_counts=True)
    for species, count in zip(pred_unique, pred_counts):
        pct = count / len(predictions) * 100
        print(f"   Especie {species}: {count} amostras ({pct:.1f}%)")
    
    # Cross-check: How many samples would be classified to each reference?
    print(f"\n--- Alertas ---")
    
    # Check if all references are being used
    unused = [s for s in unique_species if s not in predictions]
    if unused:
        print(f"   [!] Referencias nunca utilizadas na classificacao: {unused}")
        print(f"       -> Essas referencias podem ser outliers ou mal calibradas")
    
    # Check reference diversity
    if len(X_ref) < 10:
        print(f"   [!] Poucas amostras de referencia ({len(X_ref)})")
        print(f"       -> Adicione mais referencias para melhor representatividade")
    
    if len(np.unique(y_ref)) == len(y_ref):
        print(f"   [!] Apenas 1 amostra por especie")
        print(f"       -> Ideal ter 3-5 amostras por especie para mais robustez")
    
    return predictions


def suggest_improvements(df_sensors, silhouette, n_ref):
    """Suggest improvements based on analysis."""
    print("\n" + "=" * 60)
    print("RECOMENDACOES DE MELHORIA")
    print("=" * 60)
    
    recommendations = []
    
    # Data quality
    signal_sum = df_sensors.sum(axis=1)
    low_signal_pct = (signal_sum < 50).sum() / len(df_sensors) * 100
    if low_signal_pct > 10:
        recommendations.append(
            f"1. FILTRAGEM DE DADOS: {low_signal_pct:.1f}% das amostras tem sinal muito baixo.\n"
            "   -> Considere remover amostras com sinal total < 50\n"
            "   -> Use um limiar minimo na coleta de dados"
        )
    
    # Clustering quality
    if silhouette < 0.4:
        recommendations.append(
            f"2. NUMERO DE CLUSTERS: Silhouette Score = {silhouette:.3f} (baixo).\n"
            "   -> Experimente diferentes numeros de clusters (5-12)\n"
            "   -> Use metodo Elbow ou Gap Statistic para encontrar o ideal\n"
            "   Adicione ao train_models.py:\n"
            "   from sklearn.metrics import silhouette_score\n"
            "   for k in range(3, 15):\n"
            "       kmeans = KMeans(n_clusters=k)\n"
            "       score = silhouette_score(X, kmeans.fit_predict(X))\n"
            "       print(f'k={k}: {score:.3f}')"
        )
    
    # Reference quality
    if n_ref < 20:
        recommendations.append(
            f"3. AMOSTRAS DE REFERENCIA: Apenas {n_ref} referencias.\n"
            "   -> Ideal ter 3-5 amostras por especie\n"
            "   -> Colete referencias em diferentes condicoes (luz, distancia)\n"
            "   -> Atualize referencia.csv com mais amostras"
        )
    
    # Normalization alternative
    recommendations.append(
        "4. NORMALIZACAO ALTERNATIVA:\n"
        "   -> Atualmente usa L1 (soma = 1). Teste tambem:\n"
        "      - StandardScaler (media=0, std=1)\n"
        "      - MinMaxScaler (0-1)\n"
        "   -> Compare as metricas de silhouette para cada um"
    )
    
    # Feature engineering
    recommendations.append(
        "5. FEATURES ADICIONAIS:\n"
        "   -> Calcule proporcoes entre canais (ex: F5/F6)\n"
        "   -> Use PCA para reduzir dimensionalidade\n"
        "   -> Adicione estatisticas (desvio padrao de multiplas leituras)"
    )
    
    # Validation
    recommendations.append(
        "6. VALIDACAO CRUZADA:\n"
        "   -> Implemente train/test split para avaliar generalizacao\n"
        "   -> Use cross-validation para KNN\n"
        "   Adicione ao train_models.py:\n"
        "   from sklearn.model_selection import cross_val_score\n"
        "   scores = cross_val_score(knn, X, y, cv=5)\n"
        "   print(f'Accuracy: {scores.mean():.3f} +/- {scores.std():.3f}')"
    )
    
    print()
    for i, rec in enumerate(recommendations):
        print(rec)
        print()
    
    return recommendations


def main():
    """Run complete analysis."""
    print("=" * 60)
    print("SmartHive - Model Quality Analysis")
    print("=" * 60)
    
    # Load dataset
    dataset_path = DATASETS_DIR / DATASET_FILE
    df = pd.read_csv(dataset_path)
    df.columns = [c.upper() for c in df.columns]
    
    # Analyze dataset
    df_sensors = analyze_dataset(df)
    
    # Prepare data for models
    mask_valid = (df_sensors.notna().all(axis=1)) & (df_sensors > 0).all(axis=1)
    X_full = df_sensors[mask_valid].values
    
    normalizer = Normalizer(norm='l1')
    X_norm = normalizer.fit_transform(X_full)
    
    # Analyze KMeans
    silhouette, calinski, labels = analyze_kmeans_quality(X_norm)
    
    # Analyze KNN
    reference_path = REFERENCES_DIR / REFERENCE_FILE
    try:
        df_ref = pd.read_csv(reference_path)
        df_ref.columns = [c.upper() for c in df_ref.columns]
        
        sensor_cols = [c for c in SENSOR_COLUMNS if c in df_ref.columns]
        X_ref = df_ref[sensor_cols].apply(pd.to_numeric, errors='coerce').values
        
        if 'ESPECIE' in df_ref.columns:
            y_ref = df_ref['ESPECIE'].values
        else:
            y_ref = list(range(len(X_ref)))
        
        predictions = analyze_knn_quality(X_ref, y_ref, X_full, labels)
        n_ref = len(X_ref)
    except:
        n_ref = 0
        print("\n[!] Arquivo de referencias nao encontrado")
    
    # Suggestions
    suggest_improvements(df_sensors, silhouette, n_ref)


if __name__ == "__main__":
    main()
