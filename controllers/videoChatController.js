import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { processFrame, validateImageData, extractBase64Data } from '../utils/emotionVideoProcessor.js';
import { translateText } from '../utils/translate.js';
import ChatMessage from '../models/ChatMessage.js';

// Supported languages
const validLanguages = ['en', 'ta', 'hi', 'es', 'fr', 'de', 'te', 'zh', 'ar'];

/**
 * Process video frame and generate AI response based on detected emotion
 */
const processVideoFrame = async (req, res) => {
  console.log("📹 Incoming video chat request");
  console.log("🌐 Language:", req.body?.language);
  console.log("👤 Authenticated user:", req.user?._id);

  const { imageData, message = '', language = 'en' } = req.body;

  // Validate required fields
  if (!imageData) {
    return res.status(400).json({ 
      success: false,
      message: 'Image data is required for video chat' 
    });
  }

  // Validate image data format
  if (!validateImageData(imageData)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid image data format. Please provide base64 encoded image.' 
    });
  }

  try {
    const targetLang = validLanguages.includes(language) ? language : 'en';

    // Step 1: Extract pure base64 data
    const base64Data = extractBase64Data(imageData);

    // Step 2: Detect emotion from video frame
    console.log("🎭 Processing video frame for emotion detection...");
    const detectedEmotion = await processFrame(base64Data);
    console.log("✅ Detected emotion:", detectedEmotion);

    // Step 3: Prepare context message
    let contextMessage = message.trim();
    if (!contextMessage) {
      contextMessage = "I'm sharing my video with you. How are you feeling about my current state?";
    }

    // Step 4: Translate user message to English if needed
    let englishMessage = contextMessage;
    if (targetLang !== 'en' && contextMessage) {
      try {
        englishMessage = await translateText(contextMessage, targetLang, 'en');
      } catch (err) {
        console.warn("⚠️ Translation to English failed:", err.message);
      }
    }

    // Step 5: Create emotion-aware system prompt
    const emotionPromptMap = {
      happy: "The user appears to be happy and joyful. Celebrate their positive mood and encourage them to maintain this wonderful state. Offer suggestions for sustaining happiness.",
      sad: "The user seems to be feeling sad or down. Respond with extra empathy, care, and gentle support. Offer comforting words and practical coping strategies.",
      angry: "The user appears to be angry or frustrated. Acknowledge their feelings calmly and help them process these emotions constructively. Suggest healthy ways to manage anger.",
      anxious: "The user seems anxious or worried. Be supportive and offer calming advice. Provide grounding techniques and reassurance.",
      excited: "The user appears excited and energetic. Match their enthusiasm appropriately while helping them channel this positive energy constructively.",
      neutral: "The user appears calm and neutral. Engage them in a balanced, supportive conversation and check in on their overall wellbeing.",
      default: "Respond with empathy and provide supportive guidance based on the user's current emotional state."
    };

    const emotionGuidance = emotionPromptMap[detectedEmotion] || emotionPromptMap.default;
    const systemPrompt = `You are a compassionate and empathetic mental health support assistant for MindMate. You can see the user through video chat and have detected their current emotional state. 

Current user emotion: ${detectedEmotion}

Guidance: ${emotionGuidance}

Respond in a warm, understanding manner. Keep your response concise but meaningful (2-3 sentences). Focus on:
1. Acknowledging their current emotional state
2. Providing appropriate support or encouragement
3. Offering a practical suggestion if relevant

Be culturally sensitive and avoid clinical language. Speak as a caring friend who understands emotions.`;

    // Step 6: Prepare OpenRouter request
    const model = process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free";
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        success: false,
        message: "AI service configuration error" 
      });
    }

    console.log("🤖 Generating AI response with emotion context...");

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: englishMessage },
        ],
        max_tokens: 200,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000
      }
    );

    const aiEnglishReply = response.data?.choices?.[0]?.message?.content?.trim();
    if (!aiEnglishReply) {
      return res.status(500).json({ 
        success: false,
        message: "AI did not return a valid response." 
      });
    }

    // Step 7: Translate reply back if needed
    let finalReply = aiEnglishReply;
    if (targetLang !== 'en') {
      try {
        finalReply = await translateText(aiEnglishReply, 'en', targetLang);
      } catch (err) {
        console.warn("⚠️ Failed to translate reply:", err.message);
        // Keep English reply as fallback
      }
    }

    // Step 8: Save to database if user is authenticated
    if (req.user?._id) {
      try {
        await new ChatMessage({
          user: req.user._id,
          sessionType: 'video',
          messages: [
            { 
              role: 'user', 
              content: `[Video Chat] ${contextMessage}`,
              emotion: detectedEmotion,
              timestamp: new Date()
            },
            { 
              role: 'bot', 
              content: finalReply,
              emotion: detectedEmotion,
              timestamp: new Date()
            },
          ],
        }).save();
        console.log("💾 Video chat conversation saved to database");
      } catch (dbError) {
        console.error("🔴 Database save error:", dbError.message);
        // Don't fail the request if DB save fails
      }
    }

    // Step 9: Send response
    res.json({ 
      success: true,
      reply: finalReply, 
      emotion: detectedEmotion,
      language: targetLang,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("🔴 Video chat processing error:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    });

    res.status(500).json({
      success: false,
      message: "Error processing video chat request.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get video chat history for authenticated user
 */
const getVideoChatHistory = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    // Get chat history with video chat messages
    const chatHistory = await ChatMessage.find({ 
      user: req.user._id,
      'messages.content': { $regex: /^\[Video Chat\]/, $options: 'i' }
    })
    .sort({ createdAt: -1 })
    .limit(50); // Limit to last 50 video chat sessions

    // Transform the data to include emotion analytics
    const processedHistory = chatHistory.map(chat => ({
      id: chat._id,
      timestamp: chat.createdAt,
      messages: chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        emotion: msg.emotion,
        timestamp: msg.timestamp
      }))
    }));

    // Calculate emotion statistics
    const emotionStats = {};
    chatHistory.forEach(chat => {
      chat.messages.forEach(msg => {
        if (msg.emotion && msg.role === 'user') {
          emotionStats[msg.emotion] = (emotionStats[msg.emotion] || 0) + 1;
        }
      });
    });

    res.json({ 
      success: true,
      history: processedHistory,
      emotionStats,
      totalSessions: chatHistory.length
    });

  } catch (error) {
    console.error("❌ Video chat history fetch error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch video chat history" 
    });
  }
};

