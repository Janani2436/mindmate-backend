// MindMate backend - mood.js
import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema({
  mood: { type: String, required: true },
  note: { type: String },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // datas are collected from user
  },
}, { timestamps: true });

export default mongoose.model('Mood', moodSchema);
