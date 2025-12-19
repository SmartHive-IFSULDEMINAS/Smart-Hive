# 🔧 Deploy com Build Local (para VPS com pouca memória)

## Quando usar
Se a VPS tem menos de 2GB de RAM e o build falha com "out of memory"

## Passos no Windows (local)

### 1. Build local do frontend
```bash
cd Smart-Hive/frontend

# Instalar dependências (se ainda não fez)
npm install

# Build para produção
npm run build
```

Isso cria a pasta `dist/` com os arquivos buildados.

### 2. Usar Dockerfile alternativo
```bash
# Na pasta Smart-Hive
cd frontend
copy Dockerfile.prebuild Dockerfile
```

### 3. Enviar para VPS
```bash
# Comprimir tudo incluindo a pasta dist
cd ..
tar -czf smart-hive.tar.gz Smart-Hive/

# Enviar
scp smart-hive.tar.gz root@191.252.100.161:/root/
```

### 4. Deploy na VPS
```bash
# Na VPS
ssh root@191.252.100.161
cd /root
tar -xzf smart-hive.tar.gz
cd Smart-Hive
./deploy.sh
```

## Vantagens
- ✅ Não precisa de muita RAM na VPS
- ✅ Build muito mais rápido
- ✅ Menos chance de erros

## Desvantagens
- ❌ Precisa fazer build local antes de cada deploy
- ❌ Um passo extra no processo
