import axios from 'axios';
import { detectEmotion } from '../utils/emotionDetector.js';
import { translateText } from '../utils/translate.js';
import ChatMessage from '../models/ChatMessage.js';

const validLanguages = ['en','ta','hi','es','fr','de','te','zh','ar'];

const chat = async (req, res) => {
  console.log("📩 Req.body:", req.body);
  console.log("👤 User:", req.user?.id);

  const { message, language = 'en' } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

  try {
    const targetLang = validLanguages.includes(language) ? language : 'en';
    let english = message;
    if (targetLang !== 'en') {
      try { english = await translateText(message, targetLang, 'en'); }
      catch(err) { console.warn('⚠️ Translate->en failed:', err.message); }
    }

    const emotion = detectEmotion(english);
    const prompts = {
      sad: "Respond with extra empathy and care.",
      angry: "Try to calm the user.",
      anxious: "Be supportive and calming.",
      happy: "Celebrate joy.",
      lonely: "Offer companionship.",
      default: "Respond kindly."
    };
    const systemPrompt = `You are kind and supportive. ${prompts[emotion] || prompts.default}`;

    const model = process.env.OPENROUTER_MODEL;
    const key = process.env.OPENROUTER_API_KEY;

    console.log("🔑 Model:", model);
    console.log("🔑 API Key present?", !!key);

    const oRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      { model, messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: english }
      ]},
      { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } }
    );

    const aiReply = oRes.data?.choices?.[0]?.message?.content?.trim();
    if (!aiReply) return res.status(500).json({ message: "Empty AI reply" });

    let final = aiReply;
    if (targetLang !== 'en') {
      try { final = await translateText(aiReply, 'en', targetLang); }
      catch(err) { console.warn('⚠️ Translate->user failed:', err.message); }
    }

    await new ChatMessage({ user: req.user._id, messages: [
      { role: 'user', content: message, emotion },
      { role: 'bot', content: final, emotion }
    ]}).save();

    res.json({ reply: final, emotion });

  } catch(error) {
    console.error('🔴 Chat Error full:', {
      msg: error.message,
      data: error.response?.data,
      stack: error.stack,
      model: process.env.OPENROUTER_MODEL,
      apiKey: !!process.env.OPENROUTER_API_KEY
    });
    res.status(500).json({
      message: "Error during chat.",
      details: error.response?.data || error.message
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const history = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(history);
  } catch(error) {
    console.error("❌ History fetch error:", error);
    res.status(500).json({ message: "Fetch history failed" });
  }
};

export { chat, getChatHistory };
