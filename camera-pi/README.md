# Câmera ao vivo (Raspberry Pi 5)

A câmera só transmite enquanto alguém está com a aba **Câmera ao Vivo** aberta na plataforma.

```
aba "Câmera ao Vivo" ──POST /api/camera/ligar/ (heartbeat 30s)──▶ Django (sessão de 90s)
Pi ──GET /api/camera/pi/estado/ (a cada 3s)──▶ Django  →  {transmitir: true/false}
Pi ──RTSP/TCP :8554 (rpicam-vid | ffmpeg)──▶ MediaMTX ──HLS /camera/──▶ navegador
MediaMTX ──"pode publicar/assistir?"──▶ Django /api/camera/mediamtx-auth/
```

## 1. Servidor (VPS)

1. No `.env` da raiz, defina o segredo do MediaMTX:
   ```bash
   MEDIAMTX_AUTH_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
   ```
2. Libere a porta **8554/TCP** no firewall do VPS.
3. `docker-compose up -d` (o entrypoint do backend já roda as migrations).
4. No Django Admin → **Câmeras**, crie uma câmera (caminho `camera1`). Copie o **token** gerado.

## 2. Raspberry Pi

```bash
sudo apt install -y ffmpeg          # rpicam-apps já vem no Raspberry Pi OS
rpicam-hello -t 2000                # confere se a câmera funciona

sudo mkdir -p /opt/smarthive-camera
sudo cp camera_pi.py /opt/smarthive-camera/
sudo tee /etc/smarthive-camera.env <<'EOF'
SMARTHIVE_URL=http://SEU-VPS:8080
CAMERA_TOKEN=cole-o-token-aqui
EOF
sudo cp smarthive-camera.service /etc/systemd/system/
sudo systemctl enable --now smarthive-camera
journalctl -u smarthive-camera -f   # logs
```

Opcionais em `/etc/smarthive-camera.env`: `LARGURA`, `ALTURA`, `FPS` (padrão 1280×720 a 15 fps), `RTSP_HOST`, `RTSP_PORT`, `INTERVALO`.
Se o serviço rodar com outro usuário, ajuste `User=` no `.service`.

## 3. Testar no PC, sem o Pi

Com o backend rodando local (`MEDIAMTX_AUTH_SECRET=dev python manage.py runserver`) e uma câmera cadastrada no admin:

```bash
# MediaMTX local (na raiz do repo)
docker run --rm -p 8554:8554 -p 8888:8888 \
  -v "$PWD/mediamtx/mediamtx.yml:/mediamtx.yml:ro" \
  -e MTX_AUTHHTTPADDRESS="http://host.docker.internal:8000/api/camera/mediamtx-auth/?segredo=dev" \
  bluenviron/mediamtx:1.12.3

# "Pi" simulado: mesmo agente, mas com o padrão de teste do ffmpeg no lugar da câmera
SMARTHIVE_URL=http://localhost:8000 RTSP_HOST=localhost CAMERA_TOKEN=<token> CAMERA_FONTE=teste \
  python camera-pi/camera_pi.py
```

Abra `npm run dev` → **Câmera ao Vivo** → **Ligar câmera**. O Vite repassa `/camera/` para o MediaMTX em `:8888`.
