# 🚦 AccidentIQ - AI-Based Accident Severity Prediction & Hotspot Detection System

A full-stack web application that analyzes road accident datasets using Machine Learning to predict accident severity and detect accident hotspots on an interactive map.

## 📐 Architecture

```
Frontend (React/Vite) ──► Backend API (Node/Express) ──► ML Service (Python/FastAPI)
         │                          │
         └──────────────────────────┴──► MongoDB Database
```

## 🏗️ Project Structure

```
accident-system/
├── client/               # React frontend (Vite + Tailwind)
│   └── src/
│       ├── pages/        # All page components
│       ├── components/   # Reusable UI components
│       ├── context/      # Auth context
│       └── services/     # API service layer
├── server/               # Node.js + Express backend
│   ├── routes/           # API route handlers
│   ├── models/           # MongoDB mongoose models
│   └── middleware/       # JWT auth middleware
├── ml-service/           # Python FastAPI ML service
│   ├── main.py           # FastAPI application
│   ├── train_model.py    # Model training script
│   └── models/           # Saved ML model files
├── datasets/             # Sample accident CSV data
└── docs/                 # Documentation
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB (optional - app works with in-memory fallback)

---

### 1. ML Service (Python FastAPI)

```bash
cd ml-service

# Activate the repo virtual environment (created by the repo)
# On macOS/Linux:
source ../.venv/bin/activate
# On Windows (PowerShell):
# ../.venv/Scripts/Activate.ps1
# On Windows (cmd.exe):
# ..\.venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Train ML models (recommended before starting)
python train_model.py

# Start the ML API server
uvicorn main:app --reload --port 8000
```

- **Note:** If `scikit-learn` cannot install (common on Windows without Visual C++ build tools), the service will still start, and:
  - `/predict` will fall back to a rule-based predictor
  - `/hotspots` will use a lightweight built-in clustering fallback

ML API runs at: **http://localhost:8000**  
API docs at: **http://localhost:8000/docs**

---

### 2. Backend (Node.js/Express)

```bash
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start server
npm run start
# or for development with hot reload:
npm run dev
```

Backend runs at: **http://localhost:5001**

**Environment Variables (server/.env):**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/accident_db
JWT_SECRET=your_secret_key_here
ML_SERVICE_URL=http://localhost:8000
```

---

### 3. Frontend (React/Vite)

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 🤖 Machine Learning

### Models Trained
| Model | Type | Use Case |
|-------|------|----------|
| Random Forest | Ensemble | Primary severity predictor |
| Decision Tree | Tree-based | Interpretable predictions |
| Logistic Regression | Linear | Baseline classifier |

### Clustering Algorithms
| Algorithm | Use Case |
|-----------|----------|
| DBSCAN | Density-based hotspot detection |
| K-Means | Fixed-cluster zone analysis |

### Input Features
- `weather` — Clear, Rain, Fog, Snow
- `road_condition` — Dry, Wet, Icy
- `vehicle_type` — Car, Motorcycle, Truck, Bus, Van
- `speed_limit` — Integer (mph)
- `light_condition` — Daylight, Dusk, Darkness
- `time_of_day` — Morning, Afternoon, Evening, Night

### Output Classes
- `Minor` — Low severity accident
- `Serious` — Medium severity accident
- `Fatal` — High severity / fatality

---

## 📊 Dataset Format

Upload CSV files with these columns:

```csv
latitude,longitude,weather,road_condition,vehicle_type,speed_limit,light_condition,time_of_day,accident_severity,year,month
51.5074,-0.1278,Clear,Dry,Car,30,Daylight,Morning,Minor,2024,1
51.5155,-0.0922,Rain,Wet,Motorcycle,50,Dusk,Evening,Serious,2024,2
```

A sample dataset is included at `datasets/accidents.csv`.

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Accidents
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/accidents` | Get all accidents | User |
| GET | `/api/accidents/stats` | Get analytics stats | User |
| POST | `/api/accidents/upload` | Upload CSV dataset | Admin |
| DELETE | `/api/accidents/:id` | Delete accident | Admin |
| PUT | `/api/accidents/:id` | Update accident | Admin |

### Machine Learning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict-severity` | Predict accident severity |
| GET | `/api/hotspots?algorithm=dbscan` | Get hotspot clusters |

### ML Service (direct)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Severity prediction |
| POST | `/hotspots` | Hotspot detection |
| GET | `/model-info` | Model performance stats |
| GET | `/health` | Service health check |

---

## 🎭 Demo Accounts

Register via the UI with either role:
- **Admin** — Can upload data, delete records, access all features
- **User** — Can view dashboard, map, and use prediction tool

---

## 🖥️ UI Pages

| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | Marketing landing page |
| Login | `/login` | Authentication |
| Register | `/register` | New account creation |
| Dashboard | `/dashboard` | Analytics & charts |
| Hotspot Map | `/map` | Interactive Leaflet map |
| Predictor | `/predict` | ML severity prediction tool |
| Data Table | `/data` | View/manage accident records |
| Upload | `/upload` | CSV dataset upload (Admin) |

---

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Recharts, Leaflet.js, Lucide React

**Backend:** Node.js, Express.js, Mongoose, JWT, Multer, csv-parse

**ML Service:** Python, FastAPI, Scikit-learn, Pandas, NumPy, Joblib

**Database:** MongoDB (with in-memory fallback for development)

---

## 📝 Notes

- The app includes **graceful fallbacks** — it works even if MongoDB or the ML service is offline
- ML models auto-fall back to rule-based predictions if not trained
- Map uses demo data when backend is unavailable
- All services support **CORS** for local development
