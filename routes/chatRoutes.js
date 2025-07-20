// routes/chatRoutes.js
import express from 'express';
import { chat, getChatHistory } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, chat); // Correct: POST /api/chat
router.get('/history', protect, getChatHistory);

export default router;
