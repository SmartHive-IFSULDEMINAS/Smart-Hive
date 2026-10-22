#!/bin/bash

# 🐝 Smart-Hive - Script de Deploy Rápido
# Execute este script na sua VPS para fazer o deploy completo

set -e

echo "🐝 =========================================="
echo "🐝   Smart-Hive - Deploy Rápido para VPS"
echo "🐝 =========================================="
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "📥 Instale o Docker primeiro: https://docs.docker.com/engine/install/"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado!"
    echo "📥 Instale o Docker Compose primeiro"
    exit 1
fi

echo "✅ Docker e Docker Compose estão instalados"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "📝 Criando .env a partir de .env.example..."
    cp .env.example .env
    
    # Gerar SECRET_KEY aleatória
    if command -v python3 &> /dev/null; then
        SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
        sed -i "s/change-this-to-a-random-secret-key/$SECRET_KEY/" .env
        echo "✅ SECRET_KEY gerada automaticamente"
    else
        echo "⚠️  Edite o arquivo .env e configure DJANGO_SECRET_KEY manualmente!"
    fi
    
    # Pegar IP da VPS
    VPS_IP=$(hostname -I | awk '{print $1}')
    sed -i "s/seu-ip-da-vps/$VPS_IP/" .env
    echo "✅ IP da VPS configurado: $VPS_IP"
    echo ""
    echo "⚠️  IMPORTANTE: Edite o arquivo .env e revise as configurações!"
    echo "    nano .env"
    echo ""
    read -p "Pressione ENTER após revisar o .env..."
fi

# Câmera ao vivo: segredo MediaMTX <-> Django
bash scripts/garantir_segredo_camera.sh

echo "💾 Backup do banco e dos uploads..."
# Backup antes de mexer em qualquer coisa (só se o banco já estiver no ar)
if docker ps --format '{{.Names}}' | grep -qx smarthive-postgres; then
    bash scripts/backup_smarthive.sh
fi
echo ""

echo "🔨 Construindo imagens Docker..."
docker-compose build
echo ""

echo "🚀 Iniciando containers..."
docker-compose up -d
echo ""

echo "⏳ Aguardando containers iniciarem..."
sleep 10
echo ""

echo "📊 Status dos containers:"
docker-compose ps
echo ""

echo "🔍 Verificando saúde dos serviços..."
sleep 5

# Testar API
if curl -s http://localhost:8080/api/dashboard/ > /dev/null; then
    echo "✅ API está respondendo!"
else
    echo "⚠️  API não está respondendo. Verifique os logs:"
    echo "    docker-compose logs backend"
fi

# Testar Frontend
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Frontend está respondendo!"
else
    echo "⚠️  Frontend não está respondendo. Verifique os logs:"
    echo "    docker-compose logs frontend"
fi

echo ""
echo "🎉 =========================================="
echo "🎉   Deploy Completo!"
echo "🎉 =========================================="
echo ""
VPS_IP=$(hostname -I | awk '{print $1}')
echo "📍 Aplicação disponível em:"
echo "   🌐 http://$VPS_IP:8080"
echo "   🔐 Admin: http://$VPS_IP:8080/admin/"
echo ""
echo "👤 Admin: crie com DJANGO_SUPERUSER_PASSWORD no .env (primeiro deploy)"
echo "   ou: docker exec -it smarthive-backend python manage.py createsuperuser"
echo ""
echo "📝 Comandos úteis:"
echo "   Ver logs:      docker-compose logs -f"
echo "   Reiniciar:     docker-compose restart"
echo "   Parar:         docker-compose stop   (nunca use down -v: apaga dados)"
echo "   Status:        docker-compose ps"
echo ""
echo "🐝 Smart-Hive rodando com sucesso! 🎉"
