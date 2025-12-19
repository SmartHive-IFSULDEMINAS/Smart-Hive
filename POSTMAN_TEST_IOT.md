# 🧪 Teste IoT via Postman - Smart-Hive

## 📤 Atualizar Dados de Sensores de uma Colmeia

### Configuração da Requisição

**Método:** `POST`

**URL:** 
```
http://localhost:8000/api/iot/colmeia/dados/
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**

### Exemplo Completo - Todos os Campos

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

### Exemplo Mínimo - Apenas Campos Essenciais

```json
{
    "colmeia_identificador": "CLM-001",
    "temperatura": 32.5,
    "nivel_ruido": 45.2,
    "luminosidade": 850.0
}
```

### Exemplo com Novos Campos (Umidade, Pressão, Peso)

```json
{
    "colmeia_identificador": "CLM-001",
    "temperatura": 32.5,
    "umidade": 65.5,
    "pressao": 1013.25,
    "peso": 45.8
}
```

### Resposta de Sucesso (200 OK)

```json
{
    "success": true,
    "message": "Dados recebidos e salvos com sucesso",
    "colmeia": "CLM-001",
    "timestamp": "2024-01-15T10:30:00.123456Z",
    "leitura_id": 123
}
```

### Resposta de Erro - Colmeia Não Encontrada (404)

```json
{
    "success": false,
    "error": "Colmeia com identificador \"CLM-999\" não encontrada"
}
```

### Resposta de Erro - Dados Inválidos (400)

```json
{
    "success": false,
    "error": "colmeia_identificador é obrigatório"
}
```

---

## 📤 Atualizar Dados de Sensores de um Apiário

### Configuração da Requisição

**Método:** `POST`

**URL:** 
```
http://localhost:8000/api/iot/apiario/dados/
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**

### Exemplo Completo

```json
{
    "apiario_id": 1,
    "temperatura": 28.5,
    "latitude": -23.5505,
    "longitude": -46.6333
}
```

### Exemplo Alternativo (por Nome)

```json
{
    "apiario_nome": "Apiário Principal",
    "temperatura": 28.5,
    "latitude": -23.5505,
    "longitude": -46.6333
}
```

### Resposta de Sucesso (200 OK)

```json
{
    "success": true,
    "message": "Dados do apiário recebidos e salvos com sucesso",
    "apiario": "Apiário Principal",
    "apiario_id": 1,
    "timestamp": "2024-01-15T10:30:00.123456Z"
}
```

---

## 📋 Passo a Passo no Postman

### 1. Criar Nova Requisição
- Clique em "New" → "HTTP Request"
- Nome: "IoT - Atualizar Colmeia CLM-001"

### 2. Configurar Método e URL
- Método: Selecione **POST** no dropdown
- URL: Digite `http://localhost:8000/api/iot/colmeia/dados/`

### 3. Configurar Headers
- Clique na aba **Headers**
- Adicione:
  - Key: `Content-Type`
  - Value: `application/json`

### 4. Configurar Body
- Clique na aba **Body**
- Selecione **raw**
- No dropdown ao lado, selecione **JSON**
- Cole o JSON de exemplo abaixo

### 5. Enviar Requisição
- Clique no botão **Send**
- Verifique a resposta na parte inferior

---

## 🎯 JSON de Teste Completo para CLM-001

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

---

## 🔍 Validações

### Campos Obrigatórios
- ✅ `colmeia_identificador` (obrigatório)

### Campos Opcionais (mas pelo menos um deve ser enviado)
- `temperatura` (opcional)
- `nivel_ruido` (opcional)
- `luminosidade` (opcional)
- `umidade` (opcional)
- `pressao` (opcional)
- `peso` (opcional)
- `dispositivo_id` (opcional)
- `bateria_nivel` (opcional, 0-100)
- `sinal_rssi` (opcional)

### Valores de Exemplo Realistas

**Temperatura:**
- Normal: 25-35°C
- Alta: > 35°C
- Baixa: < 20°C

**Nível de Ruído:**
- Normal: 30-60 dB
- Alto: > 60 dB
- Baixo: < 30 dB

**Luminosidade:**
- Escuro: < 100 lux
- Normal: 100-1000 lux
- Muito claro: > 1000 lux

**Umidade:**
- Baixa: < 30%
- Normal: 30-80%
- Alta: > 80%

**Pressão:**
- Normal: 980-1050 hPa

**Peso:**
- Varia conforme tamanho da colmeia: 20-80 kg

---

## 🚀 Testes Rápidos

### Teste 1: Apenas Temperatura
```json
{
    "colmeia_identificador": "CLM-001",
    "temperatura": 32.5
}
```

### Teste 2: Temperatura e Umidade
```json
{
    "colmeia_identificador": "CLM-001",
    "temperatura": 32.5,
    "umidade": 65.5
}
```

### Teste 3: Todos os Sensores
```json
{
    "colmeia_identificador": "CLM-001",
    "temperatura": 32.5,
    "nivel_ruido": 45.2,
    "luminosidade": 850.0,
    "umidade": 65.5,
    "pressao": 1013.25,
    "peso": 45.8
}
```

### Teste 4: Com Informações do Dispositivo
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

---

## ⚠️ Troubleshooting

### Erro 404 - Colmeia não encontrada
- Verifique se o identificador está correto (ex: "CLM-001")
- Certifique-se de que a colmeia existe no banco de dados

### Erro 400 - Dados inválidos
- Verifique se `colmeia_identificador` está presente
- Certifique-se de que pelo menos um campo de sensor foi enviado

### Erro 500 - Erro interno
- Verifique se o servidor está rodando
- Verifique os logs do Django para mais detalhes

---

## 📝 Notas

- ✅ **Sem autenticação necessária** - O endpoint é público
- ✅ **Ativação automática** - O sensor IoT é ativado automaticamente ao receber dados
- ✅ **Histórico completo** - Todas as leituras são salvas no histórico
- ✅ **Validação automática** - O sistema valida os dados recebidos

---

**Desenvolvido para Smart-Hive - Sistema de Gerenciamento de Apiário**

