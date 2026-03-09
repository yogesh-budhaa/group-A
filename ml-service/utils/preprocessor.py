import numpy as np
import pandas as pd
import pickle
import os

FEATURE_COLS = ["weather", "road_condition", "vehicle_type", "speed_limit", "light_condition", "time_of_day"]

def preprocess_input(input_dict, label_encoders):
    """Preprocess a single prediction input."""
    features = []
    
    categorical_map = {
        "weather": input_dict.get("weather", "Clear"),
        "road_condition": input_dict.get("road_condition", "Dry"),
        "vehicle_type": input_dict.get("vehicle_type", "Car"),
        "light_condition": input_dict.get("light_condition", "Daylight"),
        "time_of_day": input_dict.get("time_of_day", "Morning"),
    }
    
    for col, val in categorical_map.items():
        le = label_encoders.get(col)
        if le is not None:
            try:
                encoded = le.transform([str(val)])[0]
            except ValueError:
                encoded = 0
        else:
            encoded = 0
        features.append(float(encoded))
    
    # Insert speed_limit after vehicle_type (index 3)
    speed = float(input_dict.get("speed_limit", 30))
    features_ordered = [
        features[0],  # weather
        features[1],  # road_condition
        features[2],  # vehicle_type
        speed,         # speed_limit
        features[3],  # light_condition
        features[4],  # time_of_day
    ]
    
    return np.array([features_ordered])

def preprocess_for_clustering(data):
    """Preprocess data for clustering algorithms."""
    df = pd.DataFrame(data)
    coords = df[["latitude", "longitude"]].dropna().values
    return coords
