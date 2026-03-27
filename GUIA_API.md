# Smart-Hive — Guia de Uso da API

Base URL: `http://<seu-servidor>:8080/api`
Em desenvolvimento local: `http://localhost:8000/api`

---

## Autenticação

A maioria dos endpoints exige um token JWT no header.
Exceções (sem autenticação): endpoints IoT e IA.

```
Authorization: Bearer <seu_token>
```

---

## 1. Auth

### Login
```
POST /auth/login/
```
```json
{
    "username": "admin",
    "password": "admin123"
}
```
**Resposta:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGci...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGci...",
    "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@smarthive.com",
        "role": "dono"
    }
}
```

### Registrar usuário
```
POST /auth/register/
```
```json
{
    "username": "gabriel",
    "email": "gabriel@email.com",
    "password": "senha123",
    "password2": "senha123",
    "role": "apicultor"
}
```

### Dados do usuário logado
```
GET /auth/me/
Authorization: Bearer <token>
```

### Renovar token
```
POST /auth/token/refresh/
```
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGci..."
}
```

---

## 2. Apiários

### Listar
```
GET /apiarios/
Authorization: Bearer <token>
```
Parâmetros opcionais: `?search=nome&ordering=nome&page=1`

### Criar
```
POST /apiarios/
Authorization: Bearer <token>
```
```json
{
    "nome": "Apiário Serra Verde",
    "localizacao": "Fazenda Boa Esperança, MG",
    "latitude": -19.5432,
    "longitude": -43.8765,
    "descricao": "Apiário principal",
    "responsavel": "Gabriel",
    "telefone_contato": "(31) 99999-0000",
    "ativo": true
}
```

### Buscar por ID
```
GET /apiarios/{id}/
Authorization: Bearer <token>
```

### Atualizar
```
PUT /apiarios/{id}/
Authorization: Bearer <token>
```

### Deletar
```
DELETE /apiarios/{id}/
Authorization: Bearer <token>
```

### Colmeias do apiário
```
GET /apiarios/{id}/colmeias/
Authorization: Bearer <token>
```

### Estatísticas do apiário
```
GET /apiarios/{id}/estatisticas/
Authorization: Bearer <token>
```

---

## 3. Colmeias

### Listar
```
GET /colmeias/
Authorization: Bearer <token>
```
Parâmetros opcionais: `?apiario=1&status=ativa&search=CLM`

### Criar
```
POST /colmeias/
Authorization: Bearer <token>
```
```json
{
    "apiario": 1,
    "identificador": "CLM-001",
    "nome": "Colmeia Principal",
    "tipo_caixa": "langstroth",
    "status": "ativa",
    "especie": 1,
    "quantidade_abelhas_estimada": 50000,
    "numero_quadros": 10,
    "sensor_iot_ativo": false
}
```

**Valores aceitos:**
- `tipo_caixa`: `langstroth`, `apis`, `caixote`, `outro`
- `status`: `ativa`, `inativa`, `em_tratamento`, `abandonada`, `morta`

### Buscar por ID
```
GET /colmeias/{id}/
Authorization: Bearer <token>
```

### Histórico de sensor da colmeia
```
GET /colmeias/{id}/leituras_sensor/?limit=50
Authorization: Bearer <token>
```

---

## 4. Inspeções

### Listar
```
GET /inspecoes/
Authorization: Bearer <token>
```
Parâmetros: `?colmeia=1&condicao_geral=boa&ordering=-data`

### Criar
```
POST /inspecoes/
Authorization: Bearer <token>
```
```json
{
    "colmeia": 1,
    "data": "2026-03-25T10:00:00",
    "inspetor": "Gabriel",
    "condicao_geral": "boa",
    "presenca_rainha": true,
    "rainha_marcada": false,
    "quantidade_crias": "moderada",
    "quantidade_mel": "abundante",
    "presenca_pragas": false,
    "presenca_doencas": false,
    "observacoes": "Colmeia saudável"
}
```

**Valores aceitos:**
- `condicao_geral`: `excelente`, `boa`, `regular`, `ruim`, `critica`
- `quantidade_crias` / `quantidade_mel`: `abundante`, `moderada`, `baixa`, `ausente`

---

## 5. Produção de Mel

### Listar
```
GET /producoes/
Authorization: Bearer <token>
```

### Registrar colheita
```
POST /producoes/
Authorization: Bearer <token>
```
```json
{
    "colmeia": 1,
    "data_colheita": "2026-03-25",
    "quantidade_kg": 12.5,
    "tipo_mel": "silvestre",
    "qualidade": "premium",
    "preco_kg": 45.00,
    "observacoes": "Mel de alta qualidade"
}
```

**Valores aceitos:**
- `tipo_mel`: `silvestre`, `eucalipto`, `laranjeira`, `assa_peixe`, `outro`
- `qualidade`: `premium`, `tipo_1`, `tipo_2`, `abaixo_padrao`

