/**
 * TEXT SYNC GAME - Vercel Serverless API
 * =======================================
 * API endpoint for sending and receiving messages
 * Uses in-memory storage (resets on cold start)
 */

// In-memory message store (shared across requests in same instance)
// Note: On Vercel, this resets on cold starts. For production, use Redis/Upstash
let messages = [];
let userCount = 0;
const MAX_MESSAGES = 100;

export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        // Send a new message
        const { text, senderId } = req.body;

        if (!text || !senderId) {
            return res.status(400).json({ error: 'Missing text or senderId' });
        }

        const message = {
            id: Date.now(),
            text: text.substring(0, 500), // Limit message length
            senderId,
            timestamp: new Date().toISOString()
        };

        messages.push(message);

        // Keep only last MAX_MESSAGES
        if (messages.length > MAX_MESSAGES) {
            messages = messages.slice(-MAX_MESSAGES);
        }

        return res.status(200).json({ success: true, message });
    }

    if (req.method === 'GET') {
        // Get messages since a given ID
        const since = parseInt(req.query.since) || 0;
        const newMessages = messages.filter(m => m.id > since);

        return res.status(200).json({
            messages: newMessages,
            userCount: Math.max(1, userCount)
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
