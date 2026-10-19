# Raspberry Pi: câmera ao vivo e agendamento do monitoramento

A câmera só transmite enquanto alguém está com a aba **Câmera ao Vivo** aberta na plataforma.

```
aba "Câmera ao Vivo" ──POST /api/camera/ligar/  → sessão própria (uma por aba)
                     ──POST /api/camera/renovar/ a cada 30s (sessão vale 90s, máx. 30 min)
                     ──POST /api/camera/desligar/ ao sair/fechar a aba
Pi ──GET /api/camera/pi/estado/ (a cada 3s)──▶ Django → {transmitir: há sessão ativa?}
Pi ──RTSP/TCP :8554 (rpicam-vid | ffmpeg)──▶ MediaMTX ──HLS /hls/──▶ navegador
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

> **Atalho com Claude Code** — dois subagentes em `.claude/agents/` fazem os passos 2.2 a 2.4 sozinhos e relatam o resultado:
> - **Rodando no próprio Pi** (`configurar-camera-no-pi`): com o Pi preparado (2.1), instale o Claude Code nele, clone o repositório e, dentro da pasta, peça *"configura a câmera, token XXXX"*.
> - **A partir do seu PC via SSH** (`configurar-raspberry`): com acesso SSH por chave ao Pi, peça *"configura o raspberry: IP 192.168.0.50, usuário pi, token XXXX"*.

### 2.1 Preparar o Pi

1. Grave o **Raspberry Pi OS (Bookworm, 64-bit)** no cartão com o [Raspberry Pi Imager](https://www.raspberrypi.com/software/). Nas opções do Imager, configure Wi-Fi, usuário/senha e **ative o SSH**.
2. Com o Pi **desligado**, conecte a câmera no conector **CAM/DISP**. O lado azul da fita fica virado para os conectores USB/Ethernet.
3. Ligue o Pi, entre por SSH (`ssh usuario@IP-DO-PI`) e teste a câmera:
   ```bash
   rpicam-hello -t 2000
   ```
   - `rpicam-hello: command not found` (imagem Lite): `sudo apt install -y rpicam-apps`
   - `no cameras available`: desligue o Pi e confira o encaixe e a orientação da fita

### 2.2 Levar a pasta `camera-pi` para o Pi

O Pi só precisa desta pasta. Escolha uma das opções:

```bash
# A) direto do GitHub (no Pi)
git clone https://github.com/SmartHive-IFSULDEMINAS/Smart-Hive.git
cd Smart-Hive/camera-pi
```

```bash
# B) copiando do PC (no PC, na raiz do repositório) — mais simples se o repositório for privado
scp -r camera-pi usuario@IP-DO-PI:~/
# depois, no Pi:
cd ~/camera-pi
```

### 2.3 Instalar

Com o token da câmera (passo 3 da seção 1), dentro da pasta `camera-pi`:

```bash
sudo bash install.sh http://IP-OU-DOMINIO-DO-VPS:8080 <TOKEN-DA-CAMERA>
```

O instalador instala o ffmpeg se faltar, cria o usuário de sistema `smarthive-camera` (grupo `video`), copia o agente para `/opt/smarthive-camera`, grava a configuração em `/etc/smarthive-camera.env` (permissão 600) e ativa o serviço `smarthive-camera` (inicia no boot e reinicia se cair). Rodar de novo atualiza o agente.

```bash
journalctl -u smarthive-camera -f     # logs
sudo systemctl restart smarthive-camera
```

### 2.4 Conferir se funcionou

Com `journalctl -u smarthive-camera -f` aberto no Pi:

1. Logo após instalar, deve aparecer `consultando http://... a cada 3.0s`, e a aba **Câmera ao Vivo** da plataforma mostra **Pi online**.
2. Clique em **Ligar câmera**: no log aparece `transmissão iniciada`, e o vídeo abre na aba em 5-10s.
3. Feche a aba: no log aparece `transmissão encerrada`.

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
| Aba mostra "Pi offline" | `journalctl -u smarthive-camera` no Pi: `servidor recusou o token (401)` = token errado (rode `sudo bash install.sh URL TOKEN` de novo com o token certo); `sem conexão com o servidor` = URL errada ou Pi sem internet |
| `rpicam-hello` diz "no cameras available" | Fita da câmera mal encaixada ou invertida (desligue o Pi antes de mexer) |
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

Abra `npm run dev` → **Câmera ao Vivo** → **Ligar câmera**. O Vite repassa `/hls/` para o MediaMTX em `:8888`.

