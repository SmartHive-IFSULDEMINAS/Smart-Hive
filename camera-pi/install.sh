#!/bin/bash
# Instala no Raspberry Pi, como serviços systemd, o agente da câmera ao vivo
# (smarthive-camera) e o agendador do monitoramento (smarthive-monitoramento).
#
# Uso (dentro da pasta camera-pi, no Pi):
#   sudo bash install.sh <SMARTHIVE_URL> <CAMERA_TOKEN>
# Ex.:
#   sudo bash install.sh http://203.0.113.10:8080 AbCdEf...
#   sudo MONITORAMENTO_CMD="/usr/bin/python3 /opt/abelhas/captura.py" bash install.sh http://... AbCdEf...
#
# Rodar de novo atualiza os scripts e reinicia os serviços. Sem argumentos,
# mantém o /etc/smarthive-camera.env existente. Com argumentos, troca só a
# URL e o token: as demais variáveis do arquivo (ex.: MONITORAMENTO_CMD) são
# mantidas.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
    echo "Rode com sudo." >&2
    exit 1
fi

DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE=/etc/smarthive-camera.env
USUARIO=smarthive-camera

echo "[1/6] Dependências..."
if ! command -v ffmpeg >/dev/null; then
    apt-get update -qq && apt-get install -y -qq ffmpeg
fi
if ! command -v rpicam-vid >/dev/null; then
    echo "AVISO: rpicam-vid não encontrado (instale rpicam-apps). Só CAMERA_FONTE=teste vai funcionar." >&2
fi
command -v python3 >/dev/null || { echo "python3 não encontrado" >&2; exit 1; }

echo "[2/6] Usuário de sistema '$USUARIO' (grupo video)..."
if ! id "$USUARIO" >/dev/null 2>&1; then
    useradd --system --no-create-home --shell /usr/sbin/nologin --groups video "$USUARIO"
fi

echo "[3/6] Copiando agentes para /opt/smarthive-camera..."
install -d -m 755 /opt/smarthive-camera
install -m 755 "$DIR/camera_pi.py" /opt/smarthive-camera/camera_pi.py
install -m 755 "$DIR/agendador_monitoramento.py" /opt/smarthive-camera/agendador_monitoramento.py

# Reescreve o arquivo trocando (ou acrescentando) uma variável e mantendo as demais
definir_variavel() {
    local nome="$1" valor="$2" novo
    novo=$(mktemp)
    { [ -f "$ENV_FILE" ] && grep -v "^$nome=" "$ENV_FILE" || true; echo "$nome=$valor"; } > "$novo"
    chmod 600 "$novo"
    mv "$novo" "$ENV_FILE"
}

echo "[4/6] Configuração em $ENV_FILE..."
if [ $# -ge 2 ]; then
    definir_variavel SMARTHIVE_URL "$1"
    definir_variavel CAMERA_TOKEN "$2"
elif [ ! -f "$ENV_FILE" ]; then
    echo "Informe a URL e o token: sudo bash install.sh <SMARTHIVE_URL> <CAMERA_TOKEN>" >&2
    exit 1
fi
if [ -n "${MONITORAMENTO_CMD:-}" ]; then
    definir_variavel MONITORAMENTO_CMD "$MONITORAMENTO_CMD"
fi
if ! grep -q '^MONITORAMENTO_CMD=' "$ENV_FILE"; then
    echo "AVISO: MONITORAMENTO_CMD não definido em $ENV_FILE; o agendador vai relatar 'comando não configurado'." >&2
fi

echo "[5/6] Serviço da câmera ao vivo..."
install -m 644 "$DIR/smarthive-camera.service" /etc/systemd/system/smarthive-camera.service

echo "[6/6] Serviço do agendador do monitoramento..."
install -m 644 "$DIR/smarthive-monitoramento.service" /etc/systemd/system/smarthive-monitoramento.service

systemctl daemon-reload
systemctl enable smarthive-camera smarthive-monitoramento >/dev/null
systemctl restart smarthive-camera smarthive-monitoramento

sleep 2
systemctl --no-pager --lines=5 status smarthive-camera smarthive-monitoramento || true
echo
echo "Pronto. Logs: journalctl -u smarthive-camera -f   |   journalctl -u smarthive-monitoramento -f"
