import Mood from '../models/Mood.js';

export const addMood = async (req, res) => {
  const user = req.user?._id;
  const { mood, note } = req.body;

  if (!user) return res.status(401).json({ message: 'Not authenticated.' });
  if (!mood || mood.trim() === '') return res.status(400).json({ message: 'Mood is required.' });

  try {
    const newMood = await Mood.create({ mood, note, user });
    res.status(201).json(newMood);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save mood.', error: err.message });
  }
};

export const getMoods = async (req, res) => {
  const user = req.user?._id;
  if (!user) return res.status(401).json({ message: 'Not authenticated.' });

  try {
    const moods = await Mood.find({ user }).sort({ createdAt: 1 });
    res.json(moods);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch moods.', error: err.message });
  }
};

export const deleteMood = async (req, res) => {
  const user = req.user?._id;
  const moodId = req.params.id;

  try {
    const mood = await Mood.findOneAndDelete({ _id: moodId, user });
    if (!mood) return res.status(404).json({ message: 'Mood not found.' });
    res.json({ message: 'Mood deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete mood.', error: err.message });
  }
};
