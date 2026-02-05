// Script to set countryboya20@gmail.com as admin in MongoDB
// Run this once to grant admin privileges

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const ADMIN_EMAIL = 'countryboya20@gmail.com';

async function setAdmin() {
    let client;
    
    try {
        console.log('Connecting to MongoDB...');
        client = await MongoClient.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('Connected successfully');
        
        const db = client.db('jarvis-omega');
        const users = db.collection('users');
        
        // Check if user exists
        const user = await users.findOne({ email: ADMIN_EMAIL });
        
        if (!user) {
            console.log(`\n❌ User with email ${ADMIN_EMAIL} not found!`);
            console.log('Please register an account first, then run this script again.');
            return;
        }
        
        // Update user to admin
        const result = await users.updateOne(
            { email: ADMIN_EMAIL },
            { 
                $set: { 
                    isAdmin: true,
                    adminSince: new Date()
                } 
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`\n✅ SUCCESS!`);
            console.log(`${ADMIN_EMAIL} is now an admin!`);
            console.log(`\nYou can now:`);
            console.log(`1. Login at: https://jarvisassistant.online/login.html`);
            console.log(`2. Access admin panel at: https://jarvisassistant.online/admin.html`);
        } else {
            console.log(`\n✅ User is already an admin!`);
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nFull error:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('\nDatabase connection closed');
        }
    }
}

// Run the script
console.log('========================================');
console.log('  JARVIS OMEGA - Admin Setup Script');
console.log('========================================\n');

setAdmin();
