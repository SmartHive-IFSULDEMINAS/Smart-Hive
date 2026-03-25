# -*- coding: utf-8 -*-
"""
SmartHive - Configuration Module
Centralized settings for all project components.
"""

import os
from pathlib import Path

# =============================================================================
# PROJECT PATHS
# =============================================================================

# Base project directory (where this config file is located)
PROJECT_ROOT = Path(__file__).parent.parent.resolve()

# Data directories
DATA_DIR = PROJECT_ROOT / "data"
DATASETS_DIR = DATA_DIR / "datasets"
REFERENCES_DIR = DATA_DIR / "references"
SAMPLES_DIR = DATA_DIR / "samples"

# Output directories
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
CLUSTER_PATTERNS_DIR = OUTPUTS_DIR / "cluster_patterns"
REFERENCE_PATTERNS_DIR = OUTPUTS_DIR / "reference_patterns"

# Models directory
MODELS_DIR = PROJECT_ROOT / "models"

# =============================================================================
# FILE NAMES
# =============================================================================

DATASET_FILE = "dataset_polen_mestre.csv"
REFERENCE_FILE = "referencia.csv"
SAMPLES_FILE = "amostras.csv"

# =============================================================================
# SENSOR CONFIGURATION
# =============================================================================

SENSOR_COLUMNS = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'NIR', 'CLEAR']

# Spectral colors for each sensor channel (for visualization)
SENSOR_COLORS = [
    '#9400D3',  # F1 - Violet
    '#0000FF',  # F2 - Blue
    '#00BFFF',  # F3 - Cyan
    '#00FF00',  # F4 - Green
    '#ADFF2F',  # F5 - Yellow-Green
    '#FFFF00',  # F6 - Yellow
    '#FFA500',  # F7 - Orange
    '#FF0000',  # F8 - Red
    '#808080',  # NIR - Gray
    '#E0E0E0',  # CLEAR - Light Gray
]

# Alternative colors for GUI (brighter)
SENSOR_COLORS_GUI = [
    '#9D00FF',  # F1
    '#2962FF',  # F2
    '#00E5FF',  # F3
    '#00E676',  # F4
    '#C6FF00',  # F5
    '#FFAB00',  # F6
    '#FF3D00',  # F7
    '#D50000',  # F8
    '#555555',  # NIR
    '#E0E0E0',  # CLEAR
]

# =============================================================================
# HARDWARE CONFIGURATION
# =============================================================================

BAUD_RATE = 115200
SENSOR_Y_LIMIT = 65535  # Maximum sensor value (16-bit)

# =============================================================================
# GUI THEME COLORS
# =============================================================================

THEME = {
    'background': '#1a1a1a',
    'sidebar': '#212121',
    'card': '#2b2b2b',
    'accent': '#3B8ED0',
    'success': '#2CC985',
    'warning': '#E0A800',
    'error': '#C0392B',
    'saturation': '#FFFFFF',
}

# =============================================================================
# ML MODEL CONFIGURATION
# =============================================================================

KMEANS_CLUSTERS = 8
KNN_NEIGHBORS = 1

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def ensure_directories():
    """Create all required directories if they don't exist."""
    directories = [
        DATASETS_DIR,
        REFERENCES_DIR,
        SAMPLES_DIR,
        CLUSTER_PATTERNS_DIR,
        REFERENCE_PATTERNS_DIR,
        MODELS_DIR,
    ]
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)


def get_dataset_path() -> Path:
    """Get the full path to the main dataset file."""
    return DATASETS_DIR / DATASET_FILE


def get_reference_path() -> Path:
    """Get the full path to the reference file."""
    return REFERENCES_DIR / REFERENCE_FILE


def get_model_path(model_name: str) -> Path:
    """Get the full path to a model file."""
    return MODELS_DIR / model_name
