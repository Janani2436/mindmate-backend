// MindMate backend - routes/chatRoutes.js (FINAL VERSION)

import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

// Setup the router
const router = express.Router();

/**
 * @route   POST /api/chat
 * @desc    Handles chat messages with the AI model
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    // 1. Check for the API Key first
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('SERVER_ERROR: Google AI API key is not configured.');
    }

    // 2. Initialize the AI Client inside the handler
    const genAI = new GoogleGenerativeAI(apiKey);

    // 3. Process the request
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ message: text });

  } catch (error) {
    // 4. Log any error that occurs
    console.error('❗ Error in /api/chat route:', error.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

export default router;
