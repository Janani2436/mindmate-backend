import axios from 'axios';
import { detectEmotion } from '../utils/emotionDetector.js';
import { translateText } from '../utils/translate.js';
import ChatMessage from '../models/ChatMessage.js';

const validLanguages = ['en', 'ta', 'hi', 'es', 'fr', 'de', 'te', 'zh', 'ar'];

const chat = async (req, res) => {
  const { message, language = 'en' } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const targetLang = validLanguages.includes(language) ? language : 'en';

    let userMessageEnglish = message;
    if (targetLang !== 'en') {
      try {
        userMessageEnglish = await translateText(message, targetLang, 'en');
      } catch (err) {
        console.warn("⚠️ Translation failed:", err.message);
      }
    }

    const emotion = detectEmotion(userMessageEnglish);

    const emotionPromptMap = {
      sad: "Respond with extra empathy and care.",
      angry: "Try to calm the user and acknowledge their frustration.",
      anxious: "Be supportive and offer calming advice.",
      happy: "Celebrate their joy and encourage them.",
      lonely: "Show understanding and offer comforting thoughts.",
      default: "Respond kindly and helpfully.",
    };

    const systemPrompt = `You are a kind and empathetic mental health support assistant. ${emotionPromptMap[emotion] || emotionPromptMap.default}`;

    const openRouterRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: process.env.OPENROUTER_MODEL || "gryphe/mythomist-7b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessageEnglish },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiEnglishReply = openRouterRes.data?.choices?.[0]?.message?.content?.trim();
    if (!aiEnglishReply) {
      return res.status(500).json({ message: "Invalid response from AI" });
    }

    let finalReply = aiEnglishReply;
    if (targetLang !== 'en') {
      try {
        finalReply = await translateText(aiEnglishReply, 'en', targetLang);
      } catch (err) {
        console.warn("⚠️ Reverse translation failed:", err.message);
      }
    }

    if (req.user?._id) {
      await new ChatMessage({
        user: req.user._id,
        messages: [
          { role: "user", content: message, emotion },
          { role: "bot", content: finalReply, emotion },
        ],
      }).save();
    }

    res.json({ reply: finalReply, emotion });

  } catch (error) {
    console.error("🔴 Chat Error:", {
      message: error.message,
      responseData: error.response?.data,
    });

    res.status(500).json({
      message: "Something went wrong during chat processing",
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const chatHistory = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(chatHistory);
  } catch (error) {
    console.error("❌ Chat history error:", error.message);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
};

export { chat, getChatHistory };
