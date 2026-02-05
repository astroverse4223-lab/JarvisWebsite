// Seed the database with initial download statistics
require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function seedStats() {
  console.log('\n🌱 Seeding download statistics...\n');
  
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db('jarvis-omega');
    const stats = db.collection('stats');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Set total downloads
    await stats.updateOne(
      { _id: 'total' },
      { 
        $set: { 
          count: 12847,  // Starting total downloads
          lastUpdated: now 
        }
      },
      { upsert: true }
    );
    console.log('✅ Total downloads set to: 12,847');
    
    // Set today's downloads
    await stats.updateOne(
      { _id: `daily_${today.toISOString().split('T')[0]}` },
      { 
        $set: { 
          count: 234,  // Downloads today
          date: today,
          type: 'daily'
        }
      },
      { upsert: true }
    );
    console.log('✅ Today\'s downloads set to: 234');
    
    // Set downloads for the past 7 days (for weekly total)
    for (let i = 1; i < 7; i++) {
      const pastDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const pastDay = new Date(pastDate.getFullYear(), pastDate.getMonth(), pastDate.getDate());
      const dailyCount = Math.floor(Math.random() * 150) + 150; // Random between 150-300
      
      await stats.updateOne(
        { _id: `daily_${pastDay.toISOString().split('T')[0]}` },
        { 
          $set: { 
            count: dailyCount,
            date: pastDay,
            type: 'daily'
          }
        },
        { upsert: true }
      );
      console.log(`✅ Day ${i} ago downloads set to: ${dailyCount}`);
    }
    
    console.log('\n✅ Weekly total will be: ~1,856 downloads');
    console.log('✅ Database seeded successfully!\n');
    
    await client.close();
    
    console.log('🎉 Done! Your stats are now populated.\n');
    console.log('Refresh your website to see the updated counts.\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedStats();
