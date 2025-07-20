import express from 'express';
import { handleVideoChat } from '../controllers/aiController.js';
const router = express.Router();

router.post('/videochat', handleVideoChat);

export default router;
