import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

FEATURE_COLS = ["weather", "road_condition", "vehicle_type", "speed_limit", "light_condition", "time_of_day"]
TARGET_COL = "accident_severity"

SEVERITY_MAP = {"Minor": 0, "Serious": 1, "Fatal": 2}

def encode_features(df, label_encoders=None, fit=True):
    df = df.copy()
    categorical_cols = ["weather", "road_condition", "vehicle_type", "light_condition", "time_of_day"]
    
    if label_encoders is None:
        label_encoders = {}

    for col in categorical_cols:
        if col in df.columns:
            if fit:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                label_encoders[col] = le
            else:
                le = label_encoders.get(col)
                if le:
                    df[col] = df[col].apply(lambda x: le.transform([str(x)])[0] if str(x) in le.classes_ else 0)
    
    return df, label_encoders

def train_models(df):
    required_cols = FEATURE_COLS + [TARGET_COL]
    available = [c for c in required_cols if c in df.columns]
    
    if TARGET_COL not in df.columns:
        raise ValueError(f"Target column '{TARGET_COL}' not found in dataset")

    df = df[available].dropna()
    df[TARGET_COL] = df[TARGET_COL].map(SEVERITY_MAP).fillna(0).astype(int)

    df, label_encoders = encode_features(df, fit=True)
    
    feature_cols = [c for c in FEATURE_COLS if c in df.columns]
    X = df[feature_cols]
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    classifiers = {
        "random_forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "decision_tree": DecisionTreeClassifier(random_state=42),
        "logistic_regression": LogisticRegression(max_iter=1000, random_state=42)
    }

    trained_models = {}
    metrics = {}

    for name, clf in classifiers.items():
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        trained_models[name] = clf
        metrics[name] = {
            "accuracy": round(float(acc), 4),
            "training_samples": len(X_train),
            "test_samples": len(X_test)
        }
        print(f"✅ {name}: accuracy={acc:.4f}")

    # Save models
    with open(os.path.join(MODELS_DIR, "trained_models.pkl"), "wb") as f:
        pickle.dump(trained_models, f)
    
    with open(os.path.join(MODELS_DIR, "label_encoders.pkl"), "wb") as f:
        pickle.dump(label_encoders, f)

    with open(os.path.join(MODELS_DIR, "feature_cols.pkl"), "wb") as f:
        pickle.dump(feature_cols, f)

    return trained_models, label_encoders, metrics

def load_models():
    models_path = os.path.join(MODELS_DIR, "trained_models.pkl")
    encoders_path = os.path.join(MODELS_DIR, "label_encoders.pkl")

    if not os.path.exists(models_path):
        print("⚠️ No trained models found. Training on sample data...")
        datasets_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "datasets")
        sample_path = os.path.join(datasets_dir, "accidents.csv")
        
        if os.path.exists(sample_path):
            df = pd.read_csv(sample_path)
            models, label_encoders, _ = train_models(df)
            return models, label_encoders
        else:
            # Train with synthetic data
            df = generate_synthetic_data()
            models, label_encoders, _ = train_models(df)
            return models, label_encoders

    with open(models_path, "rb") as f:
        models = pickle.load(f)
    
    label_encoders = {}
    if os.path.exists(encoders_path):
        with open(encoders_path, "rb") as f:
            label_encoders = pickle.load(f)

    return models, label_encoders

def generate_synthetic_data(n=500):
    np.random.seed(42)
    weathers = ["Clear", "Rain", "Fog", "Snow"]
    roads = ["Dry", "Wet", "Icy"]
    vehicles = ["Car", "Motorcycle", "Truck", "Bus"]
    lights = ["Daylight", "Darkness", "Dusk/Dawn"]
    times = ["Morning", "Afternoon", "Evening", "Night"]
    severities = ["Minor", "Serious", "Fatal"]

    data = {
        "weather": np.random.choice(weathers, n),
        "road_condition": np.random.choice(roads, n),
        "vehicle_type": np.random.choice(vehicles, n),
        "speed_limit": np.random.choice([20, 30, 40, 50, 60, 70], n),
        "light_condition": np.random.choice(lights, n),
        "time_of_day": np.random.choice(times, n),
        "accident_severity": np.random.choice(severities, n, p=[0.6, 0.3, 0.1])
    }
    return pd.DataFrame(data)
