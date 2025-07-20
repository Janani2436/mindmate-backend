// controllers/aiController.js
import dotenv from 'dotenv';
dotenv.config();

export const handleVideoChat = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [{ role: "user", content: prompt }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter error:', errorText);
      return res.status(500).json({ error: 'OpenRouter failed to respond properly.' });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || '🤖 No AI response.';
    res.json({ response: aiMessage });

  } catch (err) {
    console.error('❌ OpenRouter API error:', err.message);
    res.status(500).json({ error: 'AI response failed' });
  }
};
