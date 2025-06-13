const axios = require('axios');
const https = require('https');
const { PassThrough } = require('stream');

async function transcribeVoice(audioUrl) {
  try {
    // Download voice message as stream
    const audioStream = await new Promise((resolve, reject) => {
      https.get(audioUrl, { timeout: 10000 }, (response) => {
        const stream = new PassThrough();
        response.pipe(stream);
        resolve(stream);
      }).on('error', reject);
    });

    console.log('Sending audio to Deepgram...');

    // Send to Deepgram
    const deepgramResponse = await axios.post('https://api.deepgram.com/v1/listen', audioStream, {
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/ogg', // Ensure this matches the audio format
      },
    });

    console.log('Deepgram response:', deepgramResponse.data);

    const transcriptData = deepgramResponse.data;

    // Check if speech was detected
    const transcript = transcriptData?.results?.channels[0]?.alternatives[0]?.transcript;

    if (!transcript || transcript.trim() === '') {
      throw new Error('No speech detected in the audio.');
    }

    return transcript;

  } catch (error) {
    console.error('Voice transcription error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = { transcribeVoice };
