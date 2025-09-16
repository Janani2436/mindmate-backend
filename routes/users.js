// /routes/users.js
import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all users (name, email, role), protected route
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({}, 'name email role'); // select these fields only
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

export default router;