### Relatório de produção
```
GET /producoes/relatorio/?data_inicio=2026-01-01&data_fim=2026-03-31
Authorization: Bearer <token>
```

---

## 6. Tratamentos

### Listar
```
GET /tratamentos/
Authorization: Bearer <token>
```

### Criar
```
POST /tratamentos/
Authorization: Bearer <token>
```
```json
{
    "colmeia": 1,
    "tipo_tratamento": "varroa",
    "data_inicio": "2026-03-20",
    "medicamento": "Amitraz",
    "dosagem": "2ml por quadro",
    "motivo": "Infestação de varroa detectada na inspeção",
    "status": "em_andamento"
}
```

**Valores aceitos:**
- `tipo_tratamento`: `varroa`, `nosema`, `loque`, `cria_giz`, `alimentacao`, `outro`
- `status`: `em_andamento`, `concluido`, `cancelado`

### Finalizar tratamento
```
POST /tratamentos/{id}/finalizar/
Authorization: Bearer <token>
```
```json
{
    "data_fim": "2026-03-27",
    "resultado": "Tratamento bem-sucedido, infestação controlada"
}
```

---

## 7. IoT — Sensores da Colmeia

> **Sem autenticação.** Usa `colmeia_identificador` para identificar o dispositivo.

### Enviar leitura de sensor
```
POST /iot/colmeia/dados/
```
```json
{
    "colmeia_identificador": "CLM-001",
    "temperatura": 34.5,
    "umidade": 65.2,
    "peso": 18.3,
    "nivel_ruido": 42.1,
    "luminosidade": 120.0,
    "pressao": 1013.25,
    "dispositivo_id": "ESP32-001",
    "bateria_nivel": 87,
    "sinal_rssi": -62
}
```
**Resposta:**
```json
{
    "success": true,
    "message": "Dados recebidos e salvos com sucesso",
    "colmeia": "CLM-001",
    "timestamp": "2026-03-25T18:30:00.000Z",
    "leitura_id": 42
}
```

### Histórico de leituras
```
GET /iot/colmeia/historico/CLM-001/?limit=100&offset=0
```

### IoT — Apiário (dados agregados)
```
POST /iot/apiario/dados/
```
```json
{
    "apiario_nome": "Apiário Serra Verde",
    "temperatura": 28.0,
    "dispositivo_id": "ESP32-APIARIO-01"
}
```

---

## 8. IA — Classificação Espectral de Pólen (AS7341)

> **Sem autenticação.** Chamado diretamente pelo dispositivo.

### Classificar amostra de pólen
```
POST /ia/polen/classificar/
```

**Formato A — objeto com chaves:**
```json
{
    "F1": 45,
    "F2": 89,
    "F3": 120,
    "F4": 200,
    "F5": 310,
    "F6": 280,
    "F7": 195,
    "F8": 87,
    "NIR": 520,
    "CLEAR": 95,
    "dispositivo_id": "AS7341-001"
}
```

**Formato B — array de 10 valores** (ordem: F1, F2, F3, F4, F5, F6, F7, F8, NIR, CLEAR):
```json
{
    "canais": [45, 89, 120, 200, 310, 280, 195, 87, 520, 95],
    "dispositivo_id": "AS7341-001"
}
```

**Resposta:**
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
        "F1": 0.020944,
        "F2": 0.041459,
        "F3": 0.055839,
        "F4": 0.093063,
        "F5": 0.144279,
        "F6": 0.130279,
        "F7": 0.090782,
        "F8": 0.040479,
        "NIR": 0.241888,
        "CLEAR": 0.044190
    },
    "canais_brutos": {
        "F1": 45, "F2": 89, "F3": 120, "F4": 200,
        "F5": 310, "F6": 280, "F7": 195, "F8": 87,
        "NIR": 520, "CLEAR": 95
    }
}
```

### Status dos modelos de IA
```
GET /ia/status/
```
```json
{
    "status": "pronto",
    "modelos_carregados": true,
    "canais": ["F1","F2","F3","F4","F5","F6","F7","F8","NIR","CLEAR"],
    "models_dir": "/app/ia_models"
}
```

### Listar histórico de classificações
```
GET /ia/classificacoes/
Authorization: Bearer <token>
```
Parâmetros opcionais:
- `?knn_classe=3` — filtrar por espécie
- `?kmeans_cluster=1` — filtrar por cluster
- `?data_inicio=2026-03-01&data_fim=2026-03-31` — filtrar por data
- `?ordering=-timestamp`

### Estatísticas das classificações
```
GET /ia/classificacoes/estatisticas/
Authorization: Bearer <token>
```
```json
{
    "total": 128,
    "distribuicao_knn": [
        { "knn_classe": 1, "total": 34 },
        { "knn_classe": 2, "total": 22 },
        { "knn_classe": 3, "total": 45 }
    ],
    "distribuicao_clusters": [
        { "kmeans_cluster": 0, "total": 18 },
        { "kmeans_cluster": 1, "total": 42 }
    ],
    "ultima_classificacao": { ... }
}
```

### Deletar classificação
```
DELETE /ia/classificacoes/{id}/
Authorization: Bearer <token>
```

---

## 9. Dashboard

### Geral
```
GET /dashboard/
Authorization: Bearer <token>
```

### Financeiro
```
GET /dashboard/financeiro/
Authorization: Bearer <token>
```

### Saúde das colmeias
```
GET /dashboard/saude/
Authorization: Bearer <token>
```

### Produtividade
```
GET /dashboard/produtividade/
Authorization: Bearer <token>
```

---

## 10. Exportações

> Retornam arquivo para download (Excel `.xlsx` ou PDF).

```
GET /export/apiarios/          → Excel
GET /export/colmeias/          → Excel
GET /export/producao/          → Excel
GET /export/financeiro/        → PDF
Authorization: Bearer <token>
```

---

## Exemplos práticos

### cURL — Login e usar token
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access'])")

# 2. Usar token
curl -s http://localhost:8000/api/apiarios/ \
  -H "Authorization: Bearer $TOKEN"
```

