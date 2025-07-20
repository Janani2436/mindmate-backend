import dotenv from 'dotenv';
dotenv.config(); // <-- REQUIRED to load .env variables

import axios from 'axios';
import { detectEmotion } from '../utils/emotionDetector.js';
import { translateText } from '../utils/translate.js';
import ChatMessage from '../models/ChatMessage.js';

// Supported languages
const validLanguages = ['en', 'ta', 'hi', 'es', 'fr', 'de', 'te', 'zh', 'ar'];

const chat = async (req, res) => {
  console.log("📩 Incoming message:", req.body?.message);
  console.log("🌐 Language:", req.body?.language);
  console.log("👤 Authenticated user:", req.user?._id);

  const { message, language = 'en' } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    const targetLang = validLanguages.includes(language) ? language : 'en';

    // Step 1: Translate user message to English if needed
    let englishMessage = message;
    if (targetLang !== 'en') {
      try {
        englishMessage = await translateText(message, targetLang, 'en');
      } catch (err) {
        console.warn("⚠️ Translation to English failed:", err.message);
      }
    }

    // Step 2: Detect emotion
    const emotion = detectEmotion(englishMessage);
    const emotionPromptMap = {
      sad: "Respond with extra empathy and care.",
      angry: "Try to calm the user and acknowledge their frustration.",
      anxious: "Be supportive and offer calming advice.",
      happy: "Celebrate their joy and encourage them.",
      lonely: "Show understanding and offer comforting thoughts.",
      default: "Respond kindly and helpfully.",
    };
    const systemPrompt = `You are a kind and empathetic mental health support assistant. ${emotionPromptMap[emotion] || emotionPromptMap.default}`;

    // Step 3: Prepare OpenRouter request
    const model = process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free";
    const apiKey = process.env.OPENROUTER_API_KEY;

    console.log("🔑 OPENROUTER_API_KEY present?", !!process.env.OPENROUTER_API_KEY);
    console.log("🔧 Model:", process.env.OPENROUTER_MODEL);


    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: englishMessage },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiEnglishReply = response.data?.choices?.[0]?.message?.content?.trim();
    if (!aiEnglishReply) {
      return res.status(500).json({ message: "AI did not return a valid response." });
    }

    // Step 4: Translate reply back if needed
    let finalReply = aiEnglishReply;
    if (targetLang !== 'en') {
      try {
        finalReply = await translateText(aiEnglishReply, 'en', targetLang);
      } catch (err) {
        console.warn("⚠️ Failed to translate reply:", err.message);
      }
    }

    // Step 5: Save to DB if user is authenticated
    if (req.user?._id) {
      await new ChatMessage({
        user: req.user._id,
        sessionType: 'text',
        messages: [
          { role: 'user', content: message, emotion },
          { role: 'bot', content: finalReply, emotion },
        ],
      }).save();
    }

    // Step 6: Send response
    res.json({ reply: finalReply, emotion });

  } catch (error) {
    console.error("🔴 Chat processing error:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    });

    res.status(500).json({
      message: "Error during chat.",
      details: error.response?.data || error.message,
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const chatHistory = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(chatHistory);
  } catch (error) {
    console.error("❌ Chat history fetch error:", error.message);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
};

export { chat, getChatHistory };
