// MindMate backend - aiController.js
import axios from 'axios';
import { translateText, detectLanguage } from '../utils/translate.js';
import dotenv from 'dotenv';
dotenv.config();

export const handleVideoChat = async (req, res) => {
  const { prompt, language } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const userLang = language || (await detectLanguage(prompt)) || 'en';

  try {
    const translatedPrompt = userLang !== 'en'
      ? await translateText(prompt, userLang, 'en')
      : prompt;

    const aiResponse = await axios.post(
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

    const aiReplyInEnglish = aiResponse.data?.choices?.[0]?.message?.content?.trim() || '🤖 No response.';

    const finalReply = userLang !== 'en'
      ? await translateText(aiReplyInEnglish, 'en', userLang)
      : aiReplyInEnglish;

    res.json({ response: finalReply });
  } catch (err) {
    console.error('❌ AI Chat failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI response failed' });
  }
};
