const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, hostel, room } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      hostel,
      room
    });

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Quick dev fallback when running locally and DB is down
    if (process.env.DEV_LOGIN === 'true') {
      const devEmail = process.env.DEV_EMAIL || 'dev@local';
      const devPassword = process.env.DEV_PASSWORD || 'devpass';
      const devRole = process.env.DEV_ROLE || 'management';

      if (email === devEmail && password === devPassword) {
        const token = jwt.sign({ id: 'dev-user', role: devRole }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, role: devRole, name: 'Dev User' });
      }
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      name: user.name
    });
  } catch (err) {
    // If DB is down and DEV_LOGIN is enabled, allow dev creds as a fallback
    if (process.env.DEV_LOGIN === 'true') {
      const devEmail = process.env.DEV_EMAIL || 'dev@local';
      const devPassword = process.env.DEV_PASSWORD || 'devpass';
      const devRole = process.env.DEV_ROLE || 'management';

      const { email, password } = req.body;
      if (email === devEmail && password === devPassword) {
        const token = jwt.sign({ id: 'dev-user', role: devRole }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, role: devRole, name: 'Dev User' });
      }
    }

    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
