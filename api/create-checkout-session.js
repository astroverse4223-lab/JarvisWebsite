const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Handle CORS
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
    // Debug: Check if env vars are loaded
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'Stripe not configured',
        message: 'STRIPE_SECRET_KEY is missing from environment variables',
        help: 'Please set up environment variables in Vercel dashboard or .env file'
      });
    }
    
    const { plan, billing } = req.body;
    
    // Validate input
    if (!plan || !billing) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        message: 'Both plan and billing are required'
      });
    }
    
    // Handle lifetime plan (one-time payment)
    if (plan === 'lifetime' && billing === 'one-time') {
      const priceId = process.env.PRICE_LIFETIME?.trim().replace(/^["']|["']$/g, '');
      
      if (!priceId) {
        return res.status(400).json({ 
          error: 'Price ID not configured',
          message: 'PRICE_LIFETIME is not set in environment variables'
        });
      }
      
      const domain = process.env.DOMAIN || req.headers.origin || 'http://localhost:3000';
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment', // One-time payment, not subscription
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: `${domain}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domain}/pricing.html`,
        customer_email: req.body.email || undefined,
        metadata: {
          plan: 'lifetime',
          billing: 'one-time'
        }
      });

      return res.status(200).json({ url: session.url });
    }
    
    // Get price ID from environment for subscription plans
    const priceKey = `PRICE_${plan.toUpperCase()}_${billing.toUpperCase()}`;
    const priceId = process.env[priceKey]?.trim().replace(/^["']|["']$/g, '');
    
    if (!priceId) {
      return res.status(400).json({ 
        error: 'Price ID not configured',
        message: `${priceKey} is not set in environment variables`,
        help: 'Please configure price IDs in Vercel dashboard or .env file'
      });
    }
    
    // Check if it's a placeholder price ID
    if (priceId.includes('1234567890') || priceId.includes('your_')) {
      return res.status(400).json({
        error: 'Invalid price configuration',
        message: 'Please replace placeholder price IDs with real Stripe price IDs',
        help: 'Create products in Stripe Dashboard: https://dashboard.stripe.com/products'
      });
    }
    
    // Create checkout session
    const domain = process.env.DOMAIN || req.headers.origin || 'http://localhost:3000';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${domain}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/pricing.html`,
      subscription_data: {
        trial_period_days: 14,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });
    
    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ 
      error: 'Payment processing failed',
      message: error.message,
      type: error.type || 'api_error',
      help: 'Please check your Stripe configuration and ensure your API keys are correct'
    });
  }
};
