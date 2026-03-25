# 🐝 SmartHive

Sistema de análise espectral de pólen utilizando sensor AS7341 e machine learning.

## 📁 Estrutura do Projeto

```
smart_hive/
├── src/                    # Código Python principal
│   ├── config.py           # Configurações centralizadas
│   ├── gui_app.py          # Aplicação GUI para coleta de dados
│   └── train_models.py     # Treinamento de modelos ML
├── data/
│   ├── datasets/           # Datasets de treinamento
│   ├── references/         # Dados de referência (rotulados)
│   └── samples/            # Amostras coletadas
├── models/                 # Modelos treinados (.pkl)
├── outputs/
│   ├── cluster_patterns/   # Visualização dos clusters KMeans
│   └── reference_patterns/ # Visualização das espécies de referência
├── arduino/
│   └── smart_hive_sensor/  # Firmware do Arduino
├── .gitignore
├── requirements.txt
└── README.md
```

## 🚀 Instalação

### 1. Criar ambiente virtual

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
# ou
source .venv/bin/activate  # Linux/Mac
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Carregar firmware no Arduino

1. Abra `arduino/smart_hive_sensor/smart_hive_sensor.ino` na Arduino IDE
2. Instale a biblioteca `Adafruit AS7341`
3. Conecte o Arduino e faça upload

## 📊 Uso

### Coletar Dados (GUI)

```bash
python src/gui_app.py
```

### Treinar Modelos

```bash
python src/train_models.py
```

Isso irá:
- Treinar um normalizador L1
- Treinar KMeans (8 clusters)
- Treinar KNN (1 vizinho)
- Gerar imagens dos padrões espectrais

## 🧠 Modelos

| Modelo | Tipo | Descrição |
|--------|------|-----------|
| `normalizer.pkl` | Pré-processamento | Normalização L1 |
| `kmeans_8.pkl` | Não supervisionado | Clustering em 8 grupos |
| `knn_ref.pkl` | Supervisionado | Classificação por espécie |

## 🔧 Hardware

- **Microcontrolador**: Arduino (Uno, Nano, etc.)
- **Sensor**: Adafruit AS7341 (10 canais espectrais)
- **LED**: LED branco integrado no sensor

## 📄 Licença

Este projeto é para fins educacionais.
