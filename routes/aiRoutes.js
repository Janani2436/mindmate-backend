import express from 'express';
import { handleVideoChat } from '../controllers/aiController.js';

const router = express.Router();

router.get('/test', (req, res) => res.send('✅ /api/ai/test is working'));
router.post('/videochat', handleVideoChat);

export default router;
