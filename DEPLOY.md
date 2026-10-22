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

Antes, no `.env`, defina `POSTGRES_PASSWORD` (gere com `openssl rand -hex 24`), `SMARTHIVE_DADOS` (pasta onde ficam banco e uploads, ex.: `/root/smarthive-dados`) e, só no primeiro deploy, `DJANGO_SUPERUSER_PASSWORD` para criar o admin.

```bash
chmod +x deploy.sh
./deploy.sh
```

### 3️⃣ Acessar aplicação
```
http://SEU_IP:8080
```

**Admin Django:** `http://SEU_IP:8080/admin/`, com o usuário criado por `DJANGO_SUPERUSER_PASSWORD` (ou `docker exec -it smarthive-backend python manage.py createsuperuser`).

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

# Parar (NUNCA use `down -v`: o -v apaga volumes)
docker-compose stop

# Atualizar aplicação (faz backup antes)
bash deploy_clean.sh
```

---

## 💾 Banco de dados e backup

- O banco é **PostgreSQL** (container `smarthive-postgres`, sem porta exposta). Os dados ficam em `$SMARTHIVE_DADOS/postgres` e os uploads em `$SMARTHIVE_DADOS/media`: pastas do host, não volumes do Docker, então nem `docker compose down -v` os apaga.
- **Backup diário** às 03:30 (banco com `pg_dump` + snapshots dos uploads), guardado por 30 dias em `/root/backups/smarthive/`:
  ```bash
  sudo bash scripts/instalar_backup.sh      # agenda no cron e já roda um backup
  bash scripts/backup_smarthive.sh          # backup manual
  tail /var/log/smarthive-backup.log        # conferir
  ```
- **Restaurar** um backup do banco:
  ```bash
  bash scripts/restaurar_banco.sh /root/backups/smarthive/banco/smarthive-AAAAMMDD-HHMMSS.dump
  ```
- Os backups ficam na própria VPS: protegem contra erro humano e bug, não contra perder a VPS. Copie de vez em quando para outro lugar (ex.: `scp -r root@SEU_IP:/root/backups/smarthive .`).

Na VPS de produção, as portas 80/443 e os certificados vêm de `docker-compose.override.yml` (copie de `nginx/producao/docker-compose.override.yml`).

---

## 🔧 Customização

Edite o arquivo `.env` para configurar:
- SECRET_KEY
- ALLOWED_HOSTS
- Outras variáveis

---

**Smart-Hive** 🐝
