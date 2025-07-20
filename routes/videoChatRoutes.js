import express from 'express';
import { processVideoFrame, getVideoChatHistory, getEmotionAnalytics } from '../controllers/videoChatController.js';
import { protect } from '../middleware/authMiddleware.js'; // ✅ FIXED

const router = express.Router();

// ✅ Process video frame for emotion detection and AI response
router.post('/', protect, processVideoFrame);

// ✅ Get video chat history for authenticated user
router.get('/history', protect, getVideoChatHistory);

// ✅ Get emotion analytics for the user
router.get('/analytics', protect, getEmotionAnalytics);

// ✅ Health check for video chat service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Video chat service is running',
    timestamp: new Date().toISOString(),
    features: {
      emotionDetection: true,
      multilingualSupport: true,
      chatHistory: true,
      analytics: true
    }
  });
});

export default router;
