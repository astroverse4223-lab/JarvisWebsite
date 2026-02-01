const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
            return res.status(401).json({ 
                valid: false, 
                error: 'No authorization token provided',
                message: 'Please log in to continue using JARVIS Omega.'
            });
        }
        
        const token = authHeader.substring(7);
        
        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({ 
                valid: false, 
                error: 'Invalid or expired token',
                message: 'Your session has expired. Please log in again.'
            });
        }
        
        // Connect to MongoDB
        const client = await MongoClient.connect(MONGODB_URI);
        const db = client.db('jarvis-omega');
        const users = db.collection('users');
        
        // Get user from database
        const user = await users.findOne({ email: decoded.email });
        
        if (!user) {
            await client.close();
            return res.status(404).json({ 
                valid: false, 
                error: 'User not found',
                message: 'Account not found. Please register again.'
            });
        }
        
        const now = new Date();
        
        // Check trial status
        if (user.plan === 'trial') {
            if (!user.trialExpiresAt) {
                // Trial account without expiration date (shouldn't happen, but handle it)
                await client.close();
                return res.status(403).json({
                    valid: false,
                    plan: 'trial',
                    trialExpired: true,
                    message: 'Your trial period has ended. Please upgrade to Pro, Business, or Lifetime to continue using JARVIS Omega.',
                    upgradeUrl: 'https://jarvisassistant.online/pricing'
                });
            }
            
            const expiresAt = new Date(user.trialExpiresAt);
            
            if (now > expiresAt) {
                // Trial expired
                await client.close();
                return res.status(403).json({
                    valid: false,
                    plan: 'trial',
                    trialExpired: true,
                    expiresAt: user.trialExpiresAt,
                    message: 'Your 3-day free trial has expired. Upgrade to continue using JARVIS Omega.',
                    upgradeUrl: 'https://jarvisassistant.online/pricing'
                });
            }
            
            // Trial still valid
            const timeLeft = expiresAt - now;
            const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
            const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
            
            await client.close();
            return res.status(200).json({
                valid: true,
                plan: 'trial',
                trialExpired: false,
                expiresAt: user.trialExpiresAt,
                timeLeft: {
                    days: daysLeft,
                    hours: hoursLeft
                },
                message: daysLeft <= 1 
                    ? `⚠️ Your trial expires in ${hoursLeft} hour(s). Upgrade now to keep using JARVIS!`
                    : `You have ${daysLeft} day(s) left in your trial.`,
                features: {
                    maxDevices: user.maxDevices || 1,
                    cloudSync: false,
                    prioritySupport: false
                }
            });
        }
        
        // Check if user has active subscription or lifetime license
        if (user.plan === 'pro' || user.plan === 'business' || user.plan === 'lifetime') {
            let maxDevices = 1;
            let cloudSync = false;
            let prioritySupport = false;
            
            if (user.plan === 'pro') {
                maxDevices = 3;
                cloudSync = true;
                prioritySupport = true;
            } else if (user.plan === 'business') {
                maxDevices = 10;
                cloudSync = true;
                prioritySupport = true;
            } else if (user.plan === 'lifetime') {
                maxDevices = 3;
                cloudSync = false; // No cloud features on lifetime
                prioritySupport = false; // No ongoing support on lifetime
            }
            
            await client.close();
            return res.status(200).json({
                valid: true,
                plan: user.plan,
                trialExpired: false,
                message: `Your ${user.plan.toUpperCase()} plan is active.`,
                features: {
                    maxDevices: maxDevices,
                    cloudSync: cloudSync,
                    prioritySupport: prioritySupport
                }
            });
        }
        
        // Unknown plan type
        await client.close();
        return res.status(403).json({
            valid: false,
            plan: user.plan || 'unknown',
            message: 'Invalid account plan. Please contact support.',
            upgradeUrl: 'https://jarvisassistant.online/pricing'
        });
        
    } catch (error) {
        console.error('License validation error:', error);
        return res.status(500).json({ 
            valid: false,
            error: 'Server error during license validation',
            message: 'Unable to verify license. Please try again later.'
        });
    }
};
