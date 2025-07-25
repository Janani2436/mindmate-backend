// MindMate backend - emotionDetector.js
const emotionKeywords = {
  sad: [
    // sad emotions in different languages
    'sad', 'depressed', 'unhappy', 'down', 'hopeless', 'tired', 'cry', 'miserable', 'worthless',
    'துக்கம்', 'உடைந்துவிட்டேன்', 'மனமுடைந்து', 'ஏமாற்றம்', 'தவிக்கும்',
    'उदास', 'निराश', 'दुखी', 'थका', 'रूला', 'मायूस', 'बेकार', 'व्यर्थ', 'एकाकी', 'दुख'
  ],
  angry: [
    // angry emotions in different languages
    'angry', 'mad', 'furious', 'frustrated', 'irritated', 'annoyed', 'rage',
    'கோபம்', 'முரட்டு', 'வெறுப்பு', 'சண்டை',
    'गुस्सा', 'नाराज़', 'चिड़ा', 'क्रोधित', 'खिन्न', 'झुंझलाया'
  ],
  anxious: [
    // anxious emotions in different languages
    'anxious', 'nervous', 'worried', 'scared', 'afraid', 'panic', 'tense', 'overwhelmed',
    'பயம்', 'கவலை', 'அச்சம்', 'இடையூறு',
    'चिंता', 'डर', 'घबराया', 'अशांत', 'बेचैन', 'भयभीत', 'परेशान'
  ],
  happy: [
    // happy emotions in different languages
    'happy', 'joyful', 'excited', 'grateful', 'good', 'glad', 'content', 'blessed', 'love', 'great',
    'மகிழ்ச்சி', 'பிரியமான', 'சந்தோஷமாக', 'ரசிக்கிறேன்',
    'खुश', 'प्रसन्न', 'सुखी', 'हर्षित', 'आनंदित', 'मजा', 'शुक्रगुजार', 'अच्छा'
  ],
  lonely: [
    // lonely emotions in different languages
    'lonely', 'alone', 'isolated', 'abandoned', 'ignored', 'neglected',
    'தனிமை', 'இக்கோணமாக',
    'अकेला', 'एकाकी', 'तन्हा', 'अनाथ', 'अलग', 'उपेक्षित'
  ]
};

/**
 * Cleans and tokenizes multilingual input string.
 * - Normalizes Unicode (NFKC)
 * - Removes punctuation
 * - Lowers case
 * - Keeps Hindi, Tamil, and multi-language safe
 * @param {string} message
 * @returns {string[]} normalized keywords
 */
function cleanMessage(message = '') {
  if (typeof message !== 'string') return [];

  return message
    .toLowerCase()
    .normalize('NFKC') // normalize unicode 
    .replace(/[^\p{L}\p{N}\s]/gu, '') // punctuations are removed
    .split(/\s+/)
    .filter(Boolean); // empty strings are removed
}

/**
 * Detects primary emotion in a given message
 * @param {string} message
 * @returns {string} 'happy', 'sad', 'angry', 'anxious', 'lonely', or 'neutral'
 */
function detectEmotion(message) {
  const tokens = cleanMessage(message);

  if (!tokens.length) return 'neutral';

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      if (tokens.includes(keyword)) {
        return emotion;
      }
    }
  }

  return 'neutral'; // default emotion
}

export { detectEmotion };
