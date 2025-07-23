import axios from 'axios';

// Stable LibreTranslate cloud instance
const LIBRE_TRANSLATE_URL = 'https://translate.argosopentech.com';

/**
 * Translate text from one language to another using LibreTranslate API
 * @param {string} text - Text to translate (e.g. 'Hello')
 * @param {string} sourceLang - ISO 639-1 code of source language (e.g. 'hi')
 * @param {string} targetLang - ISO 639-1 code of target language (e.g. 'en')
 * @returns {Promise<string>} Translated text or original on error
 */
export const translateText = async (text, sourceLang, targetLang) => {
  try {
    // Validate inputs
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('Text to translate must be a non-empty string.');
    }

    if (!sourceLang || !targetLang) {
      throw new Error('Both source and target language codes are required.');
    }

    const res = await axios.post(
      `${LIBRE_TRANSLATE_URL}/translate`,
      {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      }
    );

    const translated = res?.data?.translatedText;

    if (!translated) {
      throw new Error(`LibreTranslate returned no result: ${JSON.stringify(res.data)}`);
    }

    return translated.trim();
  } catch (err) {
    console.error('🔴 [TranslateText Error]:', err.message || err);
    // Graceful fallback: return original text
    return text;
  }
};

/**
 * Detect language of a given input string using LibreTranslate
 * @param {string} text - String to analyze (e.g., 'Hola mundo')
 * @returns {Promise<string>} Detected ISO 639-1 code (default: 'en')
 */
export const detectLanguage = async (text) => {
  try {
    if (typeof text !== 'string' || !text.trim()) return 'en';

    const res = await axios.post(
      `${LIBRE_TRANSLATE_URL}/detect`,
      { q: text },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );

    if (!Array.isArray(res.data) || res.data.length === 0) {
      throw new Error('Empty response from detect API');
    }

    const detectedLang = res.data[0]?.language;
    return detectedLang || 'en';
  } catch (err) {
    console.error('🔴 [LanguageDetection Error]:', err.message || err);
    return 'en'; // Fallback ⛑
  }
};
