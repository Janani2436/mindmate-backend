import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema({
  mood: { type: String, required: true },
  note: { type: String },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // ✅ Needed for streak & personal mood data
  },
}, { timestamps: true });

export default mongoose.model('Mood', moodSchema);
