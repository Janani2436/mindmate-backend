import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [
    {
      _id: false,  // Prevent Mongoose from auto-generating subdocument IDs
      role: { type: String, enum: ['user', 'bot'], required: true },
      content: { type: String, required: true },
      emotion: { 
        type: String, 
        enum: ['happy', 'sad', 'angry', 'anxious', 'excited', 'neutral', 'lonely', 'confused', 'engaged'],
        default: 'neutral'
      },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  sessionType: {
    type: String,
    enum: ['text', 'video'],
    default: 'text'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
  // Optional TTL (uncomment if you want auto-delete after N days)
  // , expiresAt: {
  //   type: Date,
  //   default: () => new Date(Date.now() + 180*24*60*60*1000) // 180 days from now
  // }
}, {
  // Optional: Automatically include createdAt and updatedAt
  // timestamps: true
});

// 📌 Indexes for better performance
chatMessageSchema.index({ user: 1, createdAt: -1 });
chatMessageSchema.index({ user: 1, sessionType: 1 });
chatMessageSchema.index({ 'messages.emotion': 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
