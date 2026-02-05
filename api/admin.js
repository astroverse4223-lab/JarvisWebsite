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

        // GET /api/admin?action=revenue - Get revenue statistics
        if (req.method === 'GET' && action === 'revenue') {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            
            try {
                // Get all successful payments (last 90 days)
                const ninetyDaysAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60);
                const charges = await stripe.charges.list({
                    limit: 100,
                    created: { gte: ninetyDaysAgo }
                });

                const successfulCharges = charges.data.filter(charge => charge.status === 'succeeded');
                
                // Calculate totals
                const totalRevenue = successfulCharges.reduce((sum, charge) => sum + charge.amount, 0) / 100;
                
                // This month's revenue
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthStart = Math.floor(firstDayOfMonth.getTime() / 1000);
                
                const thisMonthRevenue = successfulCharges
                    .filter(charge => charge.created >= monthStart)
                    .reduce((sum, charge) => sum + charge.amount, 0) / 100;

                // Calculate MRR (Monthly Recurring Revenue) from active Pro subscriptions
                const proUsersCount = await users.countDocuments({ 
                    plan: 'pro',
                    subscription: { $exists: true }
                });
                
                // Estimate MRR: assume average of $10/month per Pro user
                const estimatedMRR = proUsersCount * 10;

                // Lifetime revenue (all lifetime purchases)
                const lifetimeCount = await users.countDocuments({ plan: 'lifetime' });
                const lifetimeRevenue = lifetimeCount * 149; // Assume $149 per lifetime

                // Recent transactions
                const recentTransactions = successfulCharges.slice(0, 10).map(charge => ({
                    amount: (charge.amount / 100).toFixed(2),
                    date: new Date(charge.created * 1000).toLocaleDateString(),
                    email: charge.billing_details?.email || 'N/A',
                    description: charge.description || 'Payment'
                }));

                return res.status(200).json({
                    totalRevenue: totalRevenue.toFixed(2),
                    thisMonthRevenue: thisMonthRevenue.toFixed(2),
                    estimatedMRR: estimatedMRR.toFixed(2),
                    lifetimeRevenue: lifetimeRevenue.toFixed(2),
                    averageTransaction: (totalRevenue / successfulCharges.length).toFixed(2),
                    transactionCount: successfulCharges.length,
                    recentTransactions
                });
            } catch (error) {
                console.error('Stripe API error:', error);
                return res.status(200).json({
                    totalRevenue: '0.00',
                    thisMonthRevenue: '0.00',
                    estimatedMRR: '0.00',
                    lifetimeRevenue: '0.00',
                    averageTransaction: '0.00',
                    transactionCount: 0,
                    recentTransactions: [],
                    error: 'Unable to fetch Stripe data'
                });
            }
        }

        // GET /api/admin?action=plugins - Get plugin download analytics
        if (req.method === 'GET' && action === 'plugins') {
            const downloads = db.collection('plugin_downloads');
            
            // Total downloads
            const totalDownloads = await downloads.countDocuments({});
            
            // Downloads by plugin
            const downloadsByPlugin = await downloads.aggregate([
                { $group: { _id: '$pluginId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 30 }
            ]).toArray();

            // Recent downloads (last 20)
            const recentDownloads = await downloads.find({})
                .sort({ downloadedAt: -1 })
                .limit(20)
                .toArray();

            // Enrich recent downloads with user emails
            const enrichedRecent = await Promise.all(
                recentDownloads.map(async (download) => {
                    const user = await users.findOne({ _id: new ObjectId(download.userId) });
                    return {
                        pluginId: download.pluginId,
                        downloadedAt: download.downloadedAt,
                        userEmail: user ? user.email : 'Unknown'
                    };
                })
            );

            // Downloads in last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentDownloadCount = await downloads.countDocuments({
                downloadedAt: { $gte: sevenDaysAgo }
            });

            return res.status(200).json({
                totalDownloads,
                recentDownloadCount,
                downloadsByPlugin,
                recentDownloads: enrichedRecent
            });
        }

        // GET /api/admin?action=search&query=xxx - Search users
        if (req.method === 'GET' && action === 'search') {
            const query = req.query.query;
            
            if (!query || query.length < 2) {
                return res.status(400).json({ error: 'Search query must be at least 2 characters' });
            }

            const searchResults = await users.find({
                email: { $regex: query, $options: 'i' }
            })
            .project({ password: 0 })
            .limit(50)
            .toArray();

            return res.status(200).json(searchResults);
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
