// Vercel Serverless Function for Plugin Downloads
const { MongoClient } = require('mongodb');

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Plugin catalog with download URLs - 30 Plugins
const PLUGIN_CATALOG = {
    'spotify-control': {
        name: 'Spotify Controller',
        version: '1.2.0',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/spotify-v1.2.0/spotify-control.zip',
        size: '2.1 MB',
        checksum: 'sha256:abc123...'
    },
    'email-assistant': {
        name: 'Email Assistant',
        version: '2.0.1',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/email-v2.0.1/email-assistant.zip',
        size: '3.4 MB',
        checksum: 'sha256:def456...'
    },
    'calendar-sync': {
        name: 'Calendar Integration',
        version: '1.5.0',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/calendar-v1.5.0/calendar-sync.zip',
        size: '1.8 MB',
        checksum: 'sha256:ghi789...'
    },
    'smart-home': {
        name: 'Smart Home Hub',
        version: '1.3.2',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/smarthome-v1.3.2/smart-home.zip',
        size: '4.2 MB',
        checksum: 'sha256:jkl012...'
    },
    'task-manager': {
        name: 'Task Manager Pro',
        version: '1.1.0',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/tasks-v1.1.0/task-manager.zip',
        size: '1.5 MB',
        checksum: 'sha256:mno345...'
    },
    'weather-advanced': {
        name: 'Advanced Weather',
        version: '1.0.5',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/weather-v1.0.5/weather-advanced.zip',
        size: '2.0 MB',
        checksum: 'sha256:pqr678...'
    },
    'code-assistant': {
        name: 'Code Assistant',
        version: '1.4.0',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/code-v1.4.0/code-assistant.zip',
        size: '5.3 MB',
        checksum: 'sha256:stu901...'
    },
    'translation': {
        name: 'Language Translator',
        version: '1.2.3',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/translate-v1.2.3/translation.zip',
        size: '3.1 MB',
        checksum: 'sha256:vwx234...'
    },
    'news-reader': {
        name: 'Smart News Reader',
        version: '1.0.8',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/news-v1.0.8/news-reader.zip',
        size: '1.9 MB',
        checksum: 'sha256:yz0567...'
    },
    'workout-coach': {
        name: 'Workout Coach',
        version: '1.1.2',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/workout-v1.1.2/workout-coach.zip',
        size: '2.7 MB',
        checksum: 'sha256:abc890...'
    },
    'recipe-finder': {
        name: 'Recipe Finder',
        version: '1.0.3',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/recipe-v1.0.3/recipe-finder.zip',
        size: '1.6 MB',
        checksum: 'sha256:def123...'
    },
    'github-integration': {
        name: 'GitHub Manager',
        version: '1.3.0',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/github-v1.3.0/github-integration.zip',
        size: '2.4 MB',
        checksum: 'sha256:ghi456...'
    },
    'pomodoro-timer': {
        name: 'Pomodoro Timer',
        version: '1.0.0',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/pomodoro-v1.0.0/pomodoro-timer.zip',
        size: '800 KB',
        checksum: 'sha256:jkl789...'
    },
    'crypto-tracker': {
        name: 'Crypto Price Tracker',
        version: '1.1.5',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/crypto-v1.1.5/crypto-tracker.zip',
        size: '1.3 MB',
        checksum: 'sha256:mno012...'
    },
    'meditation-guide': {
        name: 'Meditation Guide',
        version: '1.0.7',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/meditation-v1.0.7/meditation-guide.zip',
        size: '6.2 MB',
        checksum: 'sha256:pqr345...'
    },
    'window-manager': {
        name: 'Window Manager',
        version: '1.2.1',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/window-v1.2.1/window-manager.zip',
        size: '1.1 MB',
        checksum: 'sha256:stu678...'
    },
    'youtube-controller': {
        name: 'YouTube Voice Control',
        version: '1.4.2',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/youtube-v1.4.2/youtube-controller.zip',
        size: '2.8 MB',
        checksum: 'sha256:vwx901...'
    },
    'file-organizer': {
        name: 'Smart File Organizer',
        version: '2.1.0',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/files-v2.1.0/file-organizer.zip',
        size: '3.2 MB',
        checksum: 'sha256:yz1234...'
    },
    'browser-automation': {
        name: 'Browser Automation',
        version: '1.3.1',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/browser-v1.3.1/browser-automation.zip',
        size: '4.1 MB',
        checksum: 'sha256:abc567...'
    },
    'screenshot-tool': {
        name: 'Screenshot Master',
        version: '1.0.9',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/screenshot-v1.0.9/screenshot-tool.zip',
        size: '2.3 MB',
        checksum: 'sha256:def890...'
    },
    'notes-dictation': {
        name: 'Voice Notes Pro',
        version: '2.3.0',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/notes-v2.3.0/notes-dictation.zip',
        size: '3.7 MB',
        checksum: 'sha256:ghi012...'
    },
    'system-monitor': {
        name: 'System Monitor Pro',
        version: '1.5.3',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/monitor-v1.5.3/system-monitor.zip',
        size: '2.9 MB',
        checksum: 'sha256:jkl345...'
    },
    'meeting-assistant': {
        name: 'Meeting Assistant',
        version: '1.6.0',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/meeting-v1.6.0/meeting-assistant.zip',
        size: '4.5 MB',
        checksum: 'sha256:mno678...'
    },
    'password-manager': {
        name: 'Password Vault',
        version: '1.1.4',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/password-v1.1.4/password-manager.zip',
        size: '2.6 MB',
        checksum: 'sha256:pqr901...'
    },
    'clipboard-manager': {
        name: 'Clipboard History',
        version: '1.0.6',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/clipboard-v1.0.6/clipboard-manager.zip',
        size: '1.4 MB',
        checksum: 'sha256:stu234...'
    },
    'focus-mode': {
        name: 'Focus Mode',
        version: '1.2.2',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/focus-v1.2.2/focus-mode.zip',
        size: '1.7 MB',
        checksum: 'sha256:vwx567...'
    },
    'voice-commands-custom': {
        name: 'Custom Command Builder',
        version: '2.0.0',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/custom-v2.0.0/voice-commands-custom.zip',
        size: '3.9 MB',
        checksum: 'sha256:yz8901...'
    },
    'social-media-poster': {
        name: 'Social Media Manager',
        version: '1.3.5',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/social-v1.3.5/social-media-poster.zip',
        size: '2.5 MB',
        checksum: 'sha256:abc234...'
    },
    'expense-tracker': {
        name: 'Expense Tracker',
        version: '1.1.8',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/expense-v1.1.8/expense-tracker.zip',
        size: '1.9 MB',
        checksum: 'sha256:def567...'
    },
    'alarm-reminder': {
        name: 'Smart Alarms & Reminders',
        version: '1.4.3',
        fileUrl: 'https://github.com/jarvis-omega/plugins/releases/download/alarm-v1.4.3/alarm-reminder.zip',
        size: '2.2 MB',
        checksum: 'sha256:ghi890...'
    }
};

