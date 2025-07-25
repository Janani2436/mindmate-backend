// MindMate backend - chatController.js
import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { detectEmotion } from '../utils/emotionDetector.js';
import { translateText } from '../utils/translate.js';
import ChatMessage from '../models/ChatMessage.js';

// translational languages
const validLanguages = ['en', 'ta', 'hi', 'es', 'fr', 'de', 'te', 'zh', 'ar'];

export const chat = async (req, res) => {
  const { message, language = 'en' } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ message: 'Message is required' });
  }
  try {
    const targetLang = validLanguages.includes(language) ? language : 'en';

    // english translation is done if neede
    let englishMessage = message;
    if (targetLang !== 'en') {
      try {
        englishMessage = await translateText(message, targetLang, 'en');
      } catch {
        
      }
    }

    // prompt given to AI
    const emotion = detectEmotion(englishMessage);
    const emotionPromptMap = {
      sad: 'Respond with empathy and reassurance.',
      happy: 'Celebrate their joy and encourage positivity.',
      anxious: 'Speak calmly and acknowledge anxiety.',
      angry: 'Stay composed and offer support.',
      lonely: 'Offer company and caring words.',
      default: 'Be kind and supportive as a mental health assistant.',
    };
    const emotionPrompt = emotionPromptMap[emotion] || emotionPromptMap.default;
    const systemPrompt = `You are an empathetic AI therapist. ${emotionPrompt}`;

    // Operouter API is called
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: englishMessage },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiEnglishReply = response.data?.choices?.[0]?.message?.content?.trim();
    if (!aiEnglishReply)
      return res.status(500).json({ message: 'AI did not return a valid response.' });

    
    let finalReply = aiEnglishReply;
    if (targetLang !== 'en') {
      try {
        finalReply = await translateText(aiEnglishReply, 'en', targetLang);
      } catch {
        /* English fallback */
      }
    }

    // conversation is saved
    if (req.user?._id) {
      await ChatMessage.create({
        user: req.user._id,
        sessionType: 'text',
        messages: [
          { role: 'user', content: message, emotion },
          { role: 'bot', content: finalReply, emotion },
        ],
      });
    }

    res.json({ reply: finalReply, emotion });
  } catch (error) {
    console.error('🔴 Chat error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error during chat', details: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const chatHistory = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(chatHistory);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
};
