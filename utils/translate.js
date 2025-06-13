import axios from 'axios';

const LIBRE_TRANSLATE_URL = 'https://libretranslate.de/translate';

export const translateText = async (text, sourceLang, targetLang) => {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error("Text to translate is required and must be a non-empty string.");
  }

  if (!sourceLang || !targetLang) {
    throw new Error("Source or target language is missing.");
  }

  try {
    const response = await axios.post(LIBRE_TRANSLATE_URL, {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text',
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Check for translation success
    if (response.data && response.data.translatedText) {
      return response.data.translatedText;
    }

    // Fallback if translation response is not as expected
    throw new Error('Unexpected translation response.');
    
  } catch (error) {
    console.error('🔴 Translation Error:', error.message);

    // You can also consider falling back to 'en' if it's important to default
    return text; // Return original text if translation fails
  }
};
export const detectLanguage = async (text) => {
  try {
    const response = await axios.post('https://libretranslate.de/detect', {
      q: text
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data && response.data.length > 0) {
      return response.data[0].language;
    }

    throw new Error('Language detection failed');
  } catch (error) {
    console.error("🔴 Language Detection Error:", error.message);
    return 'en'; // fallback
  }
};
