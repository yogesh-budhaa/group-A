const express = require("express");
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const Accident = require("../models/Accident");
const { protect, adminOnly } = require("../middleware/auth");
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// In-memory fallback
let inMemoryAccidents = [];
let nextId = 1;

const generateSampleData = () => {
  if (inMemoryAccidents.length > 0) return;
  const weathers = ["Clear", "Rain", "Fog", "Snow"];
  const roads = ["Dry", "Wet", "Icy"];
  const vehicles = ["Car", "Motorcycle", "Truck", "Bus", "Van"];
  const lights = ["Daylight", "Dusk", "Darkness"];
  const times = ["Morning", "Afternoon", "Evening", "Night"];
  const severities = ["Minor", "Serious", "Fatal"];
  const baseLat = 51.505, baseLon = -0.09;
  
  for (let i = 0; i < 50; i++) {
    inMemoryAccidents.push({
      _id: (nextId++).toString(),
      latitude: baseLat + (Math.random() - 0.5) * 0.1,
      longitude: baseLon + (Math.random() - 0.5) * 0.1,
      weather: weathers[Math.floor(Math.random() * weathers.length)],
      road_condition: roads[Math.floor(Math.random() * roads.length)],
      vehicle_type: vehicles[Math.floor(Math.random() * vehicles.length)],
      speed_limit: [20, 30, 40, 50, 60, 70][Math.floor(Math.random() * 6)],
      light_condition: lights[Math.floor(Math.random() * lights.length)],
      time_of_day: times[Math.floor(Math.random() * times.length)],
      accident_severity: severities[Math.floor(Math.random() * severities.length)],
      year: 2022 + Math.floor(Math.random() * 3),
      month: Math.ceil(Math.random() * 12),
      createdAt: new Date()
    });
  }
};

// GET all accidents
router.get("/", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    try {
      const total = await Accident.countDocuments();
      const accidents = await Accident.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      
      return res.json({ accidents, total, page, pages: Math.ceil(total / limit) });
    } catch (dbErr) {
      generateSampleData();
      const total = inMemoryAccidents.length;
      const accidents = inMemoryAccidents.slice((page - 1) * limit, page * limit);
      return res.json({ accidents, total, page, pages: Math.ceil(total / limit) });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET stats
router.get("/stats", protect, async (req, res) => {
  try {
    let accidents;
    try {
      accidents = await Accident.find();
    } catch (dbErr) {
      generateSampleData();
      accidents = inMemoryAccidents;
    }

    const total = accidents.length;
    const bySeverity = { Minor: 0, Serious: 0, Fatal: 0 };
    const byWeather = {};
    const byTime = {};
    const byYear = {};

    accidents.forEach(a => {
      bySeverity[a.accident_severity] = (bySeverity[a.accident_severity] || 0) + 1;
      byWeather[a.weather] = (byWeather[a.weather] || 0) + 1;
      byTime[a.time_of_day] = (byTime[a.time_of_day] || 0) + 1;
      if (a.year) byYear[a.year] = (byYear[a.year] || 0) + 1;
    });

    res.json({ total, bySeverity, byWeather, byTime, byYear });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload CSV
router.post("/upload", protect, adminOnly, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    
    const content = req.file.buffer.toString("utf-8");
    const records = parse(content, { columns: true, skip_empty_lines: true });
    
    const accidents = records.map(r => ({
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      weather: r.weather,
      road_condition: r.road_condition,
      vehicle_type: r.vehicle_type,
      speed_limit: parseInt(r.speed_limit),
      light_condition: r.light_condition,
      time_of_day: r.time_of_day,
      accident_severity: r.accident_severity,
      year: r.year ? parseInt(r.year) : null,
      month: r.month ? parseInt(r.month) : null,
      uploadedBy: req.user.id
    }));

    try {
      await Accident.insertMany(accidents);
    } catch (dbErr) {
      accidents.forEach(a => {
        inMemoryAccidents.push({ ...a, _id: (nextId++).toString(), createdAt: new Date() });
      });
    }

    res.json({ message: `Successfully uploaded ${accidents.length} accident records` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete accident
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    try {
      const accident = await Accident.findByIdAndDelete(req.params.id);
      if (!accident) return res.status(404).json({ message: "Not found" });
    } catch (dbErr) {
      const idx = inMemoryAccidents.findIndex(a => a._id === req.params.id);
      if (idx === -1) return res.status(404).json({ message: "Not found" });
      inMemoryAccidents.splice(idx, 1);
    }
    res.json({ message: "Accident deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update accident
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    try {
      const accident = await Accident.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!accident) return res.status(404).json({ message: "Not found" });
      return res.json(accident);
    } catch (dbErr) {
      const idx = inMemoryAccidents.findIndex(a => a._id === req.params.id);
      if (idx === -1) return res.status(404).json({ message: "Not found" });
      inMemoryAccidents[idx] = { ...inMemoryAccidents[idx], ...req.body };
      return res.json(inMemoryAccidents[idx]);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
