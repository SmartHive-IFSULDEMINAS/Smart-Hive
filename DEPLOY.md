# Smart-Hive - Quick Deploy Guide

## 🚀 Deploy Rápido (3 passos)

### 1️⃣ Enviar projeto para VPS
```bash
# Comprimir projeto
tar -czf smart-hive.tar.gz Smart-Hive/

# Enviar para VPS
scp smart-hive.tar.gz root@SEU_IP:/root/

# Na VPS: Descompactar
ssh root@SEU_IP
cd /root
tar -xzf smart-hive.tar.gz
cd Smart-Hive
```

### 2️⃣ Executar script de deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3️⃣ Acessar aplicação
```
http://SEU_IP:8080
```

**Admin Django:**
- URL: `http://SEU_IP:8080/admin/`
- Usuário: `admin`
- Senha: `admin123` (ALTERAR!)

---

## 📚 Documentação Completa

Para instruções detalhadas, troubleshooting e configurações avançadas, consulte o arquivo **implementation_plan.md** nos artefatos.

---

## ⚡ Comandos Rápidos

```bash
# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Parar
docker-compose down

# Atualizar aplicação
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 🔧 Customização

Edite o arquivo `.env` para configurar:
- SECRET_KEY
- ALLOWED_HOSTS
- Outras variáveis

---

**Smart-Hive** 🐝
