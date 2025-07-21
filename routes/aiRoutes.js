import express from 'express';
import { handleVideoChat } from '../controllers/aiController.js';
const router = express.Router();

router.post('/videochat', handleVideoChat);
router.get('/test', (req, res) => res.send("✅ /api/ai/test is working"));

export default router;
