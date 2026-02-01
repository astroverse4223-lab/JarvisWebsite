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
        const { name, email, password } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Connect to database
        const client = await connectToDatabase();
        const db = client.db('jarvis-omega');
        const users = db.collection('users');
        
        // Check if user already exists
        const existingUser = await users.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Calculate trial expiration (3 days from now)
        const trialExpiresAt = new Date();
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 3);
        
        // Create user
        const newUser = {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            plan: 'trial',
            devices: [],
            maxDevices: 1,
            createdAt: new Date(),
            trialExpiresAt: trialExpiresAt,
            stripeCustomerId: null,
            subscriptionId: null
        };
        
        const result = await users.insertOne(newUser);
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: result.insertedId,
                email: newUser.email,
                plan: newUser.plan
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        return res.status(201).json({
            success: true,
            token,
            user: {
                id: result.insertedId,
                name: newUser.name,
                email: newUser.email,
                plan: newUser.plan,
                trialExpiresAt: newUser.trialExpiresAt,
                devices: newUser.devices
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Server error during registration' });
    }
};
