# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart-Hive is an apiary (beehive) management system: Django REST API backend + React (Vite, MUI) frontend, with IoT sensor ingestion, a computer-vision bee-counting integration, and an ML pollen classifier. The UI, model/field names, and most code comments are in Brazilian Portuguese — keep new code consistent with that.

## Commands

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver                 # Dev server on :8000
python manage.py createsuperuser
python manage.py seed_demo_data            # Populate DB with demo data
```

### Tests (backend only — all tests live in `backend/api/tests.py`)
```bash
cd backend
python manage.py test api                                         # all
python manage.py test api.tests.AlertaRuidoTests                  # one class
python manage.py test api.tests.AuthLoginTests.test_login_with_invalid_password_returns_401  # one test
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # Dev server on :5173 (proxies /api/ to 127.0.0.1:8000)
npm run build    # Production build → /dist
npm run lint     # ESLint
```

### Docker (production)
```bash
docker-compose up -d        # Start all services (entry on :8080)
bash deploy_clean.sh        # Deploy with cache cleanup (preferred for VPS)
```
See `DEPLOY.md` / `DEPLOY-PREBUILD.md` for the VPS flow (prebuild variant uses `frontend/Dockerfile.prebuild` with a locally built `dist`).

### API Docs (when running)
Swagger `/api/docs/`, ReDoc `/api/redoc/`, Django Admin `/admin/`.

## Architecture

### Backend (`backend/api/`)

- **`models.py`** — all domain models. Core: `Usuario` (custom user, roles `dono`/`gestor`/`apicultor`), `Apiario`, `Colmeia` (stores the *latest* sensor values directly on the row), `LeituraSensor` (sensor history), `Inspecao`, `ProducaoMel`, `ColetaProduto` (pollen/propolis harvests), `Tratamento`, financial (`Custo`, `Receita`, `Fornecedor`, `Equipamento`), `Notificacao`, `AlertaRuidoConfig`, `ContagemAbelha` (bee detection counts), `ClassificacaoPolen` (ML results). Audit log model is in `audit_models.py`.
- **`views.py`** — DRF ViewSets + dashboard views (`/dashboard/`, `financeiro`, `saude`, `produtividade`, `comparativo`, `previsao`). Routes are all in `urls.py`.
- Concern-specific view modules:
  - `auth_views.py` — register/login/me/profile. `me` returns permission flags derived from role; role escalation via profile/usuarios endpoints is explicitly blocked (covered by tests).
  - `iot_views.py` — sensor ingestion (`/iot/colmeia/dados/`, bulk JSON upload, history). **No auth**: hive is looked up by `colmeia_identificador`. Every reading goes through `_registrar_leitura`, which updates `Colmeia`, writes `LeituraSensor`, and calls `alert_utils.gerar_alertas_sensores`.
  - `apiario_iot_views.py` — apiary-level IoT ingestion.
  - `deteccao_views.py` — receives bee/pollen counts from an external computer-vision pipeline (separate repo). Same shape as IoT endpoints, but checks `Colmeia.token_iot` when one is configured.
  - `ia_views.py` — pollen classification from AS7341 spectral readings (columns `F1..F8, NIR, CLEAR`), single classify + CSV import. Loads pickled scikit-learn models lazily from `IA_MODELS_DIR` (falls back to `../IA-smart_hive/models`).
  - `export_views.py` / `export_utils.py` — Excel (openpyxl) and PDF (reportlab) downloads.
  - `camera_views.py` — on-demand live camera (Raspberry Pi 5 → MediaMTX → HLS). Each browser tab owns an `EspectadorCamera` session (`ligar`/`renovar` heartbeat/`desligar`, capped by `CAMERA_SESSAO_MAX_MINUTOS`); the camera streams while any session is unexpired. The Pi polls `camera/pi/estado/` (it sits behind NAT). MediaMTX authorizes publish/read through the `camera/mediamtx-auth/` webhook (shared secret in query string, blocked externally in nginx; positive read decisions cached ~10s because it's called per HLS request). Pi agent + its stdlib unit tests live in `camera-pi/` (`python -m unittest camera-pi/test_camera_pi.py`), MediaMTX config in `mediamtx/`.
  - `log_views.py` + `audit_middleware.py` — request audit trail; frontend also posts navigation events to `/log-navegacao/`.
- **`alert_utils.py`** — threshold/moving-average alerts driven by `AlertaRuidoConfig`; creates `Notificacao` rows for either a specific user or all active `dono`/`gestor`/superusers.

**Auth:** JWT via simplejwt (24h access / 7d refresh). Ingestion endpoints (IoT, detections, IA classify) are `AllowAny`.

**DB:** SQLite. Settings pick `/app/data/db.sqlite3` if `/app/data` exists (Docker volume), otherwise `backend/db.sqlite3`.

### `IA-smart_hive/`
Standalone ML project (training scripts in `src/`, Arduino sketch in `arduino/`, trained artifacts `normalizer.pkl`, `knn_ref.pkl`, `kmeans_8.pkl` in `models/`). Docker mounts `models/` read-only into the backend at `/app/ia_models`. If you retrain, keep these filenames — `ia_views.py` loads them by name.

### Frontend (`frontend/src/`)

- `pages/` — one file per route (routes defined in `App.jsx`, wrapped by `ProtectedRoute` + `Layout`).
- `services/api.js` — single Axios instance with JWT interceptors; all endpoint calls are defined here.
- `contexts/` — `AuthContext` (token/user in localStorage), `ThemeModeContext` (dark/light), `NotificationContext` (notistack).
- `theme.js` — MUI theme, honey palette (Amber `#F4A100` primary, Green `#2E7D32` secondary). Current visual direction is "favo" (honeycomb) — see `StatFavo.jsx` / `StatusBlock.jsx` rather than generic SaaS cards.

### Infrastructure
Docker Compose: `backend` (gunicorn), `frontend` (nginx serving `dist`), `mediamtx` (live camera; RTSP ingest on :8554, HLS served under `/camera/`), `nginx` reverse proxy on :8080 routing `/api/` and `/admin/` to backend, `/camera/` to MediaMTX, everything else to frontend. `frontend/dist` is committed (used by `Dockerfile.prebuild`), so rebuild it when shipping frontend changes.

## Key Conventions

- **Pagination:** 20 items per page on list endpoints.
- **Filtering:** ViewSets use `SearchFilter`, `OrderingFilter`, and `django-filter`.
- **New sensor/ingestion paths** should reuse `_registrar_leitura` (or mirror it) so `Colmeia` latest values, history, and alerts stay in sync.
- **CORS:** all origins allowed in dev; tighten via `.env` in production (see `.env.example`).
- Additional reference docs in repo root: `GUIA_API.md` (API usage), `IOT_INTEGRATION.md` (device payloads).
