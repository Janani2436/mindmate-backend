// controllers/aiController.js
import axios from 'axios';

export const handleVideoChat = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiMessage = response.data.choices?.[0]?.message?.content || 'No response.';
    res.json({ response: aiMessage });

  } catch (err) {
    console.error('OpenRouter API error:', err.message);
    res.status(500).json({ error: 'AI response failed' });
  }
};
