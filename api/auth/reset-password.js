const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI;

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { email, token, newPassword } = req.body;
        
        // Validate input
        if (!email || !token || !newPassword) {
            return res.status(400).json({ error: 'Email, token, and new password are required' });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }
        
        // Connect to MongoDB
        const client = await MongoClient.connect(MONGODB_URI);
        const db = client.db('jarvis-omega');
        const users = db.collection('users');
        
        // Hash the token to compare with stored hash
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        // Find user with valid reset token
        const user = await users.findOne({
            email: email.toLowerCase(),
            resetPasswordToken: resetTokenHash,
            resetPasswordExpiry: { $gt: new Date() } // Token must not be expired
        });
        
        if (!user) {
            await client.close();
            return res.status(400).json({ 
                error: 'Invalid or expired reset token',
                message: 'This password reset link is invalid or has expired. Please request a new one.'
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password and clear reset token
        await users.updateOne(
            { email: email.toLowerCase() },
            {
                $set: {
                    password: hashedPassword,
                    updatedAt: new Date()
                },
                $unset: {
                    resetPasswordToken: "",
                    resetPasswordExpiry: ""
                }
            }
        );
        
        await client.close();
        
        console.log(`Password reset successful for ${email}`);
        
        return res.status(200).json({ 
            success: true,
            message: 'Password reset successful! You can now log in with your new password.'
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ error: 'Server error resetting password' });
    }
};
