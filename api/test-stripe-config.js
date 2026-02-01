// Test script to validate Stripe configuration
// Run with: node api/test-stripe-config.js

require('dotenv').config();

console.log('\n🔍 JARVIS Omega - Stripe Configuration Test\n');
console.log('='.repeat(50));

// Check environment variables
const checks = {
  'Stripe Secret Key': process.env.STRIPE_SECRET_KEY,
  'Stripe Publishable Key': process.env.STRIPE_PUBLISHABLE_KEY,
  'Pro Monthly Price': process.env.PRICE_PRO_MONTHLY,
  'Pro Yearly Price': process.env.PRICE_PRO_YEARLY,
  'Business Monthly Price': process.env.PRICE_BUSINESS_MONTHLY,
  'Business Yearly Price': process.env.PRICE_BUSINESS_YEARLY,
  'Domain': process.env.DOMAIN,
};

let allGood = true;

console.log('\n📋 Environment Variables:');
for (const [name, value] of Object.entries(checks)) {
  if (!value) {
    console.log(`❌ ${name}: NOT SET`);
    allGood = false;
  } else if (value.includes('1234567890') || value.includes('your_')) {
    console.log(`⚠️  ${name}: PLACEHOLDER (needs to be replaced)`);
    allGood = false;
  } else {
    // Mask sensitive data
    const masked = value.substring(0, 12) + '...' + value.substring(value.length - 4);
    console.log(`✅ ${name}: ${masked}`);
  }
}

console.log('\n' + '='.repeat(50));

if (!allGood) {
  console.log('\n❌ Configuration incomplete!');
  console.log('\n📝 Next steps:');
  console.log('1. Get your Stripe API keys from: https://dashboard.stripe.com/apikeys');
  console.log('2. Create products and prices in Stripe');
  console.log('3. Update your .env file with real values');
  console.log('4. Run this test again\n');
  process.exit(1);
}

// Test Stripe connection
console.log('\n🔌 Testing Stripe connection...\n');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripeConnection() {
  try {
    // Test API connection
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe API connection successful!');
    console.log(`   Available balance: ${balance.available[0]?.amount || 0} ${balance.available[0]?.currency || 'usd'}`);
    
    // Test price IDs
    console.log('\n💰 Validating Price IDs...\n');
    const priceIds = [
      { name: 'Pro Monthly', id: process.env.PRICE_PRO_MONTHLY },
      { name: 'Pro Yearly', id: process.env.PRICE_PRO_YEARLY },
      { name: 'Business Monthly', id: process.env.PRICE_BUSINESS_MONTHLY },
      { name: 'Business Yearly', id: process.env.PRICE_BUSINESS_YEARLY },
    ];
    
    for (const { name, id } of priceIds) {
      try {
        const price = await stripe.prices.retrieve(id);
        const amount = (price.unit_amount / 100).toFixed(2);
        const interval = price.recurring?.interval || 'one-time';
        console.log(`✅ ${name}: $${amount}/${interval} (${price.currency.toUpperCase()})`);
      } catch (err) {
        console.log(`❌ ${name}: Invalid price ID (${err.message})`);
        allGood = false;
      }
    }
    
    if (allGood) {
      console.log('\n' + '='.repeat(50));
      console.log('\n✅ All checks passed! Your Stripe integration is ready.');
      console.log('\n🚀 Next steps:');
      console.log('1. Run "npm run dev" to start development server');
      console.log('2. Visit http://localhost:3000/pricing.html');
      console.log('3. Test checkout with card: 4242 4242 4242 4242\n');
    } else {
      console.log('\n❌ Some price IDs are invalid. Please check your Stripe Dashboard.\n');
    }
    
  } catch (error) {
    console.log('❌ Stripe connection failed!');
    console.log(`   Error: ${error.message}`);
    console.log('\n📝 Common issues:');
    console.log('- Invalid API key');
    console.log('- Network connection issues');
    console.log('- Using live key with test prices (or vice versa)\n');
    process.exit(1);
  }
}

testStripeConnection();
