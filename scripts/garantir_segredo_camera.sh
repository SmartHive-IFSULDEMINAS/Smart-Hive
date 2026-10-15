#!/bin/bash
# Garante MEDIAMTX_AUTH_SECRET no .env (segredo compartilhado entre o
# MediaMTX e o Django para a câmera ao vivo). Gera uma vez e reaproveita
# nos próximos deploys. Uso: bash scripts/garantir_segredo_camera.sh
set -e
cd "$(dirname "$0")/.."

touch .env
if grep -q '^MEDIAMTX_AUTH_SECRET=.\+' .env; then
    echo "OK: MEDIAMTX_AUTH_SECRET já configurado"
    exit 0
fi

sed -i '/^MEDIAMTX_AUTH_SECRET=/d' .env
SEGREDO=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
echo "MEDIAMTX_AUTH_SECRET=$SEGREDO" >> .env
echo "OK: MEDIAMTX_AUTH_SECRET gerado em .env"
