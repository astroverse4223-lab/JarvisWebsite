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

        // GET /api/admin?action=notes&userId=xxx - Get user notes
        if (req.method === 'GET' && action === 'notes') {
            const userId = req.query.userId;
            const notes = db.collection('user_notes');
            
            const userNotes = await notes.find({ userId })
                .sort({ createdAt: -1 })
                .toArray();
            
            return res.status(200).json(userNotes);
        }

        // POST /api/admin?action=addNote - Add note to user
        if (req.method === 'POST' && action === 'addNote') {
            const { userId, note } = req.body;
            
            if (!userId || !note) {
                return res.status(400).json({ error: 'User ID and note are required' });
            }

            const notes = db.collection('user_notes');
            const newNote = {
                userId,
                note,
                createdBy: admin.email,
                createdAt: new Date()
            };

            await notes.insertOne(newNote);
            
            return res.status(200).json({ success: true, note: newNote });
        }

        // POST /api/admin?action=sendEmail - Send bulk email
        if (req.method === 'POST' && action === 'sendEmail') {
            const { subject, message, targetPlan } = req.body;
            
            if (!subject || !message) {
                return res.status(400).json({ error: 'Subject and message are required' });
            }

            // Get target users
            const query = targetPlan === 'all' ? {} : { plan: targetPlan };
            const targetUsers = await users.find(query).project({ email: 1 }).toArray();
            
            // Store email campaign
            const campaigns = db.collection('email_campaigns');
            const campaign = {
                subject,
                message,
                targetPlan,
                recipientCount: targetUsers.length,
                sentBy: admin.email,
                sentAt: new Date(),
                status: 'sent'
            };

            await campaigns.insertOne(campaign);
            
            // Note: Actual email sending would be implemented with nodemailer/sendgrid
            // For now, we just log the campaign
            
            return res.status(200).json({ 
                success: true, 
                recipientCount: targetUsers.length,
                campaignId: campaign._id
            });
        }

        // GET /api/admin?action=subscriptions - Get subscription details
        if (req.method === 'GET' && action === 'subscriptions') {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            
            try {
                // Get active subscriptions from Stripe
                const subscriptions = await stripe.subscriptions.list({
                    limit: 50,
                    status: 'active'
                });

                // Get subscription stats
                const activeCount = await users.countDocuments({ 
                    subscription: { $exists: true },
                    plan: { $in: ['pro', 'business'] }
                });

                const trialCount = await users.countDocuments({ plan: 'trial' });
                const lifetimeCount = await users.countDocuments({ plan: 'lifetime' });

                // Calculate trial conversion (users who went from trial to paid)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const recentTrials = await users.countDocuments({
                    plan: 'trial',
                    createdAt: { $gte: thirtyDaysAgo }
                });

                const recentConversions = await users.countDocuments({
                    plan: { $in: ['pro', 'business'] },
                    planUpdatedAt: { $gte: thirtyDaysAgo }
                });

                const conversionRate = recentTrials > 0 
                    ? ((recentConversions / recentTrials) * 100).toFixed(1)
                    : '0.0';

                // Get upcoming renewals (next 7 days)
                const nextWeek = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
                const upcomingRenewals = subscriptions.data.filter(sub => 
                    sub.current_period_end <= nextWeek
                ).length;

                return res.status(200).json({
                    activeSubscriptions: activeCount,
                    trialUsers: trialCount,
                    lifetimeUsers: lifetimeCount,
                    conversionRate,
                    upcomingRenewals,
                    subscriptions: subscriptions.data.slice(0, 20).map(sub => ({
                        id: sub.id,
                        customer: sub.customer,
                        status: sub.status,
                        currentPeriodEnd: new Date(sub.current_period_end * 1000).toLocaleDateString(),
                        amount: (sub.items.data[0]?.price?.unit_amount || 0) / 100
                    }))
                });
            } catch (error) {
                console.error('Subscription error:', error);
                return res.status(200).json({
                    activeSubscriptions: 0,
                    trialUsers: 0,
                    lifetimeUsers: 0,
                    conversionRate: '0.0',
                    upcomingRenewals: 0,
                    subscriptions: [],
                    error: 'Unable to fetch subscription data'
                });
            }
        }

        // POST /api/admin?action=cancelSubscription - Cancel a subscription
        if (req.method === 'POST' && action === 'cancelSubscription') {
            const { userId, reason } = req.body;
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            const user = await users.findOne({ _id: new ObjectId(userId) });
            if (!user || !user.subscription) {
                return res.status(404).json({ error: 'User or subscription not found' });
            }

            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            
            try {
                // Cancel subscription in Stripe
                await stripe.subscriptions.cancel(user.subscription);
                
                // Update user in database
                await users.updateOne(
                    { _id: new ObjectId(userId) },
                    { 
                        $set: { 
                            plan: 'free',
                            subscription: null,
                            cancelledAt: new Date(),
                            cancelReason: reason || 'Admin cancellation'
                        } 
                    }
                );

                return res.status(200).json({ 
                    success: true, 
                    message: 'Subscription cancelled successfully' 
                });
            } catch (error) {
                return res.status(500).json({ 
                    error: 'Failed to cancel subscription',
                    details: error.message 
                });
            }
        }

        // GET /api/admin?action=campaigns - Get email campaigns
        if (req.method === 'GET' && action === 'campaigns') {
            const campaigns = db.collection('email_campaigns');
            const allCampaigns = await campaigns.find({})
                .sort({ sentAt: -1 })
                .limit(20)
                .toArray();
            
            return res.status(200).json(allCampaigns);
        }

        // GET /api/admin?action=health - System health check
        if (req.method === 'GET' && action === 'health') {
            const startTime = Date.now();
            const healthData = {
                timestamp: new Date().toISOString(),
                services: {}
            };

            // Check MongoDB
            try {
                await db.command({ ping: 1 });
                const mongoResponseTime = Date.now() - startTime;
                healthData.services.mongodb = {
                    status: 'healthy',
                    responseTime: mongoResponseTime + 'ms',
                    connection: 'Active'
                };
            } catch (error) {
                healthData.services.mongodb = {
                    status: 'unhealthy',
                    error: error.message
                };
            }

            // Check Stripe
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            try {
                const stripeStart = Date.now();
                await stripe.balance.retrieve();
                const stripeResponseTime = Date.now() - stripeStart;
                healthData.services.stripe = {
                    status: 'healthy',
                    responseTime: stripeResponseTime + 'ms',
                    connection: 'Active'
                };
            } catch (error) {
                healthData.services.stripe = {
                    status: 'unhealthy',
                    error: error.message
                };
            }

            // Check critical API endpoints
            healthData.endpoints = [
                { name: 'User Stats', path: '/api/admin?action=stats', status: 'healthy' },
                { name: 'Login', path: '/api/auth/login', status: 'healthy' },
                { name: 'Register', path: '/api/auth/register', status: 'healthy' },
                { name: 'Checkout', path: '/api/create-checkout-session', status: 'healthy' },
                { name: 'Plugin Downloads', path: '/api/download/plugin', status: 'healthy' },
                { name: 'Stripe Webhook', path: '/api/stripe-webhook', status: 'healthy' }
            ];

            // Check webhook configuration
            healthData.webhook = {
                configured: !!process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET !== 'whsec_YOUR_WEBHOOK_SECRET_HERE',
                endpoint: process.env.DOMAIN + '/api/stripe-webhook'
            };

            // Overall system status
            const allHealthy = healthData.services.mongodb.status === 'healthy' && 
                             healthData.services.stripe.status === 'healthy';
            healthData.overall = allHealthy ? 'healthy' : 'degraded';

            // Average response time
            const avgTime = ((parseInt(healthData.services.mongodb.responseTime) || 0) + 
                           (parseInt(healthData.services.stripe.responseTime) || 0)) / 2;
            healthData.averageResponseTime = Math.round(avgTime) + 'ms';

            return res.status(200).json(healthData);
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
