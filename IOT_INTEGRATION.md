# 🔌 Integração IoT - Smart-Hive

## Visão Geral

O Smart-Hive suporta integração simples com sensores IoT para monitoramento em tempo real das colmeias. Os dispositivos podem enviar dados de temperatura, nível de ruído e luminosidade diretamente para o sistema **sem necessidade de autenticação**.

---

## 📡 Campos de Sensores

### Modelo Colmeia
- **temperatura_atual**: Temperatura atual em °C
- **nivel_ruido**: Nível de ruído em dB
- **luminosidade**: Luminosidade em lux
- **umidade**: Umidade relativa em %
- **pressao**: Pressão atmosférica em hPa
- **peso**: Peso da colmeia em kg
- **data_ultima_leitura_sensor**: Timestamp da última leitura
- **sensor_iot_ativo**: Indica se a colmeia possui sensor IoT ativo (ativado automaticamente ao receber dados)

### Modelo LeituraSensor (Histórico)
- **temperatura**: Temperatura em °C
- **nivel_ruido**: Nível de ruído em dB
- **luminosidade**: Luminosidade em lux
- **umidade**: Umidade relativa em %
- **pressao**: Pressão atmosférica em hPa
- **peso**: Peso da colmeia em kg
- **timestamp**: Data e hora da leitura
- **dispositivo_id**: ID do dispositivo IoT (opcional)
- **bateria_nivel**: Nível de bateria em % (opcional)
- **sinal_rssi**: Força do sinal em dBm (opcional)

### Modelo Apiario
- **temperatura_atual**: Temperatura atual do apiário em °C
- **latitude**: Latitude GPS (coordenada)
- **longitude**: Longitude GPS (coordenada)
- **data_ultima_leitura_sensor**: Timestamp da última leitura
- **sensor_iot_ativo**: Indica se o apiário possui sensor IoT ativo

---

## 📤 Enviando Dados dos Sensores

### Endpoint: `POST /api/iot/dados/`

**URL:** `http://localhost:8000/api/iot/dados/`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "colmeia_identificador": "CLM-001",
    "temperatura": 32.5,
    "nivel_ruido": 45.2,
    "luminosidade": 850.0,
    "umidade": 65.5,
    "pressao": 1013.25,
    "peso": 45.8,
    "dispositivo_id": "ESP32-001",
    "bateria_nivel": 85,
    "sinal_rssi": -65
}
```

**Campos:**
- `colmeia_identificador` (obrigatório): Identificador único da colmeia (ex: "CLM-001")
- `temperatura` (opcional): Temperatura em °C
- `nivel_ruido` (opcional): Nível de ruído em dB
- `luminosidade` (opcional): Luminosidade em lux
- `umidade` (opcional): Umidade relativa em %
- `pressao` (opcional): Pressão atmosférica em hPa
- `peso` (opcional): Peso da colmeia em kg
- `dispositivo_id` (opcional): ID do dispositivo
- `bateria_nivel` (opcional): Nível de bateria (0-100)
- `sinal_rssi` (opcional): Força do sinal em dBm

**Nota:** Pelo menos um dos campos de sensor deve ser enviado.

**Resposta de Sucesso (200):**
```json
{
    "success": true,
    "message": "Dados recebidos e salvos com sucesso",
    "colmeia": "CLM-001",
    "timestamp": "2024-01-15T10:30:00Z",
    "leitura_id": 123
}
```

**Resposta de Erro (400):**
```json
{
    "success": false,
    "error": "colmeia_identificador é obrigatório"
}
```

**Resposta de Erro (404):**
```json
{
    "success": false,
    "error": "Colmeia com identificador \"CLM-999\" não encontrada"
}
```

---

## 📤 Enviando Dados dos Sensores do Apiário

### Endpoint: `POST /api/iot/apiario/dados/`

**URL:** `http://localhost:8000/api/iot/apiario/dados/`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "apiario_id": 1,
    "temperatura": 28.5,
    "latitude": -23.5505,
    "longitude": -46.6333
}
```

**Campos:**
- `apiario_id` (obrigatório se não usar apiario_nome): ID do apiário
- `apiario_nome` (obrigatório se não usar apiario_id): Nome do apiário
- `temperatura` (opcional): Temperatura do apiário em °C
- `latitude` (opcional): Latitude GPS
- `longitude` (opcional): Longitude GPS

**Nota:** Pelo menos um dos campos (temperatura, latitude ou longitude) deve ser enviado.

**Resposta de Sucesso (200):**
```json
{
    "success": true,
    "message": "Dados do apiário recebidos e salvos com sucesso",
    "apiario": "Apiário Principal",
    "apiario_id": 1,
    "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📊 Consultando Histórico de Leituras

### Endpoint: `GET /api/iot/historico/{colmeia_identificador}/`

**Parâmetros de Query:**
- `limit`: Número máximo de leituras (padrão: 100)
- `offset`: Offset para paginação (padrão: 0)

**Exemplo:**
```bash
GET /api/iot/historico/CLM-001/?limit=50&offset=0
```

**Resposta:**
```json
{
    "colmeia": "CLM-001",
    "total": 1250,
    "leituras": [
        {
            "id": 1,
            "colmeia_identificador": "CLM-001",
            "temperatura": "32.50",
            "nivel_ruido": "45.20",
            "luminosidade": "850.00",
            "timestamp": "2024-01-15T10:30:00Z",
            "dispositivo_id": "ESP32-001"
        },
        ...
    ]
}
```

---

## 💻 Exemplos de Código

### Arduino/ESP32 (C++)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";
const char* serverUrl = "http://seu-servidor:8000/api/iot/dados/";
const char* colmeiaId = "CLM-001";  // Identificador da colmeia

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("Conectado!");
}