/**
 * Get emotion analytics for the user
 */
const getEmotionAnalytics = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get emotion data from the specified time period
    const emotionData = await ChatMessage.find({
      user: req.user._id,
      createdAt: { $gte: startDate },
      'messages.emotion': { $exists: true }
    }).select('messages.emotion messages.timestamp createdAt');

    // Process emotion trends
    const emotionTrends = {};
    const dailyEmotions = {};

    emotionData.forEach(chat => {
      const date = chat.createdAt.toISOString().split('T')[0];
      
      chat.messages.forEach(msg => {
        if (msg.emotion && msg.role === 'user') {
          // Overall trends
          emotionTrends[msg.emotion] = (emotionTrends[msg.emotion] || 0) + 1;
          
          // Daily breakdown
          if (!dailyEmotions[date]) {
            dailyEmotions[date] = {};
          }
          dailyEmotions[date][msg.emotion] = (dailyEmotions[date][msg.emotion] || 0) + 1;
        }
      });
    });

    res.json({
      success: true,
      analytics: {
        emotionTrends,
        dailyEmotions,
        totalSessions: emotionData.length,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error("❌ Emotion analytics fetch error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch emotion analytics" 
    });
  }
};

export { processVideoFrame, getVideoChatHistory, getEmotionAnalytics };
