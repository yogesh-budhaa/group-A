"""Generate a simple HTML map for the Birendranagar-2 Surkhet -> Jumla road sample data.

Requires: folium

Run:
  python plot_nepal_road.py

This will create `nepal_road_map.html` in the current directory.
"""

import csv
import folium

from pathlib import Path

ROOT = Path(__file__).resolve().parent
INPUT_CSV = ROOT.parent / "datasets" / "nepal_birendranagar_jumla_sample.csv"
OUTPUT_HTML = ROOT / "nepal_road_map.html"

# Center map roughly over mid-point of the route
m = folium.Map(location=[28.9, 81.9], zoom_start=8)

# Load sample points and plot markers
points = []
with open(INPUT_CSV, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for r in reader:
        lat = float(r["latitude"])
        lon = float(r["longitude"])
        points.append((lat, lon))
        popup = (
            f"ID: {r['id']}<br/>"
            f"Severity: {r['accident_severity']}<br/>"
            f"Weather: {r['weather']}<br/>"
            f"Road: {r['road_condition']}<br/>"
            f"Vehicle: {r['vehicle_type']}"
        )
        folium.CircleMarker(
            location=(lat, lon),
            radius=6,
            color="red" if r["accident_severity"] in ["Fatal", "Serious"] else "green",
            fill=True,
            fill_opacity=0.7,
            popup=popup,
        ).add_to(m)

# Draw polyline along the route
if points:
    folium.PolyLine(points, color="blue", weight=3, opacity=0.7).add_to(m)

m.save(OUTPUT_HTML)
print(f"Map saved to {OUTPUT_HTML}")