void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");
        
        // Ler sensores
        float temperatura = lerTemperatura();
        float ruido = lerRuido();
        float luminosidade = lerLuminosidade();
        int bateria = lerBateria();
        int rssi = WiFi.RSSI();
        
        // Criar JSON
        StaticJsonDocument<300> doc;
        doc["colmeia_identificador"] = colmeiaId;
        doc["temperatura"] = temperatura;
        doc["nivel_ruido"] = ruido;
        doc["luminosidade"] = luminosidade;
        doc["dispositivo_id"] = "ESP32-001";
        doc["bateria_nivel"] = bateria;
        doc["sinal_rssi"] = rssi;
        
        String jsonString;
        serializeJson(doc, jsonString);
        
        int httpResponseCode = http.POST(jsonString);
        
        if (httpResponseCode == 200) {
            String response = http.getString();
            Serial.println("Sucesso: " + response);
        } else {
            Serial.println("Erro: " + String(httpResponseCode));
            Serial.println("Resposta: " + http.getString());
        }
        
        http.end();
    }
    
    delay(60000); // Enviar a cada 1 minuto
}
```

### Python (Raspberry Pi)

```python
import requests
import json
import time
from datetime import datetime

SERVER_URL = "http://seu-servidor:8000/api/iot/dados/"
COLMEIA_ID = "CLM-001"  # Identificador da colmeia
DEVICE_ID = "RaspberryPi-001"

def ler_sensores():
    """Lê os sensores e retorna os valores"""
    # Implementar leitura dos sensores aqui
    temperatura = 32.5  # Exemplo
    ruido = 45.2
    luminosidade = 850.0
    bateria = 85
    rssi = -65
    
    return {
        "temperatura": temperatura,
        "nivel_ruido": ruido,
        "luminosidade": luminosidade,
        "bateria_nivel": bateria,
        "sinal_rssi": rssi
    }

def enviar_dados():
    """Envia dados dos sensores para o servidor"""
    dados = ler_sensores()
    
    payload = {
        "colmeia_identificador": COLMEIA_ID,
        "temperatura": dados["temperatura"],
        "nivel_ruido": dados["nivel_ruido"],
        "luminosidade": dados["luminosidade"],
        "dispositivo_id": DEVICE_ID,
        "bateria_nivel": dados["bateria_nivel"],
        "sinal_rssi": dados["sinal_rssi"]
    }
    
    try:
        response = requests.post(
            SERVER_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"[{datetime.now()}] ✅ Dados enviados: {result['message']}")
        else:
            error = response.json()
            print(f"[{datetime.now()}] ❌ Erro {response.status_code}: {error.get('error', 'Erro desconhecido')}")
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Erro ao enviar: {e}")

