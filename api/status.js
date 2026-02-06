/**
 * TEXT SYNC GAME - Status API
 * ===========================
 * Simple endpoint to check if the API is running
 */

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.status(200).json({
        status: 'online',
        timestamp: new Date().toISOString()
    });
}
