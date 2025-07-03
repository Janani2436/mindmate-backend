import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // ✅ Add bcrypt for password hashing
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// ✅ Function to generate JWT token
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// ✅ Register Route
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user already exists
    const existing = await User.findOne({ username });
    if (existing)
      return res.status(400).json({ message: 'Username already exists' });

    // ✅ Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({ username, password: hashedPassword });
    await user.save();

    // Return response with token
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, username: user.username },
      token: generateToken(user),
    });
  } catch (err) {
    console.error('🔴 Registration error:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ✅ Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Return response with token
    res.json({
      message: 'Login successful',
      user: { id: user._id, username: user.username },
      token: generateToken(user),
    });
  } catch (err) {
    console.error('🔴 Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

export default router;
