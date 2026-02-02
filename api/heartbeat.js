// API endpoint to track active users
// Frontend should call this every 5 minutes to show user as "active"

const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }
        
        const token = authHeader.substring(7);
        
        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        // Connect to MongoDB
        const client = await MongoClient.connect(MONGODB_URI);
        const db = client.db('jarvis-omega');
        const users = db.collection('users');
        
        // Update user's last active timestamp
        await users.updateOne(
            { email: decoded.email },
            { $set: { lastActive: new Date() } }
        );
        
        await client.close();
        
        return res.status(200).json({
            success: true,
            message: 'Activity recorded'
        });
        
    } catch (error) {
        console.error('Heartbeat error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};
