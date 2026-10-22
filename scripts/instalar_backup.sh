#!/bin/bash
# Agenda o backup diário do Smart-Hive no cron do host (VPS).
#
#   sudo bash scripts/instalar_backup.sh          # todo dia às 03:30
#   HORARIO="0 2 * * *" sudo bash scripts/instalar_backup.sh
#
# Log: /var/log/smarthive-backup.log
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Rode com sudo." >&2; exit 1; }

DIR_PROJETO="$(cd "$(dirname "$0")/.." && pwd)"
HORARIO=${HORARIO:-30 3 * * *}

cat > /etc/cron.d/smarthive-backup <<EOF
# Backup diário do Smart-Hive (banco + media). Gerado por scripts/instalar_backup.sh
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
$HORARIO root bash $DIR_PROJETO/scripts/backup_smarthive.sh >> /var/log/smarthive-backup.log 2>&1
EOF
chmod 644 /etc/cron.d/smarthive-backup

cat > /etc/logrotate.d/smarthive-backup <<EOF
/var/log/smarthive-backup.log {
    monthly
    rotate 6
    compress
    missingok
    notifempty
}
EOF

echo "Agendado: $HORARIO (cron do sistema). Log: /var/log/smarthive-backup.log"
echo "Rodando um backup agora para conferir..."
bash "$DIR_PROJETO/scripts/backup_smarthive.sh"
