# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart-Hive is an apiary (beehive) management system with a Django REST API backend and React frontend. The UI is in Brazilian Portuguese.

## Commands

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver          # Dev server on :8000
python manage.py createsuperuser
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # Dev server on :5173 (proxies /api/ to :8000)
npm run build    # Production build → /dist
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Docker (production)
```bash
docker-compose up -d        # Start all services (frontend on :8080)
docker-compose logs -f
bash deploy_clean.sh        # Deploy with cache cleanup (preferred for VPS)
```

### API Docs (when running)
- Swagger: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- Django Admin: `http://localhost:8000/admin/`

## Architecture

### Backend (`/backend`)

**`api/models.py`** — 13 Django models:
- `Usuario` — custom user model with roles: `dono` (owner), `gestor` (manager), `apicultor` (beekeeper)
- `Apiario` — apiary locations with GPS coordinates
- `Colmeia` — hive records; holds `token_iot` for device authentication and live sensor fields (temperature, humidity, weight, noise, etc.)
- `LeituraSensor` — historical archive of sensor readings
- `Inspecao`, `ProducaoMel`, `Tratamento`, `Custo`, `Receita`, `Fornecedor`, `Equipamento`, `Notificacao`, `EspecieAbelha`

**`api/views.py`** — DRF ViewSets for all models + 3 dashboard views (general, financial, health/productivity).

**`api/`** split views for specific concerns:
- `auth_views.py` — register/login/me endpoints
- `iot_views.py` — IoT data ingestion (no JWT; uses `token_iot`)
- `apiario_iot_views.py` — apiary-level IoT aggregation
- `export_views.py` — Excel/PDF generation (openpyxl + reportlab)
- `audit_middleware.py` / `audit_models.py` — request audit trail

**Auth:** JWT via `djangorestframework-simplejwt` (24h access / 7d refresh tokens). IoT device endpoints use token-based auth stored on the `Colmeia` model.

### Frontend (`/frontend/src`)

- **`pages/`** — one file per route: Dashboard, Apiarios, Colmeias, Inspecoes, Producao, Tratamentos, Especies, Login, Register
- **`components/`** — Layout (sidebar+header), ProtectedRoute, ErrorBoundary, ConfirmDialog, LoadingSpinner, AdvancedFilters
- **`services/api.js`** — single Axios instance with JWT interceptors; all endpoint calls defined here
- **`contexts/`** — AuthContext (token/user state + localStorage), ThemeModeContext (dark/light), NotificationContext (notistack)
- **`theme.js`** — MUI theme with honey palette (Amber `#F4A100` primary, Green `#2E7D32` secondary), full dark/light variants

### Infrastructure

Docker Compose runs 3 services: `backend` (gunicorn), `frontend` (nginx serving `/dist`), and `nginx` (reverse proxy on :8080). Nginx routes `/api/` and `/admin/` to backend, everything else to frontend. Static and media files are served from shared volumes.

`vite.config.js` proxies `/api/` → `127.0.0.1:8000` in dev, so the frontend dev server works without CORS issues.

## Key Conventions

- **Pagination:** 20 items per page across all list endpoints.
- **Filtering:** All ViewSets support `SearchFilter` and `OrderingFilter`; use `django-filter` for field-level filtering.
- **Exports:** Excel/PDF exports are generated in `export_views.py` and returned as file downloads.
- **IoT data flow:** Devices POST to `/api/iot/colmeia/dados/` with `token_iot`; latest values are stored directly on `Colmeia`, history in `LeituraSensor`.
- **SQLite path in Docker:** `/app/data/db.sqlite3` (mounted volume `sqlite_data`).
- **CORS in dev:** All origins allowed (`CORS_ALLOW_ALL_ORIGINS = True`); tighten in production via `.env`.
