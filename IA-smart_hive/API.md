# API de Classificação Espectral de Pólen

Endpoint integrado ao backend Django do SmartHive para classificação em tempo real
de amostras de pólen capturadas pelo sensor AS7341 (10 canais espectrais).

---

## Como funciona

```
Sensor AS7341 → Arduino/ESP32 → POST /api/ia/polen/classificar/ → JSON com classe
```

O servidor carrega os modelos treinados (`.pkl`) na memória na primeira chamada.
As chamadas seguintes são diretas — sem I/O de disco, resposta em milissegundos.

**Modelos utilizados:**
- `normalizer.pkl` — Normalização L1 (mesmo pré-processamento do treinamento)
- `knn_ref.pkl` — KNN supervisionado (classifica por espécie conhecida)
- `kmeans_8.pkl` — KMeans não supervisionado (agrupa por padrão espectral)

---

## Endpoints

### `POST /api/ia/polen/classificar/`

Recebe os 10 canais do sensor, normaliza e retorna a classificação.

**Autenticação:** Nenhuma (igual aos endpoints IoT)

**Content-Type:** `application/json`

---

### Formato de entrada

#### Opção A — Objeto com chaves por canal *(recomendado)*

```json
{
    "F1":    2,
    "F2":    8,
    "F3":    5,
    "F4":    13,
    "F5":    23,
    "F6":    20,
    "F7":    21,
    "F8":    5,
    "NIR":   61,
    "CLEAR": 2
}
```

#### Opção B — Array de 10 valores

A ordem deve ser exatamente: `F1, F2, F3, F4, F5, F6, F7, F8, NIR, CLEAR`

```json
{
    "canais": [2, 8, 5, 13, 23, 20, 21, 5, 61, 2]
}
```

**Referência dos canais:**

| Canal | Comprimento de onda | Cor          |
|-------|---------------------|--------------|
| F1    | ~415 nm             | Violeta      |
| F2    | ~445 nm             | Azul         |
| F3    | ~480 nm             | Ciano        |
| F4    | ~515 nm             | Verde        |
| F5    | ~555 nm             | Verde-amarelo|
| F6    | ~590 nm             | Amarelo      |
| F7    | ~630 nm             | Laranja      |
| F8    | ~680 nm             | Vermelho     |
| NIR   | ~910 nm             | Infravermelho|
| CLEAR | —                   | Luminosidade |

---

### Resposta de sucesso — `200 OK`

```json
{
    "success": true,
    "knn": {
        "classe": 3,
        "label": "TIPO: 3"
    },
    "kmeans": {
        "cluster": 1,
        "label": "CLUSTER 1"
    },
    "canais_normalizados": {
        "F1":    0.014706,
        "F2":    0.058824,
        "F3":    0.036765,
        "F4":    0.095588,
        "F5":    0.169118,
        "F6":    0.147059,
        "F7":    0.154412,
        "F8":    0.036765,
        "NIR":   0.448529,
        "CLEAR": 0.014706
    },
    "canais_brutos": {
        "F1": 2, "F2": 8, "F3": 5, "F4": 13,
        "F5": 23, "F6": 20, "F7": 21, "F8": 5,
        "NIR": 61, "CLEAR": 2
    }
}
```

**Campos da resposta:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `knn.classe` | inteiro | ID da espécie classificada (1–8) |
| `knn.label` | string | Rótulo legível: `"TIPO: N"` |
| `kmeans.cluster` | inteiro | Cluster detectado (0–7) |
| `kmeans.label` | string | Rótulo legível: `"CLUSTER N"` |
| `canais_normalizados` | objeto | Valores após normalização L1 (soma = 1.0) |
| `canais_brutos` | objeto | Valores originais enviados |

> **KNN vs KMeans:**
> - **KNN** (`classe`) usa dados de referência rotulados — classifica por espécie conhecida.
> - **KMeans** (`cluster`) agrupa por similaridade espectral — útil para detectar padrões novos.

---

### Respostas de erro

#### `400 Bad Request` — canais ausentes

```json
{
    "success": false,
    "error": "Canais ausentes: ['NIR', 'CLEAR']. Envie todos os 10 canais: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'NIR', 'CLEAR']"
}
```

