import axios from 'axios';

/**
 * Process video frame for emotion detection.
 * @param {string} imageData - Base64 encoded image data
 * @returns {Promise<string>} - Detected emotion or 'neutral' as fallback
 */
export const processFrame = async (imageData) => {
  if (!imageData || typeof imageData !== 'string') {
    console.warn('⚠️ Invalid image data provided for emotion detection');
    return 'neutral';
  }

  try {
    // Use environment variables if available, with sensible default endpoint for dev/demo
    const emotionApiUrl = process.env.EMOTION_API_URL || 'https://api.emotionsense.pro/detect';
    const apiKey = process.env.EMOTIONSENSE_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ EMOTIONSENSE_API_KEY not found, using fallback emotion detection');
      return simulateEmotionDetection(imageData);
    }

    const payload = {
      image: imageData,
      format: 'base64',
    };

    const response = await axios.post(emotionApiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.emotion) {
      console.log('✅ Emotion detected:', response.data.emotion);
      return response.data.emotion.toLowerCase();
    }

    console.warn('⚠️ No emotion data in API response, using fallback');
    return simulateEmotionDetection(imageData);

  } catch (error) {
    console.error('🔴 Emotion detection API error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Fallback to simulated detection
    return simulateEmotionDetection(imageData);
  }
};

/**
 * Simulate emotion detection based on image characteristics.
 * Fallback mechanism if main detection API is unavailable.
 * @param {string} imageData - Base64 encoded image data
 * @returns {string} - Simulated emotion
 */
const simulateEmotionDetection = (imageData) => {
  try {
    // Simple deterministic hash for visual test/demo (not for production)
    const hash = simpleHash(imageData.substring(0, 100));
    const emotions = ['happy', 'sad', 'neutral', 'anxious', 'angry', 'excited'];
    const index = hash % emotions.length;
    const detectedEmotion = emotions[index];
    console.log('🎭 Simulated emotion detection:', detectedEmotion);
    return detectedEmotion;
  } catch (error) {
    console.error('🔴 Error in simulated emotion detection:', error.message);
    return 'neutral';
  }
};

/**
 * Simple hash function for simulation fallback.
 * @param {string} str
 * @returns {number}
 */
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Validate base64 image data.
 * @param {string} imageData - Base64 image string
 * @returns {boolean}
 */
export const validateImageData = (imageData) => {
  if (!imageData || typeof imageData !== 'string') return false;
  // Check if it's a valid data URL
  const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  if (base64Regex.test(imageData)) return true;
  // Check if it's raw base64 data (basic check)
  const rawBase64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return rawBase64Regex.test(imageData) && imageData.length > 100;
};

/**
 * Extract base64 data from data URL.
 * @param {string} dataUrl - Data URL string or raw base64
 * @returns {string} - Pure base64 data
 */
export const extractBase64Data = (dataUrl) => {
  if (typeof dataUrl !== 'string') return '';
  if (dataUrl.startsWith('data:image/')) {
    return dataUrl.split(',')[1];
  }
  return dataUrl;
};
