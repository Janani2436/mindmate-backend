// routes/aiRoutes.js
import express from 'express';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';

config();

const router = express.Router();

// ✅ Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ✅ POST /api/ai/videochat (uses OpenRouter)
router.post('/videochat', authenticateToken, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const aiReply = response.data.choices[0].message.content.trim();
    res.json({ response: aiReply });
  } catch (error) {
    console.error('❌ AI error:', error.response?.data || error.message);
    res.status(500).json({ message: 'AI failed to respond' });
  }
});

export default router;
