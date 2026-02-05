const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }
    
    await client.connect();
    const db = client.db('jarvis-omega');
    cachedDb = db;
    return db;
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const db = await connectToDatabase();
        const chats = db.collection('live_chats');

        // GET - Load chat history
        if (req.method === 'GET') {
            const { sessionId } = req.query;
            
            if (!sessionId) {
                return res.status(400).json({ error: 'Session ID required' });
            }

            const chat = await chats.findOne({ sessionId });
            
            if (!chat) {
                return res.status(200).json({ messages: [] });
            }

            return res.status(200).json({
                messages: chat.messages || [],
                email: chat.email,
                page: chat.lastPage
            });
        }

        // POST - Send message
        if (req.method === 'POST') {
            const { sessionId, email, message, page } = req.body;

            if (!sessionId || !message) {
                return res.status(400).json({ error: 'Session ID and message required' });
            }

            const newMessage = {
                from: 'user',
                message: message,
                timestamp: new Date().toISOString(),
                read: false
            };

            // Check if chat session exists
            const existingChat = await chats.findOne({ sessionId });

            if (existingChat) {
                // Add message to existing chat
                await chats.updateOne(
                    { sessionId },
                    { 
                        $push: { messages: newMessage },
                        $set: { 
                            lastMessage: new Date(),
                            lastPage: page,
                            status: 'active'
                        }
                    }
                );
            } else {
                // Create new chat session
                await chats.insertOne({
                    sessionId,
                    email: email || 'Anonymous',
                    messages: [newMessage],
                    createdAt: new Date(),
                    lastMessage: new Date(),
                    lastPage: page,
                    status: 'active'
                });
            }

            // Auto-reply logic based on keywords
            let autoReply = null;
            const lowerMessage = message.toLowerCase();

            if (lowerMessage.includes('pricing') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
                autoReply = "You can view our pricing plans at /pricing.html. We offer Pro, Business, and Lifetime plans with different features. Let me know if you have specific questions!";
            } else if (lowerMessage.includes('plugin') || lowerMessage.includes('download')) {
                autoReply = "Our Pro members get access to 30+ premium plugins! You can browse them after upgrading to a Pro or Business plan.";
            } else if (lowerMessage.includes('trial') || lowerMessage.includes('free')) {
                autoReply = "Every new account starts with a 7-day free trial to test out JARVIS features. No credit card required!";
            } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
                autoReply = "I'm here to help! A support agent will be with you shortly. In the meantime, you can check our FAQ page for common questions.";
            } else if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
                autoReply = "Hello! Thanks for reaching out. How can I assist you today?";
            }

            // Save auto-reply to chat if exists
            if (autoReply) {
                await chats.updateOne(
                    { sessionId },
                    { 
                        $push: { 
                            messages: {
                                from: 'support',
                                message: autoReply,
                                timestamp: new Date().toISOString(),
                                isAutoReply: true,
                                read: false
                            }
                        }
                    }
                );
            }

            return res.status(200).json({ 
                success: true,
                autoReply: autoReply
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
