import express from 'express';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Multer setup for image upload (in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Face++ API endpoint
const FACEPP_URL = 'https://api-us.faceplusplus.com/facepp/v3/detect';

router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;

    // Convert image buffer to base64
    const imageBase64 = imageBuffer.toString('base64');

    const params = new URLSearchParams();
    params.append('api_key', process.env.FACEPP_API_KEY);
    params.append('api_secret', process.env.FACEPP_API_SECRET);
    params.append('image_base64', imageBase64);
    params.append('return_attributes', 'emotion');

    const response = await axios.post(FACEPP_URL, params);

    const emotions = response.data.faces[0]?.attributes?.emotion;

    if (!emotions) {
      return res.status(400).json({ success: false, message: 'No face detected' });
    }

    // Find the dominant emotion
    const dominantEmotion = Object.entries(emotions).reduce((max, curr) =>
      curr[1] > max[1] ? curr : max
    )[0];

    res.json({
      success: true,
      emotion: dominantEmotion,
      raw: emotions,
    });
  } catch (err) {
    console.error('Emotion detection failed:', err.message);
    res.status(500).json({ success: false, error: 'Emotion detection failed' });
  }
});

export default router;
