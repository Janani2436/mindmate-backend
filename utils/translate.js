import axios from 'axios';

// Stable LibreTranslate cloud instance
const LIBRE_TRANSLATE_URL = 'https://translate.argosopentech.com';

/**
 * translate text to target language
 * @param {string} text test to translate
 * @param {string} sourceLang language code of source language
 * @param {string} targetLang code of target language
 * @returns {Promise<string>} translated text
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
    // original text is returned if translation is failed
    return text;
  }
};

/**
 * detects language 
 * @param {string} text string is analyzed
 * @returns {Promise<string>} detects language code
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
    return 'en'; // returns to english 
  }
};
