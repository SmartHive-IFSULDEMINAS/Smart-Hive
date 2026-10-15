#!/bin/bash
# Instala o agente da câmera ao vivo no Raspberry Pi como serviço systemd.
#
# Uso (dentro da pasta camera-pi, no Pi):
#   sudo bash install.sh <SMARTHIVE_URL> <CAMERA_TOKEN>
# Ex.:
#   sudo bash install.sh http://203.0.113.10:8080 AbCdEf...
#
# Rodar de novo atualiza o script e reinicia o serviço. Sem argumentos,
# mantém o /etc/smarthive-camera.env existente.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
    echo "Rode com sudo." >&2
    exit 1
fi

DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE=/etc/smarthive-camera.env
USUARIO=smarthive-camera

echo "[1/5] Dependências..."
if ! command -v ffmpeg >/dev/null; then
    apt-get update -qq && apt-get install -y -qq ffmpeg
fi
if ! command -v rpicam-vid >/dev/null; then
    echo "AVISO: rpicam-vid não encontrado (instale rpicam-apps). Só CAMERA_FONTE=teste vai funcionar." >&2
fi
command -v python3 >/dev/null || { echo "python3 não encontrado" >&2; exit 1; }

echo "[2/5] Usuário de sistema '$USUARIO' (grupo video)..."
if ! id "$USUARIO" >/dev/null 2>&1; then
    useradd --system --no-create-home --shell /usr/sbin/nologin --groups video "$USUARIO"
fi

echo "[3/5] Copiando agente para /opt/smarthive-camera..."
install -d -m 755 /opt/smarthive-camera
install -m 755 "$DIR/camera_pi.py" /opt/smarthive-camera/camera_pi.py

echo "[4/5] Configuração em $ENV_FILE..."
if [ $# -ge 2 ]; then
    umask 077
    cat > "$ENV_FILE" <<EOF
SMARTHIVE_URL=$1
CAMERA_TOKEN=$2
EOF
    chmod 600 "$ENV_FILE"
elif [ ! -f "$ENV_FILE" ]; then
    echo "Informe a URL e o token: sudo bash install.sh <SMARTHIVE_URL> <CAMERA_TOKEN>" >&2
    exit 1
fi

echo "[5/5] Serviço systemd..."
install -m 644 "$DIR/smarthive-camera.service" /etc/systemd/system/smarthive-camera.service
systemctl daemon-reload
systemctl enable smarthive-camera >/dev/null
systemctl restart smarthive-camera

sleep 2
systemctl --no-pager --lines=5 status smarthive-camera || true
echo
echo "Pronto. Logs: journalctl -u smarthive-camera -f"
