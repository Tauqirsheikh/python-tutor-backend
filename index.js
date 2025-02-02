import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

// AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required." });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const response = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `You are an AI tutor for children. When answering, always return a structured JSON response with these keys: { "title": "<Short title of the topic>", "summary": "<Brief explanation in simple words>", "keyPoints": [ "<Point 1>", "<Point 2>", "<Point 3>", ... ] } Question: ${message}` }]
                }
            ]
        });

        const fullResponse = response.response.candidates[0]?.content.parts[0]?.text || "No response available.";

        // Extract title, summary, and key points
        const title = message;
        const summary = fullResponse.split("\n")[0]; // First line as summary
        const keyPoints = fullResponse.split("\n").slice(1).filter(line => line.trim() !== ""); // Remaining lines as points

        res.json({ title, summary, keyPoints });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to connect to AI API', details: error.response?.data || error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
