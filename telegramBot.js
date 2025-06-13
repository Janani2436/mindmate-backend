// telegrambot.js
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const axios = require('axios');
const { transcribeVoice } = require('./deepgramHelper');

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

let conversationHistory = [
  { role: "system", content: "You are a kind and empathetic mental health support assistant." }
];

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.voice) {
    bot.sendChatAction(chatId, 'typing');
    const fileId = msg.voice.file_id;

    try {
      const fileLink = await bot.getFileLink(fileId);
      const transcribedText = await transcribeVoice(fileLink);

      bot.sendMessage(chatId, `🧠 MindMate: You said - "${transcribedText}"`);
    } catch (error) {
      if (error.message.includes('No speech detected')) {
        bot.sendMessage(chatId, "🤔 I couldn't hear anything in your voice message. Could you please try speaking a little louder?");
      } else {
        bot.sendMessage(chatId, "😔 Sorry, there was an issue processing your voice. Please try again later.");
      }
    }
  } else {
    bot.sendMessage(chatId, '📢 Please send a voice message to chat!');
  }
});

