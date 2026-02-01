const { MongoClient, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const uri = process.env.MONGODB_URI;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        // Get raw body for signature verification
        const rawBody = await getRawBody(req);
        event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
    
    // Handle the event
    try {
        const client = await connectToDatabase();
        const db = client.db('jarvis-omega');
        const users = db.collection('users');
        
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                
                // Get customer email
                const customerEmail = session.customer_email || session.customer_details?.email;
                
                if (!customerEmail) {
                    console.error('No customer email in checkout session');
                    break;
                }
                
                // Determine plan from price_id
                const priceId = session.line_items?.data[0]?.price?.id || session.subscription?.items?.data[0]?.price?.id;
                let plan = 'free';
                let maxDevices = 1;
                
                // Check for lifetime purchase (one-time payment)
                if (session.mode === 'payment' && priceId === process.env.PRICE_LIFETIME) {
                    plan = 'lifetime';
                    maxDevices = 3;
                    
                    // Update user with lifetime license
                    await users.updateOne(
                        { email: customerEmail.toLowerCase() },
                        {
                            $set: {
                                plan,
                                maxDevices,
                                stripeCustomerId: session.customer,
                                subscriptionId: null, // No subscription for lifetime
                                updatedAt: new Date()
                            },
                            $unset: {
                                trialExpiresAt: ""
                            }
                        }
                    );
                    
                    console.log(`Updated user ${customerEmail} to lifetime license`);
                    break;
                }
                
                // Check for subscription plans
                if (priceId === process.env.PRICE_PRO_MONTHLY || priceId === process.env.PRICE_PRO_YEARLY) {
                    plan = 'pro';
                    maxDevices = 3;
                } else if (priceId === process.env.PRICE_BUSINESS_MONTHLY || priceId === process.env.PRICE_BUSINESS_YEARLY) {
                    plan = 'business';
                    maxDevices = 10;
                }
                
                // Update user plan
                await users.updateOne(
                    { email: customerEmail.toLowerCase() },
                    {
                        $set: {
                            plan,
                            maxDevices,
                            stripeCustomerId: session.customer,
                            subscriptionId: session.subscription,
                            updatedAt: new Date()
                        },
                        $unset: {
                            trialExpiresAt: ""
                        }
                    }
                );
                
                console.log(`Updated user ${customerEmail} to ${plan} plan`);
                break;
            }
            
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                
                // Get price ID
                const priceId = subscription.items.data[0].price.id;
                let plan = 'free';
                let maxDevices = 1;
                
                if (priceId === process.env.PRICE_PRO_MONTHLY || priceId === process.env.PRICE_PRO_YEARLY) {
                    plan = 'pro';
                    maxDevices = 3;
                } else if (priceId === process.env.PRICE_BUSINESS_MONTHLY || priceId === process.env.PRICE_BUSINESS_YEARLY) {
                    plan = 'business';
                    maxDevices = 10;
                }
                
                // Update by Stripe customer ID
                await users.updateOne(
                    { stripeCustomerId: subscription.customer },
                    {
                        $set: {
                            plan,
                            maxDevices,
                            subscriptionId: subscription.id,
                            updatedAt: new Date()
                        },
                        $unset: {
                            trialExpiresAt: ""
                        }
                    }
                );
                
                console.log(`Updated subscription for customer ${subscription.customer}`);
                break;
            }
            
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                
                // Downgrade to expired trial (forces upgrade)
                const expiredDate = new Date();
                expiredDate.setDate(expiredDate.getDate() - 1); // Set to yesterday
                
                await users.updateOne(
                    { stripeCustomerId: subscription.customer },
                    {
                        $set: {
                            plan: 'trial',
                            maxDevices: 1,
                            subscriptionId: null,
                            trialExpiresAt: expiredDate,
                            updatedAt: new Date()
                        }
                    }
                );
                
                console.log(`Downgraded user to free plan: ${subscription.customer}`);
                break;
            }
            
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        
        res.status(200).json({ received: true });
        
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

// Helper to get raw body for webhook signature verification
async function getRawBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            resolve(data);
        });
        req.on('error', reject);
    });
}
