const mongoose = require("mongoose");

const accidentSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  weather: { type: String, required: true },
  road_condition: { type: String, required: true },
  vehicle_type: { type: String, required: true },
  speed_limit: { type: Number, required: true },
  light_condition: { type: String, required: true },
  time_of_day: { type: String, required: true },
  accident_severity: { type: String, enum: ["Minor", "Serious", "Fatal"], required: true },
  year: { type: Number },
  month: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Accident", accidentSchema);
