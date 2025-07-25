// MindMate backend - chatMessage.js
import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    messages: [
      {
        _id: false, // auto-generated IDs are prevented
        role: {
          type: String,
          enum: ['user', 'bot'],
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: 2000, // limits message lenghth
        },
        emotion: {
          type: String,
          enum: [
            'happy',
            'sad',
            'angry',
            'anxious',
            'excited',
            'neutral',
            'lonely',
            'confused',
            'engaged',
          ],
          default: 'neutral',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sessionType: {
      type: String,
      enum: ['text', 'video'],
      default: 'text',
    },
  },
  {
    timestamps: true,
  }
);


chatMessageSchema.index({ user: 1, createdAt: -1 });
chatMessageSchema.index({ user: 1, sessionType: 1 });
chatMessageSchema.index({ 'messages.emotion': 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
