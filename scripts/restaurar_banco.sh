#!/bin/bash
# Restaura o banco do Smart-Hive a partir de um backup do backup_smarthive.sh.
#
#   bash scripts/restaurar_banco.sh /root/backups/smarthive/banco/smarthive-AAAAMMDD-HHMMSS.dump
#
# ATENÇÃO: substitui todo o conteúdo atual do banco pelo do arquivo. Antes de
# restaurar, faz um backup do estado atual (por via das dúvidas).
set -euo pipefail

ARQUIVO=${1:?informe o arquivo .dump a restaurar}
CONTAINER=${CONTAINER:-smarthive-postgres}
DIR_PROJETO="$(cd "$(dirname "$0")/.." && pwd)"

[ -f "$ARQUIVO" ] || { echo "Arquivo não encontrado: $ARQUIVO" >&2; exit 1; }
docker exec -i "$CONTAINER" pg_restore --list < "$ARQUIVO" > /dev/null || {
    echo "O arquivo não parece um dump válido do pg_dump." >&2; exit 1; }

read -r -p "Substituir o banco atual por $(basename "$ARQUIVO")? Digite RESTAURAR: " resposta
[ "$resposta" = "RESTAURAR" ] || { echo "Cancelado."; exit 1; }

echo "[1/4] Backup do estado atual..."
bash "$DIR_PROJETO/scripts/backup_smarthive.sh"

echo "[2/4] Parando o backend (o banco continua no ar)..."
docker stop smarthive-backend >/dev/null

echo "[3/4] Restaurando..."
docker exec -i "$CONTAINER" pg_restore -U smarthive -d smarthive --clean --if-exists --no-owner < "$ARQUIVO"

echo "[4/4] Subindo o backend..."
docker start smarthive-backend >/dev/null
echo "Pronto."
