import axios from 'axios';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        let { message } = req.body;
        message = message.replace(/\*/g, "");
        const key = process.env.GOOGLE_SPEECH_API_KEY;
        const address = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`;
        const payload = {
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                input: { text: message },
                voice: { languageCode: "en-GB", name: 'en-GB-Standard-B' },
                audioConfig: { audioEncoding: "MP3", pitch: 1, speakingRate: 1.1 }
            }
        };

        try {
            const response = await axios.post(address, payload.data, { headers: payload.headers });
            const result = response.data;
            if (result?.audioContent) {
                // Return the audio content in the response
                res.status(200).json({ audioContent: result.audioContent });
            } else {
                res.status(200).json({ message: 'No audio content received' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
