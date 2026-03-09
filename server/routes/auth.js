const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const router = express.Router();

// In-memory fallback for development without MongoDB
const inMemoryUsers = [];

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Try MongoDB first
    try {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: "Email already registered" });
      
      const user = await User.create({ name, email, password, role });
      const token = generateToken(user);
      return res.status(201).json({ 
        token, 
        user: { id: user._id, name: user.name, email: user.email, role: user.role } 
      });
    } catch (dbErr) {
      // Fallback to in-memory
      const existing = inMemoryUsers.find(u => u.email === email);
      if (existing) return res.status(400).json({ message: "Email already registered" });
      
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = { id: Date.now().toString(), name, email, password: hashedPassword, role };
      inMemoryUsers.push(user);
      
      const token = generateToken(user);
      return res.status(201).json({ 
        token, 
        user: { id: user.id, name, email, role } 
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = generateToken(user);
      return res.json({ 
        token, 
        user: { id: user._id, name: user.name, email: user.email, role: user.role } 
      });
    } catch (dbErr) {
      const bcrypt = require("bcryptjs");
      const user = inMemoryUsers.find(u => u.email === email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = generateToken(user);
      return res.json({ 
        token, 
        user: { id: user.id, name: user.name, email, role: user.role } 
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user
router.get("/me", protect, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
