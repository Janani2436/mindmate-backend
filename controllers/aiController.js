// controllers/aiController.js
import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { translateText, detectLanguage } from '../utils/translate.js';

export const handleVideoChat = async (req, res) => {
  const { prompt, language } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  // Step 1: Determine language
  const userLang = language || (await detectLanguage(prompt)) || 'en';

  try {
    // Step 2: Translate prompt into English for AI input
    const translatedPrompt = userLang !== 'en'
      ? await translateText(prompt, userLang, 'en')
      : prompt;

    // Step 3: Call the AI API with emotion-sensitive prompt
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'You are an emotionally supportive AI assistant.',
          },
          {
            role: 'user',
            content: translatedPrompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    // Step 4: Extract response
    const aiReplyInEnglish =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      '🤖 No AI response.';

    // Step 5: Translate reply to user's language
    const finalReply =
      userLang !== 'en'
        ? await translateText(aiReplyInEnglish, 'en', userLang)
        : aiReplyInEnglish;

    // Return final reply
    res.json({ response: finalReply });
  } catch (err) {
    console.error('❌ AI Chat Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI response failed' });
  }
};
