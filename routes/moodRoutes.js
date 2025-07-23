import express from 'express';
import Mood from '../models/Mood.js';
import { protect } from '../middleware/authMiddleware.js';
import { getMoodStreak } from '../controllers/moodController.js';
const router = express.Router();

// ✅ Public test route
router.get('/test', (req, res) => {
  res.send('✅ Mood route test is working!');
});

// Get moods for logged-in user
router.get('/', protect, async (req, res) => {
  const moods = await Mood.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(moods);
});
router.get('/streak', protect, getMoodStreak);
// Add mood
router.post('/', protect, async (req, res) => {
  const { mood, note } = req.body;
  const newMood = new Mood({ mood, note, user: req.user._id });
  await newMood.save();
  res.status(201).json(newMood);
});

// Delete mood
router.delete('/:id', protect, async (req, res) => {
  const mood = await Mood.findById(req.params.id);
  if (!mood) return res.status(404).json({ message: 'Mood not found' });
  if (mood.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized to delete' });
  }
  await mood.remove();
  res.json({ message: 'Mood deleted' });
});

export default router;
