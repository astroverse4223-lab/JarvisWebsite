const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

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

// Verify admin access
function verifyAdmin(req) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded.isAdmin) {
            return null;
        }

        return decoded;
    } catch (error) {
        return null;
    }
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

    // Verify admin access
    const admin = verifyAdmin(req);
    if (!admin) {
        return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db('jarvis-omega');
        const users = db.collection('users');

        // Route based on query action parameter
        const action = req.query.action;

        // GET /api/admin?action=stats - Get statistics
        if (req.method === 'GET' && action === 'stats') {
            const totalUsers = await users.countDocuments({});
            const proUsers = await users.countDocuments({ plan: 'pro' });
            const trialUsers = await users.countDocuments({ plan: 'trial' });
            const lifetimeUsers = await users.countDocuments({ plan: 'lifetime' });
            const businessUsers = await users.countDocuments({ plan: 'business' });
            const freeUsers = await users.countDocuments({ plan: 'free' });

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentRegistrations = await users.countDocuments({
                createdAt: { $gte: sevenDaysAgo }
            });

            return res.status(200).json({
                totalUsers,
                proUsers,
                trialUsers,
                lifetimeUsers,
                businessUsers,
                freeUsers,
                recentRegistrations
            });
        }

        // GET /api/admin?action=users - Get all users
        if (req.method === 'GET' && action === 'users') {
            const allUsers = await users.find({})
                .project({ password: 0 })
                .sort({ createdAt: -1 })
                .toArray();

            return res.status(200).json(allUsers);
        }

        // DELETE /api/admin?action=delete&id=xxx - Delete user
        if (req.method === 'DELETE' && action === 'delete') {
            const userId = req.query.id;
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            if (userId === admin.userId) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }

            const result = await users.deleteOne({ _id: new ObjectId(userId) });

            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.status(200).json({ success: true, message: 'User deleted successfully' });
        }

        // PUT /api/admin?action=updatePlan - Update user plan
        if (req.method === 'PUT' && action === 'updatePlan') {
            const { id, plan } = req.body;

            if (!id || !plan) {
                return res.status(400).json({ error: 'User ID and plan are required' });
            }

            const validPlans = ['free', 'trial', 'pro', 'lifetime', 'business'];
            if (!validPlans.includes(plan)) {
                return res.status(400).json({ error: 'Invalid plan type' });
            }

            const updateData = {
                plan: plan,
                planUpdatedAt: new Date(),
                planUpdatedBy: 'admin'
            };

            if (plan === 'trial') {
                const trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + 3);
                updateData.trialEndDate = trialEndDate;
            }

            const result = await users.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.status(200).json({ 
                success: true, 
                message: 'User plan updated successfully',
                plan: plan
            });
        }

        return res.status(400).json({ error: 'Invalid action parameter' });

    } catch (error) {
        console.error('Admin API error:', error);
        return res.status(500).json({ 
            error: 'Server error', 
            details: error.message 
        });
    }
};
