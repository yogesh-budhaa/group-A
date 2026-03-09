"""
Accident Severity Prediction - Model Training Script
Trains Random Forest, Decision Tree, and Logistic Regression models
"""

import sys

import pandas as pd
import numpy as np
import joblib
import json
import os

# scikit-learn is optional; provide a clear message if it's missing
try:
    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
    from sklearn.cluster import DBSCAN, KMeans
except ImportError as exc:
    print("ERROR: scikit-learn is required to train models.")
    print("Install it via: python -m pip install scikit-learn")
    print("If you are on Windows, you may need the Visual C++ build tools.")
    print(f"Original error: {exc}")
    sys.exit(1)

# Ensure models directory exists
os.makedirs("models", exist_ok=True)

print("=" * 60)
print("ACCIDENT SEVERITY PREDICTION - MODEL TRAINING")
print("=" * 60)

# Load dataset
print("\n[1] Loading dataset...")
df = pd.read_csv("../datasets/accidents.csv")
print(f"    Loaded {len(df)} records")
print(f"    Columns: {list(df.columns)}")

# Feature engineering
print("\n[2] Preprocessing features...")
features = ["weather", "road_condition", "vehicle_type", "speed_limit", "light_condition", "time_of_day"]
target = "accident_severity"

X = df[features].copy()
y = df[target].copy()

# Label encode categorical features
encoders = {}
categorical_cols = ["weather", "road_condition", "vehicle_type", "light_condition", "time_of_day"]

for col in categorical_cols:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col])
    encoders[col] = le
    print(f"    Encoded '{col}': {list(le.classes_)}")

# Encode target
target_encoder = LabelEncoder()
y_encoded = target_encoder.fit_transform(y)
encoders["accident_severity"] = target_encoder
print(f"    Target classes: {list(target_encoder.classes_)}")

# Save encoders
joblib.dump(encoders, "models/encoders.pkl")
print("    Encoders saved")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)
print(f"\n    Train size: {len(X_train)}, Test size: {len(X_test)}")

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
joblib.dump(scaler, "models/scaler.pkl")

# Train models
print("\n[3] Training models...")
models = {
    "random_forest": RandomForestClassifier(n_estimators=100, random_state=42),
    "decision_tree": DecisionTreeClassifier(max_depth=10, random_state=42),
    "logistic_regression": LogisticRegression(max_iter=1000, random_state=42)
}

results = {}
best_model_name = None
best_accuracy = 0

for name, model in models.items():
    print(f"\n    Training {name.replace('_', ' ').title()}...")
    
    if name == "logistic_regression":
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
    else:
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=target_encoder.classes_, output_dict=True)
    
    results[name] = {
        "accuracy": round(acc * 100, 2),
        "classification_report": report
    }
    
    print(f"    Accuracy: {acc * 100:.2f}%")
    print(f"    Classification Report:")
    print(classification_report(y_test, y_pred, target_names=target_encoder.classes_))
    
    # Save model
    joblib.dump(model, f"models/{name}.pkl")
    print(f"    Saved models/{name}.pkl")
    
    if acc > best_accuracy:
        best_accuracy = acc
        best_model_name = name

print(f"\n[4] Best model: {best_model_name} with accuracy {best_accuracy * 100:.2f}%")
joblib.dump(models[best_model_name], "models/best_model.pkl")

# Save results
with open("models/evaluation_results.json", "w") as f:
    json.dump({"results": results, "best_model": best_model_name}, f, indent=2)
print("    Evaluation results saved to models/evaluation_results.json")

# Train clustering models
print("\n[5] Training hotspot detection models...")
coords = df[["latitude", "longitude"]].values

# DBSCAN
dbscan = DBSCAN(eps=0.02, min_samples=3)
dbscan_labels = dbscan.fit_predict(coords)
n_clusters_dbscan = len(set(dbscan_labels)) - (1 if -1 in dbscan_labels else 0)
print(f"    DBSCAN found {n_clusters_dbscan} clusters, {np.sum(dbscan_labels == -1)} noise points")

# KMeans
kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
kmeans_labels = kmeans.fit_predict(coords)
print(f"    KMeans created 5 clusters")

joblib.dump(dbscan, "models/dbscan.pkl")
joblib.dump(kmeans, "models/kmeans.pkl")
print("    Clustering models saved")

print("\n" + "=" * 60)
print("TRAINING COMPLETE!")
print("=" * 60)
print(f"\nModel Performance Summary:")
for name, result in results.items():
    print(f"  {name.replace('_', ' ').title()}: {result['accuracy']}% accuracy")