### cURL — Enviar leitura IoT
```bash
curl -X POST http://localhost:8000/api/iot/colmeia/dados/ \
  -H "Content-Type: application/json" \
  -d '{
    "colmeia_identificador": "CLM-001",
    "temperatura": 34.5,
    "umidade": 65.2,
    "peso": 18.3
  }'
```

### cURL — Classificar pólen
```bash
curl -X POST http://localhost:8000/api/ia/polen/classificar/ \
  -H "Content-Type: application/json" \
  -d '{
    "canais": [45, 89, 120, 200, 310, 280, 195, 87, 520, 95],
    "dispositivo_id": "AS7341-001"
  }'
```

### Python — Classificar pólen
```python
import requests

resposta = requests.post(
    "http://localhost:8000/api/ia/polen/classificar/",
    json={
        "F1": 45, "F2": 89, "F3": 120, "F4": 200,
        "F5": 310, "F6": 280, "F7": 195, "F8": 87,
        "NIR": 520, "CLEAR": 95
    }
)

r = resposta.json()
print(f"Espécie (KNN):  {r['knn']['label']}")
print(f"Cluster KMeans: {r['kmeans']['label']}")
```

### Arduino ESP32 — Enviar leitura IoT
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

void enviarLeitura(float temp, float umidade, float peso) {
    HTTPClient http;
    http.begin("http://<IP-VPS>:8080/api/iot/colmeia/dados/");
    http.addHeader("Content-Type", "application/json");

    String body = "{\"colmeia_identificador\":\"CLM-001\","
                  "\"temperatura\":" + String(temp) + ","
                  "\"umidade\":" + String(umidade) + ","
                  "\"peso\":" + String(peso) + "}";

    int code = http.POST(body);
    http.end();
}
```

### Arduino ESP32 — Classificar pólen (AS7341)
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

void classificarPolen(int canais[10]) {
    HTTPClient http;
    http.begin("http://<IP-VPS>:8080/api/ia/polen/classificar/");
    http.addHeader("Content-Type", "application/json");

    String body = "{\"canais\":["
        + String(canais[0]) + "," + String(canais[1]) + ","
        + String(canais[2]) + "," + String(canais[3]) + ","
        + String(canais[4]) + "," + String(canais[5]) + ","
        + String(canais[6]) + "," + String(canais[7]) + ","
        + String(canais[8]) + "," + String(canais[9]) + "]}";

    int code = http.POST(body);
    if (code == 200) {
        DynamicJsonDocument doc(512);
        deserializeJson(doc, http.getString());
        Serial.printf("Especie: %d | Cluster: %d\n",
            (int)doc["knn"]["classe"],
            (int)doc["kmeans"]["cluster"]);
    }
    http.end();
}
```

---

## Códigos de resposta

| Código | Significado |
|--------|-------------|
| `200` | Sucesso |
| `201` | Criado com sucesso |
| `400` | Dados inválidos / campos faltando |
| `401` | Token ausente ou expirado |
| `403` | Sem permissão |
| `404` | Recurso não encontrado |
| `503` | Serviço indisponível (modelos IA não carregados) |

---

## Paginação

Todos os endpoints de listagem retornam paginado (20 itens por página):

```json
{
    "count": 87,
    "next": "http://localhost:8000/api/apiarios/?page=2",
    "previous": null,
    "results": [ ... ]
}
```

Parâmetros: `?page=2` ou `?limit=50&offset=0`
