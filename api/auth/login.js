const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'jarvis-omega-secret-key-change-in-production';

let cachedClient = null;

async function connectToDatabase() {
    if (!uri) {
        throw new Error('MONGODB_URI environment variable is not set');
    }
    
    if (cachedClient) {
        return cachedClient;
    }
    
    const client = await MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    
    cachedClient = client;
    return client;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Check if MongoDB URI is configured
        if (!uri) {
            console.error('MONGODB_URI is not configured');
            return res.status(500).json({ error: 'Database not configured. Please contact support.' });
        }
        
        // Connect to database
        const client = await connectToDatabase();
        const db = client.db('jarvis-omega');
        const users = db.collection('users');
        
        // Find user
        const user = await users.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Check if user is admin
        const isAdmin = user.email === 'countryboya20@gmail.com' || user.isAdmin === true;
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                email: user.email,
                plan: user.plan,
                isAdmin: isAdmin
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        // Update last login and last active timestamp
        await users.updateOne(
            { _id: user._id },
            { 
                $set: { 
                    lastLogin: new Date(),
                    lastActive: new Date()
                } 
            }
        );
        
        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                isAdmin: isAdmin,
                trialExpiresAt: user.trialExpiresAt,
                devices: user.devices || [],
                maxDevices: user.maxDevices || 1
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        
        // Return more specific error info (remove in production)
        return res.status(500).json({ 
            error: 'Server error during login',
            details: error.message,
            hint: 'Check Vercel logs for details'
        });
    }
};