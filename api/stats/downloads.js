// API endpoint for tracking download statistics
// Uses MongoDB to store real download data

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db('jarvis-omega');
    const stats = db.collection('stats');
    const users = db.collection('users');
    
    if (req.method === 'POST') {
      // Increment download counter
      const { action } = req.body || {};
      
      if (action === 'increment') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Increment total downloads
        await stats.updateOne(
          { _id: 'total' },
          { 
            $inc: { count: 1 },
            $set: { lastUpdated: now }
          },
          { upsert: true }
        );
        
        // Track daily download
        await stats.updateOne(
          { _id: `daily_${today.toISOString().split('T')[0]}` },
          { 
            $inc: { count: 1 },
            $set: { date: today, type: 'daily' }
          },
          { upsert: true }
        );
        
        // Get updated stats
        const totalDoc = await stats.findOne({ _id: 'total' });
        const dailyDoc = await stats.findOne({ _id: `daily_${today.toISOString().split('T')[0]}` });
        
        // Get weekly downloads
        const weeklyDocs = await stats.find({
          type: 'daily',
          date: { $gte: weekAgo }
        }).toArray();
        
        const weeklyTotal = weeklyDocs.reduce((sum, doc) => sum + (doc.count || 0), 0);
        
        await client.close();
        
        return res.status(200).json({
          success: true,
          totalDownloads: totalDoc?.count || 0,
          dailyDownloads: dailyDoc?.count || 0,
          weeklyDownloads: weeklyTotal
        });
      }
    }
    
    // GET request - return current stats
    if (req.method === 'GET') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Get total downloads
      const totalDoc = await stats.findOne({ _id: 'total' });
      
      // Get today's downloads
      const dailyDoc = await stats.findOne({ _id: `daily_${today.toISOString().split('T')[0]}` });
      
      // Get weekly downloads
      const weeklyDocs = await stats.find({
        type: 'daily',
        date: { $gte: weekAgo }
      }).toArray();
      
      const weeklyTotal = weeklyDocs.reduce((sum, doc) => sum + (doc.count || 0), 0);
      
      // Count active users (users who logged in within last 15 minutes)
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      const activeUsers = await users.countDocuments({
        lastActive: { $gte: fifteenMinutesAgo }
      });
      
      await client.close();
      
      return res.status(200).json({
        success: true,
        totalDownloads: totalDoc?.count || 0,
        dailyDownloads: dailyDoc?.count || 0,
        weeklyDownloads: weeklyTotal,
        activeUsers: activeUsers,
        lastUpdated: now.toISOString()
      });
    }
    
    await client.close();
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Download stats error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