Testes do agente: `python -m unittest camera-pi/test_camera_pi.py`.

## 5. Agendamento do monitoramento

O mesmo `install.sh` instala um segundo serviço, **`smarthive-monitoramento`**, que mantém o código de monitoramento das abelhas rodando só no horário configurado na plataforma (**Sistema → Agendamento do Monitoramento**), todos os dias. Fora do horário só o processo de monitoramento para; o Pi, a câmera ao vivo e os outros serviços continuam funcionando.

```
tela "Agendamento do Monitoramento" ──PUT /api/monitoramento/agendamento/──▶ Django (SQLite)
Pi (smarthive-monitoramento) ──POST /api/monitoramento/pi/ (a cada 10s, X-Camera-Token)──▶ Django
     relata o estado real do processo ◀── recebe horário + versão da configuração
     grava a configuração em /var/lib/smarthive-monitoramento/agendamento.json
     decide pelo relógio do Pi (fuso America/Sao_Paulo) e inicia/encerra MONITORAMENTO_CMD
```

### Configurar o comando

O agendador não sabe o que é o monitoramento: ele executa o comando definido em `MONITORAMENTO_CMD` no `/etc/smarthive-camera.env`.

```bash
sudo MONITORAMENTO_CMD="/usr/bin/python3 /opt/abelhas/captura.py" bash install.sh   # ou edite o .env
sudo systemctl restart smarthive-monitoramento
journalctl -u smarthive-monitoramento -f      # logs do agendador E do monitoramento
```

| Variável | Padrão | Uso |
|---|---|---|
| `MONITORAMENTO_CMD` | — | comando do monitoramento. Sem ele, a tela mostra "Monitoramento não configurado no Raspberry Pi" |
| `MONITORAMENTO_DIR_TRABALHO` | — | diretório em que o comando roda |
| `MONITORAMENTO_TIMEOUT_PARADA` | 60 | segundos que o monitoramento tem para terminar o trabalho em andamento depois do SIGTERM |
| `MONITORAMENTO_INTERVALO` | 10 | segundos entre verificações (também é o tempo máximo para uma alteração na tela valer) |

O monitoramento roda como o usuário `smarthive-camera` (grupo `video`). Se precisar de outros acessos (GPIO, I2C, pastas), use `sudo systemctl edit smarthive-monitoramento` (ex.: `SupplementaryGroups=video gpio i2c`).

**O que o código de monitoramento precisa fazer:** tratar o **SIGTERM** terminando a operação em andamento (captura, inferência, gravação, envio) e saindo. Se não sair dentro de `MONITORAMENTO_TIMEOUT_PARADA`, o agendador manda SIGKILL para ele e seus subprocessos e registra isso no log e na tela. Toda a saída do processo vai para o `journalctl`.

> A câmera do Pi atende um processo por vez. Se o monitoramento usar a câmera, a **Câmera ao Vivo** não consegue transmitir enquanto ele estiver rodando (e vice-versa).

### Comportamento

| Situação | O que acontece |
|---|---|
| Agendamento desativado (padrão) | Monitoramento roda continuamente, como antes do agendamento existir |
| Ativo, 07:00–15:00 | Roda de 07:00 (inclusive) até 15:00 (exclusive), todos os dias |
| Horário alterado na tela | Vale em até 10s: inicia ou encerra na hora, sem esperar o dia seguinte |
| Pi reinicia às 10:00 | O serviço sobe no boot, lê a configuração salva e inicia o monitoramento |
| Pi reinicia às 16:00 | Fica parado até as 07:00 do dia seguinte |
| Servidor/internet fora do ar | Segue a última configuração salva em disco (sem nenhuma salva: contínuo) |
| Monitoramento cai sozinho | Reinicia; se cair em menos de 30s, tenta de novo com espera crescente (5s, 10s, ... até 5 min) e a tela mostra "Falha ao iniciar" com o motivo |
| `systemctl stop smarthive-monitoramento` | Encerra o monitoramento de forma gradual antes de sair |

Intervalos que passam da meia-noite (ex.: 22:00–06:00) não são suportados nesta versão. O horário vem do relógio do Pi (sincronizado por NTP) convertido para `America/Sao_Paulo`, então o fuso configurado no sistema do Pi não importa.

Testes do agendador: `python -m unittest camera-pi/test_agendador_monitoramento.py` (os testes com processos reais só rodam em Linux).
