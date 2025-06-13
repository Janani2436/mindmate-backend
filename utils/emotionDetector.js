// Enhanced emotion keyword mapping
const emotionKeywords = {
  sad: ["sad", "depressed", "unhappy", "down", "hopeless", "tired", "cry", "miserable", "worthless","துக்கம்", "முரட்டு", "உடைந்துவிட்டேன்"],
  angry: ["angry", "mad", "furious", "frustrated", "irritated", "annoyed", "rage", "கோபம்", "முரட்டு", "வெறுப்பு"],
  anxious: ["anxious", "nervous", "worried", "scared", "afraid", "panic", "tense", "overwhelmed", "பயம்", "கவலை", "அச்சம்"],
  happy: ["happy", "joyful", "excited", "grateful", "good", "glad", "content", "blessed","மகிழ்ச்சி", "பிரியமான", "சந்தோஷமாக"],
  lonely: ["lonely", "alone", "isolated", "abandoned", "ignored", "neglected", "தனிமை", "தனிமனிதன்", "ஏக்கம்"],
  
};

function cleanMessage(message) {
  return message
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/);           // Tokenize into words
}

function detectEmotion(message) {
  if (!message || typeof message !== 'string') return "neutral";

  const words = cleanMessage(message);

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      if (words.includes(keyword)) {
        return emotion;
      }
    }
  }

  return "neutral"; // Ensure always returns a valid string
}


export { detectEmotion };
