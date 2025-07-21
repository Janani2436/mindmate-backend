// server/utils/translate.js
import axios from 'axios';

const LIBRE_TRANSLATE_URL = 'https://libretranslate.de';

export const translateText = async (text, sourceLang, targetLang) => {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('❌ Text to translate must be a non-empty string.');
  }

  if (!sourceLang || !targetLang) {
    throw new Error('❌ Source and target language codes are required.');
  }

  try {
    const response = await axios.post(`${LIBRE_TRANSLATE_URL}/translate`, {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data?.translatedText) {
      return response.data.translatedText;
    }

    throw new Error('Unexpected response structure from LibreTranslate.');
  } catch (error) {
    console.error('🔴 Translation Error:', error.message || error);
    // Fallback: return original text if translation fails
    return text;
  }
};

export const detectLanguage = async (text) => {
  if (!text || typeof text !== 'string' || text.trim() === '') return 'en';

  try {
    const response = await axios.post(`${LIBRE_TRANSLATE_URL}/detect`, {
      q: text
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0]?.language || 'en';
    }

    throw new Error('Unexpected response from language detection.');
  } catch (error) {
    console.error('🔴 Language Detection Error:', error.message || error);
    return 'en'; // fallback to English
  }
};
