# FFXI Skillchain & Magic Burst Reference

Interactive skillchain builder and reference tool for Final Fantasy XI, sourced from BG-wiki.

## Quick Start (local)

```bash
./start.sh
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Docker

```bash
docker compose up --build
```

Same URLs as above. Hot-reload is active for both services.

## Vercel Deployment

1. Push to GitHub (see below)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Leave all settings as defaults — `vercel.json` handles the build
4. Click **Deploy**

The frontend and `/api/data` serverless function deploy together automatically on every push to `main`.

## GitHub

```bash
git remote add origin https://github.com/<your-username>/ffxi.git
git push -u origin main
```

## Updating Weapon Skill Data

Weapon skill data is generated from a local BG-wiki scrape. To refresh it:

```bash
# 1. Download/update wiki pages (resumable — safe to re-run)
python3 scraper.py

# 2. Regenerate backend/data/weapon_skills.py from scraped pages
python3 generate_ws.py
```

The `data/` directory (278 MB of raw wiki pages) is gitignored. The generated
`backend/data/*.py` files are committed and work standalone without the scrape.

## Project Structure

```
├── api/                  Vercel serverless function (mirrors /api/data)
├── backend/
│   ├── data/             Game data as Python modules (committed)
│   └── main.py           FastAPI app for local/Docker dev
├── frontend/
│   └── src/
│       ├── components/   React components by feature
│       ├── lib/          Chain logic, API client, constants
│       └── context/      DataContext (global game data)
├── generate_ws.py        Regenerates weapon_skills.py from scraped data
├── scraper.py            BG-wiki offline scraper
├── docker-compose.yml
├── Dockerfile.backend
└── vercel.json
```

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend (local/Docker) | FastAPI + Python 3.12 |
| Backend (Vercel) | Python serverless (`api/data.py`) |
| Data source | BG-wiki via MediaWiki API |
