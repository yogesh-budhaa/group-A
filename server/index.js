const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const accidentRoutes = require("./routes/accidents");
const mlRoutes = require("./routes/ml");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/accidents", accidentRoutes);
app.use("/api", mlRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Accident Prediction API running",
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/accident_db")
  .then(() => {
    console.log("✅ Connected to MongoDB");
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Try setting a different PORT in your .env or stop the process using that port.`);
      } else {
        console.error('❌ Server error:', err);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    // Start server anyway for development
    const server = app.listen(PORT, () => {
      console.log(`⚠️  Server running on http://localhost:${PORT} (without DB)`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Try setting a different PORT in your .env or stop the process using that port.`);
      } else {
        console.error('❌ Server error:', err);
      }
      process.exit(1);
    });
  });

module.exports = app;