if __name__ == "__main__":
    while True:
        enviar_dados()
        time.sleep(60)  # Enviar a cada 1 minuto
```

### Node.js (NodeMCU/ESP8266)

```javascript
const axios = require('axios');

const SERVER_URL = 'http://seu-servidor:8000/api/iot/dados/';
const COLMEIA_ID = 'CLM-001';  // Identificador da colmeia
const DEVICE_ID = 'NodeMCU-001';

async function lerSensores() {
    // Implementar leitura dos sensores
    return {
        temperatura: 32.5,
        nivel_ruido: 45.2,
        luminosidade: 850.0,
        bateria_nivel: 85,
        sinal_rssi: -65
    };
}

async function enviarDados() {
    try {
        const sensores = await lerSensores();
        
        const payload = {
            colmeia_identificador: COLMEIA_ID,
            temperatura: sensores.temperatura,
            nivel_ruido: sensores.nivel_ruido,
            luminosidade: sensores.luminosidade,
            dispositivo_id: DEVICE_ID,
            bateria_nivel: sensores.bateria_nivel,
            sinal_rssi: sensores.sinal_rssi
        };
        
        const response = await axios.post(SERVER_URL, payload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log(`[${new Date().toISOString()}] ✅ ${response.data.message}`);
    } catch (error) {
        if (error.response) {
            console.error(`[${new Date().toISOString()}] ❌ Erro ${error.response.status}:`, error.response.data.error);
        } else {
            console.error(`[${new Date().toISOString()}] ❌ Erro:`, error.message);
        }
    }
}

// Enviar a cada 1 minuto
setInterval(enviarDados, 60000);
```

### cURL (Teste Rápido)

```bash
curl -X POST http://localhost:8000/api/iot/dados/ \
  -H "Content-Type: application/json" \
  -d '{
    "colmeia_identificador": "CLM-001",
    "temperatura": 32.5,
    "nivel_ruido": 45.2,
    "luminosidade": 850.0,
    "dispositivo_id": "ESP32-001",
    "bateria_nivel": 85,
    "sinal_rssi": -65
  }'
```

---

## 📈 Visualização dos Dados

Os dados dos sensores podem ser visualizados:

1. **No Dashboard:** Campos de temperatura, ruído e luminosidade aparecem nas colmeias
2. **Via API:** Use o endpoint de histórico para obter leituras
3. **No Admin Django:** Histórico completo de leituras disponível

---

## 🔧 Como Funciona

1. **Identifique a colmeia:** Use o `identificador` da colmeia (ex: "CLM-001")
2. **Envie os dados:** Faça uma requisição POST simples com os dados dos sensores
3. **Sistema atualiza automaticamente:**
   - Atualiza os campos atuais da colmeia
   - Cria registro no histórico
   - Ativa o sensor IoT automaticamente

---

## 📝 Notas Importantes

- ✅ **Sem autenticação necessária** - Requisições simples e diretas
- ✅ **Identificação por código** - Use o identificador da colmeia
- ✅ **Campos opcionais** - Envie apenas os dados que você tem
- ✅ **Ativação automática** - Sensor IoT é ativado ao receber dados
- ✅ **Histórico completo** - Todas as leituras são salvas para análise
- ✅ **Validação automática** - Sistema valida os dados recebidos

---

## 🚀 Exemplo de Uso Completo

```python
import requests

# Dados do sensor
dados = {
    "colmeia_identificador": "CLM-001",
    "temperatura": 32.5,
    "nivel_ruido": 45.2,
    "luminosidade": 850.0
}

# Enviar para o servidor
response = requests.post(
    "http://localhost:8000/api/iot/dados/",
    json=dados
)

if response.status_code == 200:
    print("✅ Dados enviados com sucesso!")
    print(response.json())
else:
    print("❌ Erro:", response.json())
```

---

**Desenvolvido para Smart-Hive - Sistema de Gerenciamento de Apiário**
