import axios from 'axios';
import { detectEmotion } from '../utils/emotionDetector.js';
import { translateText } from '../utils/translate.js';
import ChatMessage from '../models/ChatMessage.js';

// Supported languages
const validLanguages = ['en', 'ta', 'hi', 'es', 'fr', 'de', 'te', 'zh', 'ar'];

const chat = async (req, res) => {
  console.log("📩 Incoming request body:", req.body);
  console.log("👤 Authenticated user:", req.user);

  const { message, language = 'en' } = req.body;
  console.log("📩 Received message:", { message, language });

  if (!message?.trim()) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const targetLang = validLanguages.includes(language) ? language : 'en';

    // Translate to English if needed
    let userMessageEnglish = message;
    if (targetLang !== 'en') {
      try {
        userMessageEnglish = await translateText(message, targetLang, 'en');
      } catch (err) {
        console.warn("⚠️ Translation to English failed, using original:", err.message);
      }
    }

    // Emotion detection
    console.log("🔤 Message for emotion detection:", userMessageEnglish);
    const emotion = detectEmotion(userMessageEnglish);
    console.log("🔍 Emotion detected:", emotion);

    // Emotion-based prompt
    const emotionPromptMap = {
      sad: "Respond with extra empathy and care.",
      angry: "Try to calm the user and acknowledge their frustration.",
      anxious: "Be supportive and offer calming advice.",
      happy: "Celebrate their joy and encourage them.",
      lonely: "Show understanding and offer comforting thoughts.",
      default: "Respond kindly and helpfully.",
    };

    const promptPrefix = emotionPromptMap[emotion] || emotionPromptMap.default;
    const systemPrompt = `You are a kind and empathetic mental health support assistant. ${promptPrefix}`;

    console.log("🔑 Using model:", process.env.OPENROUTER_MODEL);
    console.log("🔑 Using API Key:", process.env.OPENROUTER_API_KEY ? "[Present]" : "[Missing]");

    // Call OpenRouter API
    const openRouterRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: process.env.OPENROUTER_MODEL || "mistralai/mistral-small-3.2-24b-instruct:free",

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
      console.error("⚠️ Empty response from OpenRouter:", openRouterRes.data);
      return res.status(500).json({ message: "Invalid response from AI" });
    }

    // Translate back if needed
    let finalReply = aiEnglishReply;
    if (targetLang !== 'en') {
      try {
        finalReply = await translateText(aiEnglishReply, 'en', targetLang);
      } catch (err) {
        console.warn("⚠️ Translation to user language failed:", err.message);
      }
    }

    if (!req.user?._id) {
      console.warn("⚠️ Missing user ID on request.");
    }

    // Save chat to DB
    await new ChatMessage({
      user: req.user._id,
      messages: [
        { role: "user", content: message, emotion },
        { role: "bot", content: finalReply, emotion },
      ],
    }).save();

    res.json({ reply: finalReply, emotion });

  } catch (error) {
    console.error("🔴 Chat Error:", {
      message: error.message,
      stack: error.stack,
      responseData: error.response?.data,
      fullError: error.toString(),
      requestBody: req.body,
      apiKey: process.env.OPENROUTER_API_KEY ? '[KEY PRESENT]' : '[KEY MISSING]',
      model: process.env.OPENROUTER_MODEL,
    });

    res.status(500).json({
      message: "Something went wrong during chat processing",
      error: error.message,
      response: error.response?.data,
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const chatHistory = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(chatHistory);
  } catch (error) {
    console.error("❌ Failed to retrieve chat history:", error.message);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
};

export { chat, getChatHistory };
