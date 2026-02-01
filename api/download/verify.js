const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'jarvis-omega-secret-key-change-in-production';

let cachedClient = null;

async function connectToDatabase() {
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

function generateDeviceFingerprint(req) {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    return crypto.createHash('sha256').update(userAgent + ip).digest('hex');
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
        // Verify JWT token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.substring(7);
        let decoded;
        
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        // Connect to database
        const client = await connectToDatabase();
        const db = client.db('jarvis-omega');
        const users = db.collection('users');
        
        // Get user
        const user = await users.findOne({ _id: new ObjectId(decoded.userId) });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if trial has expired
        if (user.plan === 'trial' && user.trialExpiresAt) {
            const now = new Date();
            if (now > new Date(user.trialExpiresAt)) {
                return res.status(403).json({
                    success: false,
                    allowed: false,
                    error: 'Trial expired',
                    message: 'Your 3-day free trial has expired. Please upgrade to Pro or Business to continue using JARVIS Omega.',
                    trialExpired: true,
                    upgradeUrl: '/pricing.html'
                });
            }
        }
        
        // Generate device fingerprint
        const deviceFingerprint = generateDeviceFingerprint(req);
        const { deviceName } = req.body;
        
        // Check if device already registered
        const existingDevice = user.devices?.find(d => d.fingerprint === deviceFingerprint);
        
        if (existingDevice) {
            // Device already registered, allow download
            return res.status(200).json({
                success: true,
                allowed: true,
                message: 'Device already registered',
                device: existingDevice
            });
        }
        
        // Check device limit
        const currentDeviceCount = user.devices?.length || 0;
        const maxDevices = user.maxDevices || 1;
        
        if (currentDeviceCount >= maxDevices) {
            return res.status(403).json({
                success: false,
                allowed: false,
                error: 'Device limit reached',
                message: `Your ${user.plan} plan allows ${maxDevices} device(s). You have ${currentDeviceCount} devices registered.`,
                currentPlan: user.plan,
                maxDevices,
                upgradeUrl: '/pricing.html'
            });
        }
        
        // Register new device
        const newDevice = {
            fingerprint: deviceFingerprint,
            name: deviceName || `Device ${currentDeviceCount + 1}`,
            registeredAt: new Date(),
            lastDownload: new Date(),
            ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown'
        };
        
        await users.updateOne(
            { _id: new ObjectId(decoded.userId) },
            { 
                $push: { devices: newDevice }
            }
        );
        
        return res.status(200).json({
            success: true,
            allowed: true,
            message: 'Device registered successfully',
            device: newDevice,
            devicesUsed: currentDeviceCount + 1,
            maxDevices
        });
        
    } catch (error) {
        console.error('Download verification error:', error);
        return res.status(500).json({ error: 'Server error during verification' });
    }
};
