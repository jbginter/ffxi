#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== FFXI Skillchain App ==="

# Backend
echo "[backend] Setting up virtual environment..."
if [ ! -d "$SCRIPT_DIR/backend/.venv" ]; then
  python3 -m venv "$SCRIPT_DIR/backend/.venv"
fi
echo "[backend] Installing dependencies..."
"$SCRIPT_DIR/backend/.venv/bin/pip" install -r "$SCRIPT_DIR/backend/requirements.txt" -q
echo "[backend] Starting FastAPI on http://localhost:8000"
(cd "$SCRIPT_DIR" && "$SCRIPT_DIR/backend/.venv/bin/python" -m uvicorn backend.main:app --reload --port 8000 2>&1 | sed 's/^/[backend] /') &
BACKEND_PID=$!

# Frontend
echo "[frontend] Installing dependencies..."
(cd "$SCRIPT_DIR/frontend" && npm install --silent)
echo "[frontend] Starting Vite on http://localhost:5173"
(cd "$SCRIPT_DIR/frontend" && npm run dev 2>&1 | sed 's/^/[frontend] /') &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT TERM
wait
