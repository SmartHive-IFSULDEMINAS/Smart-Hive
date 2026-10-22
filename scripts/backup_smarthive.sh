#!/bin/bash
# Backup do Smart-Hive: banco PostgreSQL (pg_dump) + uploads (media).
#
# Roda no host (VPS), fora do Docker, e grava em BACKUP_DIR — que não é um
# volume do Docker, então `docker compose down -v` não o apaga.
#
#   bash scripts/backup_smarthive.sh            # manual
#   /etc/cron.d/smarthive-backup                # diário (scripts/instalar_backup.sh)
#
# Banco: um arquivo por execução (formato custom do pg_dump, restaurável com
#        scripts/restaurar_banco.sh), mantidos por RETENCAO_DIAS.
# Media: snapshots diários com rsync --link-dest (arquivos que não mudaram
#        viram hardlinks, então cada dia extra quase não ocupa espaço).
#
# Sai com código != 0 se algo falhar (aparece no log do cron).
set -euo pipefail

BACKUP_DIR=${BACKUP_DIR:-/root/backups/smarthive}
RETENCAO_DIAS=${RETENCAO_DIAS:-30}
CONTAINER=${CONTAINER:-smarthive-postgres}
DIR_PROJETO="$(cd "$(dirname "$0")/.." && pwd)"
# Mesma pasta de dados do docker-compose (SMARTHIVE_DADOS no .env)
SMARTHIVE_DADOS=${SMARTHIVE_DADOS:-$(grep -E '^SMARTHIVE_DADOS=' "$DIR_PROJETO/.env" 2>/dev/null | cut -d= -f2- || true)}
SMARTHIVE_DADOS=${SMARTHIVE_DADOS:-$DIR_PROJETO/dados}

AGORA=$(date +%Y%m%d-%H%M%S)
log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*"; }

mkdir -p "$BACKUP_DIR/banco" "$BACKUP_DIR/media"
chmod 700 "$BACKUP_DIR"

# ── Banco ──────────────────────────────────────────────────────────────────
DESTINO="$BACKUP_DIR/banco/smarthive-$AGORA.dump"
log "banco: pg_dump -> $DESTINO"
docker exec "$CONTAINER" pg_dump -U smarthive -d smarthive -Fc > "$DESTINO.parcial"
# Confere se o arquivo é um dump legível antes de considerá-lo válido
docker exec -i "$CONTAINER" pg_restore --list < "$DESTINO.parcial" > /dev/null
mv "$DESTINO.parcial" "$DESTINO"
chmod 600 "$DESTINO"
log "banco: ok ($(du -h "$DESTINO" | cut -f1))"

# ── Media ──────────────────────────────────────────────────────────────────
if [ -d "$SMARTHIVE_DADOS/media" ]; then
    ANTERIOR=$(ls -1d "$BACKUP_DIR"/media/20*[0-9] 2>/dev/null | tail -1 || true)
    SNAPSHOT="$BACKUP_DIR/media/$AGORA"
    log "media: $SMARTHIVE_DADOS/media -> $SNAPSHOT"
    rsync -a --delete ${ANTERIOR:+--link-dest="$ANTERIOR"} "$SMARTHIVE_DADOS/media/" "$SNAPSHOT.parcial/"
    mv "$SNAPSHOT.parcial" "$SNAPSHOT"
    log "media: ok ($(du -sh "$SNAPSHOT" | cut -f1))"
else
    log "media: pasta $SMARTHIVE_DADOS/media não existe, pulando"
fi

# ── Retenção ───────────────────────────────────────────────────────────────
find "$BACKUP_DIR/banco" -name 'smarthive-*.dump' -mtime +"$RETENCAO_DIAS" -delete
find "$BACKUP_DIR/banco" -name '*.parcial' -mmin +60 -delete
find "$BACKUP_DIR/media" -mindepth 1 -maxdepth 1 -type d -name '20*' -mtime +"$RETENCAO_DIAS" -exec rm -rf {} +
find "$BACKUP_DIR/media" -mindepth 1 -maxdepth 1 -type d -name '*.parcial' -mmin +60 -exec rm -rf {} +

log "concluído; backups do banco guardados: $(ls -1 "$BACKUP_DIR/banco" | wc -l)"
