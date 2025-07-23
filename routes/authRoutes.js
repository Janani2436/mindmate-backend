import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// JWT generator
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// 🟢 Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const exists = await User.findOne({ username });

    if (exists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, username: user.username },
      token: generateToken(user),
    });
  } catch (err) {
    console.error('⛔ Registration error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 🔵 Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: { id: user._id, username: user.username },
      token: generateToken(user),
    });
  } catch (err) {
    console.error('⛔ Login error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
