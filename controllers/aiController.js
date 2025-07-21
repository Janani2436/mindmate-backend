// controllers/aiController.js
import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

export const handleVideoChat = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
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
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const aiMessage =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      '🤖 No AI response.';
    res.json({ response: aiMessage });
  } catch (err) {
    if (err.response) {
      console.error('❌ OpenRouter API Error:', err.response.status, err.response.data);
    } else {
      console.error('❌ OpenRouter API Error:', err.message);
    }
    res.status(500).json({ error: 'AI response failed' });
  }
};
