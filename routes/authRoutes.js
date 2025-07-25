// MindMate backend - authRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// user registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log('🟢 Register attempt:', username);

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ message: 'Username must be 3 to 30 characters.' });
  }

  try {
    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await User.create({ username, password });
    console.log('✅ User created:', user);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, username: user.username },
      token: generateToken(user),
    });
  } catch (err) {
    console.error('⛔ Registration error:', err.message);
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// user LogIn
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

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