#### `400 Bad Request` — array com tamanho errado

```json
{
    "success": false,
    "error": "\"canais\" deve ser uma lista com exatamente 10 valores."
}
```

#### `503 Service Unavailable` — modelos não encontrados

```json
{
    "success": false,
    "error": "Arquivo de modelo não encontrado: /app/ia_models/normalizer.pkl. Certifique-se de que os modelos foram treinados e que IA_MODELS_DIR está configurado corretamente."
}
```

---

### `GET /api/ia/status/`

Verifica se os modelos estão carregados e prontos para uso.

**Resposta — modelos prontos (`200 OK`):**

```json
{
    "status": "pronto",
    "modelos_carregados": true,
    "canais": ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "NIR", "CLEAR"],
    "models_dir": "/app/ia_models"
}
```

**Resposta — modelos indisponíveis (`503`):**

```json
{
    "status": "indisponivel",
    "modelos_carregados": false,
    "erro": "Arquivo de modelo não encontrado: ...",
    "models_dir": "/app/ia_models"
}
```

---

## Exemplos de uso

### cURL

```bash
curl -X POST http://localhost:8000/api/ia/polen/classificar/ \
  -H "Content-Type: application/json" \
  -d '{
    "F1": 2, "F2": 8, "F3": 5, "F4": 13,
    "F5": 23, "F6": 20, "F7": 21, "F8": 5,
    "NIR": 61, "CLEAR": 2
  }'
```

### Python (requests)

```python
import requests

dados = {
    "F1": 2, "F2": 8, "F3": 5, "F4": 13,
    "F5": 23, "F6": 20, "F7": 21, "F8": 5,
    "NIR": 61, "CLEAR": 2
}

resposta = requests.post(
    "http://localhost:8000/api/ia/polen/classificar/",
    json=dados
)

resultado = resposta.json()
print(f"Espécie KNN: {resultado['knn']['label']}")
print(f"Cluster:     {resultado['kmeans']['label']}")
```

### Arduino (ESP32 via WiFi)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* endpoint = "http://<IP-VPS>:8080/api/ia/polen/classificar/";

void enviarClassificacao(int f1, int f2, int f3, int f4, int f5,
                         int f6, int f7, int f8, int nir, int clear) {
    HTTPClient http;
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");

    // Formato B (array) — mais compacto para microcontrolador
    String payload = "{\"canais\":[" +
        String(f1)  + "," + String(f2)  + "," + String(f3)  + "," +
        String(f4)  + "," + String(f5)  + "," + String(f6)  + "," +
        String(f7)  + "," + String(f8)  + "," + String(nir) + "," +
        String(clear) + "]}";

    int httpCode = http.POST(payload);

    if (httpCode == 200) {
        String response = http.getString();
        DynamicJsonDocument doc(512);
        deserializeJson(doc, response);

        int classe  = doc["knn"]["classe"];
        int cluster = doc["kmeans"]["cluster"];
        Serial.printf("Especie: %d | Cluster: %d\n", classe, cluster);
    }

    http.end();
}
```

---

## Configuração do servidor

### Desenvolvimento local

```bash
cd backend
pip install scikit-learn numpy joblib
python manage.py runserver
```

Os modelos são carregados automaticamente de `../IA-smart_hive/models/`.

### Docker / VPS

Os modelos são montados como volume somente-leitura. Nenhuma alteração adicional é necessária — o `docker-compose.yml` já está configurado.

```bash
docker-compose up -d
```

Se os modelos forem retreinados (novo `train_models.py`), reinicie apenas o backend:

```bash
docker-compose restart backend
```

### Variável de ambiente opcional

| Variável | Padrão (dev) | Valor (Docker) |
|---|---|---|
| `IA_MODELS_DIR` | `../IA-smart_hive/models` | `/app/ia_models` |

---

## Treinamento dos modelos

Antes de usar o endpoint, os modelos precisam ter sido treinados:

```bash
cd IA-smart_hive
pip install -r requirements.txt
python src/train_models.py
```

Isso gera os arquivos `models/normalizer.pkl`, `models/knn_ref.pkl` e `models/kmeans_8.pkl`.
