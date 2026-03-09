const express = require("express");
const fetch = require("node-fetch");
const Accident = require("../models/Accident");
const { protect } = require("../middleware/auth");
const router = express.Router();

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// Predict severity
router.post("/predict-severity", protect, async (req, res) => {
  try {
    const response = await fetch(`${ML_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
      timeout: 10000
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    // Fallback rule-based if ML service is down
    const { weather, road_condition, vehicle_type, speed_limit, light_condition, time_of_day } = req.body;
    let score = 0;
    if (["Rain", "Fog", "Snow"].includes(weather)) score += 2;
    if (["Wet", "Icy"].includes(road_condition)) score += 2;
    if (light_condition === "Darkness") score += 2;
    if (speed_limit >= 70) score += 3;
    else if (speed_limit >= 50) score += 1;
    if (["Truck", "Bus"].includes(vehicle_type)) score += 1;
    if (time_of_day === "Night") score += 1;

    let severity = score <= 2 ? "Minor" : score <= 5 ? "Serious" : "Fatal";
    res.json({
      severity,
      confidence: 70,
      probabilities: { Minor: score <= 2 ? 70 : 10, Serious: 20, Fatal: score > 5 ? 60 : 10 },
      model_used: "rule_based_fallback",
      risk_factors: [],
      note: "ML service unavailable, using rule-based fallback"
    });
  }
});

// Get hotspots
router.get("/hotspots", protect, async (req, res) => {
  try {
    let accidents;
    try {
      accidents = await Accident.find({}, "latitude longitude accident_severity");
    } catch (dbErr) {
      return res.status(503).json({ message: "Database unavailable" });
    }

    if (!accidents.length) {
      return res.json({ hotspots: [], message: "No accident data available" });
    }

    const response = await fetch(`${ML_URL}/hotspots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accidents: accidents.map(a => ({
          latitude: a.latitude,
          longitude: a.longitude,
          accident_severity: a.accident_severity
        })),
        algorithm: req.query.algorithm || "dbscan"
      }),
      timeout: 15000
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ message: "ML service unavailable", error: err.message });
  }
});

module.exports = router;
