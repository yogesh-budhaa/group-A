@echo off
REM Run full stack: ML service, backend, frontend, and generate sample map.

REM Activate Python venv
call .venv\Scripts\activate

REM Install Python dependencies
pip install -r ml-service\requirements.txt || (
  echo.
  echo WARNING: Some Python dependencies failed to install (likely scikit-learn).
  echo The ML service will still run using fallback logic; install scikit-learn if you need training/modeling.
)

REM Generate sample map for Birendranagar-Jumla
python ml-service\plot_nepal_road.py

echo Starting backend server (port 5001)...
start "Backend" cmd /k "cd server && node index.js"

echo Starting ML service (port 8000)...
start "ML Service" cmd /k "cd ml-service && uvicorn main:app --reload --port 8000"

echo Starting frontend (port 5173)...
start "Frontend" cmd /k "cd client && npm run dev"

echo All services started.
