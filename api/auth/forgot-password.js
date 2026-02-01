const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const MONGODB_URI = process.env.MONGODB_URI;
const DOMAIN = process.env.DOMAIN || 'https://jarvisassistant.online';

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

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
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Connect to MongoDB
        const client = await MongoClient.connect(MONGODB_URI);
        const db = client.db('jarvis-omega');
        const users = db.collection('users');
        
        // Check if user exists
        const user = await users.findOne({ email: email.toLowerCase() });
        
        // Always return success to prevent email enumeration
        // But only send email if user exists
        if (user) {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
            
            // Save reset token to database
            await users.updateOne(
                { email: email.toLowerCase() },
                {
                    $set: {
                        resetPasswordToken: resetTokenHash,
                        resetPasswordExpiry: resetTokenExpiry
                    }
                }
            );
            
            // Create reset URL
            const resetUrl = `${DOMAIN}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
            
            // Send email
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || '"JARVIS Omega" <noreply@jarvisassistant.online>',
                    to: email,
                    subject: 'Password Reset Request - JARVIS Omega',
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                body { font-family: Arial, sans-serif; background-color: #0a0a1a; color: #ffffff; margin: 0; padding: 0; }
                                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                                .header { text-align: center; margin-bottom: 40px; }
                                .logo { font-size: 32px; font-weight: bold; color: #ff3333; margin-bottom: 10px; }
                                .content { background: rgba(20, 20, 40, 0.8); border: 2px solid rgba(255, 51, 51, 0.3); border-radius: 15px; padding: 30px; }
                                h1 { color: #ff3333; font-size: 24px; margin-bottom: 20px; }
                                p { line-height: 1.6; margin-bottom: 20px; color: #cccccc; }
                                .button { display: inline-block; background: linear-gradient(135deg, #ff3333, #ff6666); color: white; text-decoration: none; padding: 15px 40px; border-radius: 10px; font-weight: bold; margin: 20px 0; }
                                .button:hover { opacity: 0.9; }
                                .warning { background: rgba(255, 165, 0, 0.1); border-left: 4px solid #ffa500; padding: 15px; margin: 20px 0; }
                                .footer { text-align: center; margin-top: 30px; color: #888888; font-size: 14px; }
                                .expiry { color: #ffa500; font-weight: bold; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <div class="logo">JARVIS OMEGA</div>
                                    <p>AI Voice Assistant</p>
                                </div>
                                <div class="content">
                                    <h1>Password Reset Request</h1>
                                    <p>Hello,</p>
                                    <p>We received a request to reset your JARVIS Omega account password. Click the button below to create a new password:</p>
                                    <div style="text-align: center;">
                                        <a href="${resetUrl}" class="button">Reset Password</a>
                                    </div>
                                    <div class="warning">
                                        <strong>⚠️ Important:</strong>
                                        <ul style="margin: 10px 0; padding-left: 20px;">
                                            <li>This link will <span class="expiry">expire in 1 hour</span></li>
                                            <li>If you didn't request this, please ignore this email</li>
                                            <li>Your password won't change until you click the link and set a new one</li>
                                        </ul>
                                    </div>
                                    <p style="color: #888; font-size: 14px; margin-top: 30px;">
                                        If the button doesn't work, copy and paste this link into your browser:<br>
                                        <span style="color: #00d4ff; word-break: break-all;">${resetUrl}</span>
                                    </p>
                                </div>
                                <div class="footer">
                                    <p>© 2026 JARVIS Omega. All rights reserved.</p>
                                    <p>Questions? Contact us at <a href="mailto:support@jarvisassistant.online" style="color: #ff3333;">support@jarvisassistant.online</a></p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `,
                    text: `
Password Reset Request

Hello,

We received a request to reset your JARVIS Omega account password.

Click this link to create a new password:
${resetUrl}

⚠️ Important:
- This link will expire in 1 hour
- If you didn't request this, please ignore this email
- Your password won't change until you click the link and set a new one

Questions? Contact us at support@jarvisassistant.online

© 2026 JARVIS Omega. All rights reserved.
                    `
                });
                
                console.log(`Password reset email sent to ${email}`);
            } catch (emailError) {
                console.error('Email sending error:', emailError);
                await client.close();
                return res.status(500).json({ 
                    error: 'Failed to send reset email',
                    message: 'Please check your email configuration or try again later'
                });
            }
        }
        
        await client.close();
        
        // Always return success to prevent email enumeration
        return res.status(200).json({ 
            success: true,
            message: 'If an account exists with that email, a password reset link has been sent.'
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ error: 'Server error processing request' });
    }
};
