# Câmera ao vivo (Raspberry Pi 5)

A câmera só transmite enquanto alguém está com a aba **Câmera ao Vivo** aberta na plataforma.

```
aba "Câmera ao Vivo" ──POST /api/camera/ligar/  → sessão própria (uma por aba)
                     ──POST /api/camera/renovar/ a cada 30s (sessão vale 90s, máx. 30 min)
                     ──POST /api/camera/desligar/ ao sair/fechar a aba
Pi ──GET /api/camera/pi/estado/ (a cada 3s)──▶ Django → {transmitir: há sessão ativa?}
Pi ──RTSP/TCP :8554 (rpicam-vid | ffmpeg)──▶ MediaMTX ──HLS /camera/──▶ navegador
MediaMTX ──"pode publicar/assistir?"──▶ Django /api/camera/mediamtx-auth/ (rede interna)
```

## Comportamento

| Situação | O que acontece |
|---|---|
| Ninguém na aba | Pi não transmite (zero banda); só faz a consulta leve a cada 3s |
| Duas pessoas assistindo, uma sai | O vídeo continua para a outra |
| Aba fechada / internet do usuário cai | Sessão encerrada na hora (fechamento) ou em até 90s (queda) |
| Aba esquecida aberta | Desliga após 30 min (`CAMERA_SESSAO_MAX_MINUTOS`); botão "Continuar assistindo" |
| Aba fica oculta | Heartbeat pausa; ao voltar, a sessão é renovada/reaberta e o vídeo reconecta |
| Rede do Pi oscila | Transmissão continua; só para após 4 consultas seguidas sem resposta |
| ffmpeg/câmera cai logo após iniciar | Nova tentativa com espera crescente (2s, 4s, 8s... até 60s) |

## 1. Servidor (VPS)

1. Libere a porta **8554/TCP** no firewall do VPS (ex.: `sudo ufw allow 8554/tcp`).
2. Deploy normal (`bash deploy_clean.sh` ou `bash deploy.sh`). O script gera `MEDIAMTX_AUTH_SECRET` no `.env` na primeira vez (`scripts/garantir_segredo_camera.sh`).
3. No Django Admin → **Câmeras**, crie uma câmera (nome livre, caminho `camera1`). Copie o **token** gerado.

Opcional no `.env`: `CAMERA_SESSAO_MAX_MINUTOS` (padrão 30).

## 2. Raspberry Pi

Pré-requisito: Raspberry Pi OS com a câmera funcionando (`rpicam-hello -t 2000`).

```bash
# copie a pasta camera-pi para o Pi (git clone ou scp) e, dentro dela:
sudo bash install.sh http://SEU-VPS:8080 <TOKEN-DA-CAMERA>
```

O instalador instala o ffmpeg se faltar, cria o usuário de sistema `smarthive-camera` (grupo `video`), copia o agente para `/opt/smarthive-camera`, grava a configuração em `/etc/smarthive-camera.env` (permissão 600) e ativa o serviço `smarthive-camera` (inicia no boot e reinicia se cair). Rodar de novo atualiza o agente.

```bash
journalctl -u smarthive-camera -f     # logs
sudo systemctl restart smarthive-camera
```

Opcionais em `/etc/smarthive-camera.env` (depois `sudo systemctl restart smarthive-camera`):

| Variável | Padrão | Uso |
|---|---|---|
| `LARGURA` / `ALTURA` / `FPS` | 1280 / 720 / 15 | resolução e taxa de quadros |
| `BITRATE` | 1500k | teto de banda de upload do Pi (~0,2 MB/s) |
| `RTSP_HOST` / `RTSP_PORT` | host da URL / 8554 | se o MediaMTX estiver em outro endereço |
| `INTERVALO` | 3 | segundos entre consultas ao servidor |

Internet do apiário lenta? Baixe para `LARGURA=854 ALTURA=480 BITRATE=700k`.

## 3. Diagnóstico

| Sintoma | Onde olhar |
|---|---|
| Aba mostra "Pi offline" | `journalctl -u smarthive-camera` no Pi: `401` = token errado; "sem conexão" = URL/rede |
| "Ligando câmera..." e nunca abre | Porta 8554 bloqueada no VPS, ou `docker logs smarthive-mediamtx` mostrando publicação negada |
| Publicação negada no MediaMTX | `MEDIAMTX_AUTH_SECRET` vazio/diferente: confira `.env` e recrie os containers |
| "transmissão caiu logo após iniciar" repetido | Câmera ocupada por outro processo ou cabo da câmera; teste `rpicam-hello` |

## 4. Testar no PC, sem o Pi

Com o backend rodando local (`MEDIAMTX_AUTH_SECRET=dev python manage.py runserver`) e uma câmera cadastrada no admin:

```bash
# MediaMTX local (na raiz do repo)
docker run --rm -p 8554:8554 -p 8888:8888 \
  -v "$PWD/mediamtx/mediamtx.yml:/mediamtx.yml:ro" \
  -e MTX_AUTHHTTPADDRESS="http://host.docker.internal:8000/api/camera/mediamtx-auth/?segredo=dev" \
  bluenviron/mediamtx:1.12.3

# "Pi" simulado: o mesmo agente, com o padrão de teste do ffmpeg no lugar da câmera
SMARTHIVE_URL=http://localhost:8000 RTSP_HOST=localhost CAMERA_TOKEN=<token> CAMERA_FONTE=teste \
  python camera-pi/camera_pi.py
```

Abra `npm run dev` → **Câmera ao Vivo** → **Ligar câmera**. O Vite repassa `/camera/` para o MediaMTX em `:8888`.

Testes do agente: `python -m unittest camera-pi/test_camera_pi.py`.
