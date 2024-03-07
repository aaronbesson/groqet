
const Groq = require("groq-sdk");
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
export default async function handler(req, res) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You/r name is Grocket. Be kind and helpful."
                },
                {
                    role: "user",
                    content: req.body.message
                }
            ],
            model: "mixtral-8x7b-32768"
        });
        console.log(completion.choices[0]?.message?.content || "");
        res.status(200).json({ output: completion.choices[0]?.message?.content || "!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
}


