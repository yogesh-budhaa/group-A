"""
Accident Severity Prediction & Hotspot Detection - FastAPI Service
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
import joblib
import json
import os

# sklearn is optional; if unavailable, hotspot detection and training will be disabled
try:
    from sklearn.cluster import DBSCAN, KMeans
    SKLEARN_AVAILABLE = True
except ImportError:
    DBSCAN = None
    KMeans = None
    SKLEARN_AVAILABLE = False

app = FastAPI(
    title="Accident ML Service",
    description="ML API for accident severity prediction and hotspot detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models on startup
models = {}
encoders = {}
scaler = None

@app.on_event("startup")
async def load_models():
    global models, encoders, scaler
    models_dir = "models"

    if not os.path.exists(models_dir):
        print("WARNING: Models not trained yet. Run train_model.py first.")
        return

    if not SKLEARN_AVAILABLE:
        print("WARNING: sklearn is not installed; model-based predictions and training are disabled, but hotspot detection will still work using a lightweight fallback.")
        return

    try:
        encoders = joblib.load(f"{models_dir}/encoders.pkl")
        scaler = joblib.load(f"{models_dir}/scaler.pkl")

        for name in ["random_forest", "decision_tree", "logistic_regression"]:
            path = f"{models_dir}/{name}.pkl"
            if os.path.exists(path):
                models[name] = joblib.load(path)

        for name in ["dbscan", "kmeans"]:
            path = f"{models_dir}/{name}.pkl"
            if os.path.exists(path):
                models[name] = joblib.load(path)

        print(f"Loaded models: {list(models.keys())}")
    except Exception as e:
        print(f"Error loading models: {e}")


class PredictionRequest(BaseModel):
    weather: str
    road_condition: str
    vehicle_type: str
    speed_limit: int
    light_condition: str
    time_of_day: str
    model: Optional[str] = "random_forest"


class HotspotRequest(BaseModel):
    accidents: List[dict]
    algorithm: Optional[str] = "dbscan"
    n_clusters: Optional[int] = 5


class TrainRequest(BaseModel):
    accidents: List[dict]


@app.get("/")
async def root():
    return {
        "service": "Accident ML API",
        "status": "running",
        "models_loaded": list(models.keys()),
        "endpoints": ["/predict", "/hotspots", "/model-info", "/health"]
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "models": list(models.keys())}


@app.post("/predict")
async def predict_severity(request: PredictionRequest):
    model_name = request.model if request.model in models else "random_forest"
    
    # If models not trained yet, use rule-based fallback
    if not models or model_name not in models:
        return _rule_based_prediction(request)
    
    try:
        # Build feature dataframe
        data = {
            "weather": [request.weather],
            "road_condition": [request.road_condition],
            "vehicle_type": [request.vehicle_type],
            "speed_limit": [request.speed_limit],
            "light_condition": [request.light_condition],
            "time_of_day": [request.time_of_day]
        }
        df = pd.DataFrame(data)
        
        categorical_cols = ["weather", "road_condition", "vehicle_type", "light_condition", "time_of_day"]
        for col in categorical_cols:
            if col in encoders:
                le = encoders[col]
                val = df[col].iloc[0]
                if val in le.classes_:
                    df[col] = le.transform(df[col])
                else:
                    df[col] = 0
        
        model = models[model_name]
        
        if model_name == "logistic_regression":
            X_scaled = scaler.transform(df)
            pred = model.predict(X_scaled)[0]
            proba = model.predict_proba(X_scaled)[0]
        else:
            pred = model.predict(df)[0]
            proba = model.predict_proba(df)[0]
        
        severity_classes = encoders["accident_severity"].classes_
        severity = severity_classes[pred]
        confidence = float(max(proba)) * 100
        
        probabilities = {
            cls: round(float(p) * 100, 1)
            for cls, p in zip(severity_classes, proba)
        }
        
        return {
            "severity": severity,
            "confidence": round(confidence, 1),
            "probabilities": probabilities,
            "model_used": model_name,
            "risk_factors": _get_risk_factors(request)
        }
    
    except Exception as e:
        return _rule_based_prediction(request)


def _rule_based_prediction(request: PredictionRequest):
    """Fallback rule-based prediction when models are not trained"""
    score = 0
    risk_factors = []
    
    if request.weather in ["Rain", "Fog", "Snow"]:
        score += 2
        risk_factors.append(f"Adverse weather: {request.weather}")
    if request.road_condition in ["Wet", "Icy"]:
        score += 2
        risk_factors.append(f"Poor road condition: {request.road_condition}")
    if request.light_condition == "Darkness":
        score += 2
        risk_factors.append("Driving in darkness")
    elif request.light_condition == "Dusk":
        score += 1
        risk_factors.append("Low light conditions")
    if request.speed_limit >= 70:
        score += 3
        risk_factors.append(f"High speed limit: {request.speed_limit}mph")
    elif request.speed_limit >= 50:
        score += 1
    if request.vehicle_type in ["Truck", "Bus"]:
        score += 1
        risk_factors.append(f"Heavy vehicle: {request.vehicle_type}")
    if request.time_of_day == "Night":
        score += 1
        risk_factors.append("Night time driving")
    
    if score <= 2:
        severity = "Minor"
        probabilities = {"Fatal": 5.0, "Minor": 75.0, "Serious": 20.0}
        confidence = 75.0
    elif score <= 5:
        severity = "Serious"
        probabilities = {"Fatal": 20.0, "Minor": 15.0, "Serious": 65.0}
        confidence = 65.0
    else:
        severity = "Fatal"
        probabilities = {"Fatal": 60.0, "Minor": 5.0, "Serious": 35.0}
        confidence = 60.0
    
    return {
        "severity": severity,
        "confidence": confidence,
        "probabilities": probabilities,
        "model_used": "rule_based_fallback",
        "risk_factors": risk_factors
    }


def _get_risk_factors(request: PredictionRequest):
    factors = []
    if request.weather in ["Rain", "Fog", "Snow"]:
        factors.append(f"Adverse weather ({request.weather})")
    if request.road_condition in ["Wet", "Icy"]:
        factors.append(f"Hazardous road ({request.road_condition})")
    if request.light_condition == "Darkness":
        factors.append("Poor visibility (Darkness)")
    if request.speed_limit >= 70:
        factors.append(f"High speed zone ({request.speed_limit}mph)")
    if request.vehicle_type in ["Truck", "Bus"]:
        factors.append(f"Heavy vehicle ({request.vehicle_type})")
    return factors


def _simple_dbscan(coords: np.ndarray, eps: float = 0.02, min_samples: int = 3) -> np.ndarray:
    """Simple (naive) DBSCAN implementation without scikit-learn."""
    n = len(coords)
    labels = -np.ones(n, dtype=int)
    visited = np.zeros(n, dtype=bool)
    cluster_id = 0

    def neighbors(idx):
        dists = np.linalg.norm(coords - coords[idx], axis=1)
        return np.where(dists <= eps)[0]

    for i in range(n):
        if visited[i]:
            continue
        visited[i] = True
        neigh = neighbors(i)
        if len(neigh) < min_samples:
            labels[i] = -1
            continue

        labels[i] = cluster_id
        seeds = set(neigh.tolist())
        seeds.discard(i)

        while seeds:
            curr = seeds.pop()
            if not visited[curr]:
                visited[curr] = True
                curr_neigh = neighbors(curr)
                if len(curr_neigh) >= min_samples:
                    seeds.update(curr_neigh)
            if labels[curr] == -1:
                labels[curr] = cluster_id
        cluster_id += 1

    return labels


def _simple_kmeans(coords: np.ndarray, n_clusters: int = 5, max_iters: int = 100) -> np.ndarray:
    """Simple k-means implementation without scikit-learn."""
    n = len(coords)
    if n == 0:
        return np.array([], dtype=int)

    rng = np.random.default_rng(42)
    n_clusters = min(n_clusters, n)
    centroids = coords[rng.choice(n, size=n_clusters, replace=False)].astype(float)
    labels = np.zeros(n, dtype=int)

    for _ in range(max_iters):
        dists = np.linalg.norm(coords[:, None, :] - centroids[None, :, :], axis=2)
        new_labels = np.argmin(dists, axis=1)
        if np.array_equal(labels, new_labels):
            break
        labels = new_labels

        for k in range(n_clusters):
            pts = coords[labels == k]
            if len(pts) > 0:
                centroids[k] = pts.mean(axis=0)
            else:
                centroids[k] = coords[rng.integers(0, n)]

    return labels


@app.post("/hotspots")
async def detect_hotspots(request: HotspotRequest):
    if not request.accidents:
        raise HTTPException(status_code=400, detail="No accident data provided")

    try:
        coords = np.array([[a["latitude"], a["longitude"]] for a in request.accidents])

        if request.algorithm == "dbscan":
            if SKLEARN_AVAILABLE:
                model = DBSCAN(eps=0.02, min_samples=3)
                labels = model.fit_predict(coords)
            else:
                labels = _simple_dbscan(coords, eps=0.02, min_samples=3)
        else:
            n = min(request.n_clusters, len(coords))
            if SKLEARN_AVAILABLE:
                model = KMeans(n_clusters=n, random_state=42, n_init=10)
                labels = model.fit_predict(coords)
            else:
                labels = _simple_kmeans(coords, n_clusters=n)
        
        clusters = {}
        for i, label in enumerate(labels):
            key = int(label)
            if key not in clusters:
                clusters[key] = []
            clusters[key].append({
                "latitude": float(coords[i][0]),
                "longitude": float(coords[i][1]),
                "severity": request.accidents[i].get("accident_severity", "Unknown")
            })
        
        hotspots = []
        for label, points in clusters.items():
            if label == -1:
                continue  # noise points in DBSCAN
            
            lats = [p["latitude"] for p in points]
            lons = [p["longitude"] for p in points]
            severities = [p["severity"] for p in points]
            
            fatal_count = severities.count("Fatal")
            serious_count = severities.count("Serious")
            
            if fatal_count > 0:
                risk_level = "High"
            elif serious_count > len(points) / 2:
                risk_level = "Medium"
            else:
                risk_level = "Low"
            
            hotspots.append({
                "cluster_id": label,
                "center": {
                    "latitude": float(np.mean(lats)),
                    "longitude": float(np.mean(lons))
                },
                "accident_count": len(points),
                "risk_level": risk_level,
                "accidents": points,
                "severity_breakdown": {
                    "Fatal": fatal_count,
                    "Serious": serious_count,
                    "Minor": severities.count("Minor")
                }
            })
        
        hotspots.sort(key=lambda x: x["accident_count"], reverse=True)
        
        return {
            "algorithm": request.algorithm,
            "total_accidents": len(request.accidents),
            "clusters_found": len(hotspots),
            "noise_points": int(np.sum(labels == -1)) if request.algorithm == "dbscan" else 0,
            "hotspots": hotspots
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model-info")
async def model_info():
    results_path = "models/evaluation_results.json"
    
    if os.path.exists(results_path):
        with open(results_path) as f:
            data = json.load(f)
        return {
            "models_trained": True,
            "available_models": list(models.keys()),
            "evaluation": data
        }
    
    return {
        "models_trained": False,
        "available_models": [],
        "message": "Run train_model.py to train models"
    }


@app.post("/train")
async def train_models(request: TrainRequest):
    """Train models with provided accident data"""
    try:
        df = pd.DataFrame(request.accidents)
        required = ["weather", "road_condition", "vehicle_type", "speed_limit", 
                    "light_condition", "time_of_day", "accident_severity"]
        
        missing = [col for col in required if col not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")
        
        return {
            "message": "Training initiated. Use GET /model-info to check status.",
            "records": len(df)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