// Verify JWT token and get user data
async function verifyUser(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No authorization token provided');
    }

    const token = authHeader.substring(7);
    
    if (!MONGODB_URI) {
        throw new Error('Database not configured');
    }

    let client;
    try {
        client = await MongoClient.connect(MONGODB_URI);
        const db = client.db('jarvis-omega');
        const users = db.collection('users');

        // Find user by token (simplified - in production use JWT verification)
        const user = await users.findOne({ authToken: token });
        
        if (!user) {
            throw new Error('Invalid token');
        }

        return user;
    } finally {
        if (client) {
            await client.close();
        }
    }
}

// Track plugin download
async function trackDownload(userId, pluginId) {
    if (!MONGODB_URI) return;

    let client;
    try {
        client = await MongoClient.connect(MONGODB_URI);
        const db = client.db('jarvis-omega');
        const downloads = db.collection('plugin_downloads');

        await downloads.insertOne({
            userId,
            pluginId,
            downloadedAt: new Date(),
            ip: null // Can add IP tracking if needed
        });
    } catch (error) {
        console.error('Failed to track download:', error);
        // Don't fail the download if tracking fails
    } finally {
        if (client) {
            await client.close();
        }
    }
}

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
        const { pluginId } = req.body;

        if (!pluginId) {
            return res.status(400).json({ error: 'Plugin ID is required' });
        }

        // Verify user authentication
        const user = await verifyUser(req.headers.authorization);

        // Check if user has Pro access
        const hasPro = user.plan === 'pro' || user.plan === 'lifetime' || user.plan === 'business';
        
        if (!hasPro) {
            return res.status(403).json({ 
                error: 'Pro subscription required',
                message: 'Plugin marketplace access requires a Pro subscription'
            });
        }

        // Check if trial has expired
        if (user.trialEndsAt && new Date(user.trialEndsAt) < new Date() && !user.subscription) {
            return res.status(403).json({ 
                error: 'Trial expired',
                message: 'Your trial has expired. Please upgrade to continue using plugins.'
            });
        }

        // Get plugin from catalog
        const plugin = PLUGIN_CATALOG[pluginId];
        
        if (!plugin) {
            return res.status(404).json({ error: 'Plugin not found' });
        }

        // Track the download
        await trackDownload(user._id || user.email, pluginId);

        // Return download information
        return res.status(200).json({
            success: true,
            plugin: {
                id: pluginId,
                name: plugin.name,
                version: plugin.version,
                size: plugin.size,
                checksum: plugin.checksum
            },
            downloadUrl: plugin.fileUrl,
            message: 'Plugin ready for download'
        });

    } catch (error) {
        console.error('Plugin download error:', error);
        
        if (error.message === 'No authorization token provided' || 
            error.message === 'Invalid token') {
            return res.status(401).json({ error: 'Unauthorized', message: error.message });
        }

        return res.status(500).json({ 
            error: 'Server error', 
            message: error.message 
        });
    }
};
