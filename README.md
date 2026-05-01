# FFXI Skillchain & Magic Burst Reference

Interactive skillchain builder and reference tool for Final Fantasy XI, sourced from BG-wiki.

---

## Running with Docker (recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Start

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |

The `--build` flag is only needed the first time or after dependency changes. Subsequent starts:

```bash
docker compose up
```

### Stop

```bash
docker compose down
```

### How it works

| Container | Base image | What it runs |
|---|---|---|
| `backend` | `python:3.12-slim` | FastAPI via uvicorn on port 8000 |
| `frontend` | `node:20-alpine` | Vite dev server on port 5173 |

The frontend container sets `API_URL=http://backend:8000` so Vite's proxy routes `/api/*` to the backend service automatically — no manual config needed.

Both containers mount their source directories as volumes, so **hot-reload works** for both Python and TypeScript changes without rebuilding.

---

## Running locally (without Docker)

### Prerequisites
- Python 3.12+
- Node.js 20+

```bash
./start.sh
```

This creates a Python venv at `backend/.venv` on first run, installs dependencies, and starts both servers.

---

## Vercel Deployment

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Select **"Other"** as the framework preset
4. Leave all other settings as defaults — `vercel.json` handles everything
5. Click **Deploy**

Every push to `main` triggers an automatic redeploy.

The `api/data.py` serverless function mirrors the FastAPI backend, serving the same game data without needing a running Python server.

---

## Updating Weapon Skill Data

Weapon skill data is generated from a local BG-wiki scrape. The generated files are committed so the app works out of the box. To refresh from the latest wiki:

```bash
# Download/update wiki pages (resumable — safe to re-run)
python3 scraper.py

# Regenerate backend/data/weapon_skills.py
python3 generate_ws.py
```

The `data/` directory (~280 MB of raw wiki pages) is gitignored. Only the small generated `backend/data/*.py` files are committed.

---

## Project Structure

```
├── api/                        Vercel serverless function
├── backend/
│   ├── data/                   Game data as Python modules (committed)
│   ├── ffxiah.py               FFXIAH character lookup proxy
│   └── main.py                 FastAPI app (local & Docker)
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ChainBuilder/   Skillchain builder (5 files)
│       │   ├── Character/      Player profile & FFXIAH lookup
│       │   ├── MagicBurst/
│       │   ├── SkillchainReference/
│       │   ├── WeaponSkills/
│       │   └── shared/         Badge, ElChip
│       ├── context/            DataContext (global game data)
│       └── lib/                Chain logic, API client, constants
├── Dockerfile.backend
├── docker-compose.yml
├── generate_ws.py              Regenerates weapon_skills.py from scrape
├── scraper.py                  BG-wiki offline scraper
├── start.sh                    Local dev launcher (no Docker)
└── vercel.json
```

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend (local/Docker) | FastAPI + Python 3.12 |
| Backend (Vercel) | Python serverless (`api/data.py`) |
| Data source | BG-wiki via MediaWiki API |
