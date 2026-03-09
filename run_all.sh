#!/usr/bin/env bash
# Run full stack: ML service, backend, frontend, and generate sample map.

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Activate venv (bash)
if [ -f ".venv/bin/activate" ]; then
  source .venv/bin/activate
elif [ -f ".venv/Scripts/activate" ]; then
  source .venv/Scripts/activate
else
  echo "ERROR: Could not find virtualenv activate script. Please create the venv first."
  exit 1
fi

# Install Python deps (scikit-learn may fail on Windows without build tools)
set +e
pip install -r ml-service/requirements.txt
if [ $? -ne 0 ]; then
  echo "Warning: Some Python dependencies failed to install (likely scikit-learn)."
  echo "The ML service will still run using fallback logic; install scikit-learn if you need training/modeling."
fi
set -e

# Generate map
python ml-service/plot_nepal_road.py

# Start services (note: these run in foreground in separate terminals)
echo "Start backend: cd server && node index.js"
echo "Start ML service: cd ml-service && uvicorn main:app --reload --port 8000"
echo "Start frontend: cd client && npm run dev"

echo "Run each command in its own terminal window."
