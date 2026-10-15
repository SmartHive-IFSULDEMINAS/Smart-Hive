#!/bin/bash

# Smart-Hive - Script de Deploy Limpo
# Execute: chmod +x deploy_clean.sh && ./deploy_clean.sh

set -e

echo "============================================="
echo "   Smart-Hive - Deploy Limpo"
echo "============================================="
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "ERRO: Docker nao instalado!"
    echo "Instale com: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "ERRO: Docker Compose nao instalado!"
    echo "Instale com: apt install docker-compose -y"
    exit 1
fi

echo "[1/6] Parando containers existentes..."
docker-compose down -v 2>/dev/null || docker compose down -v 2>/dev/null || true

echo "[2/6] Limpando cache do Docker..."
docker system prune -f 2>/dev/null || true

echo "[3/6] Atualizando codigo do Git..."
git pull

echo "[4/6] Verificando pasta dist do frontend..."
if [ ! -f "frontend/dist/index.html" ]; then
    echo "ERRO: Pasta frontend/dist nao encontrada!"
    echo "Execute 'npm run build' no seu PC e faca git push"
    exit 1
fi
echo "OK: frontend/dist/index.html encontrado"

# Câmera ao vivo: segredo MediaMTX <-> Django
bash scripts/garantir_segredo_camera.sh

echo "[5/6] Construindo imagens Docker..."
docker-compose build --no-cache 2>/dev/null || docker compose build --no-cache

echo "[6/6] Iniciando containers..."
docker-compose up -d 2>/dev/null || docker compose up -d

echo ""
echo "Aguardando servicos iniciarem..."
sleep 15

echo ""
echo "Status dos containers:"
docker-compose ps 2>/dev/null || docker compose ps

echo ""
echo "============================================="
echo "   DEPLOY CONCLUIDO!"
echo "============================================="
VPS_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "Acesse: http://$VPS_IP:8080"
echo "Admin:  http://$VPS_IP:8080/admin/"
echo "        Usuario: admin / Senha: admin123"
echo ""
echo "Comandos uteis:"
echo "  Ver logs:    docker-compose logs -f"
echo "  Ver backend: docker-compose logs backend"
echo "  Reiniciar:   docker-compose restart"
echo ""
