import express from 'express';
import { processVideoFrame, getVideoChatHistory, getEmotionAnalytics } from '../controllers/videoChatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, processVideoFrame);
router.get('/history', protect, getVideoChatHistory);
router.get('/analytics', protect, getEmotionAnalytics);
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Video chat service is running',
    timestamp: new Date().toISOString(),
    features: {
      emotionDetection: true,
      multilingualSupport: true,
      chatHistory: true,
      analytics: true,
    },
  });
});

export default router;
