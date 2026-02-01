# JARVIS Omega Website - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Stripe

#### A. Get Your Stripe API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up or log in
3. Navigate to **Developers → API Keys**
4. Copy your **Publishable Key** (starts with `pk_test_`)
5. Copy your **Secret Key** (starts with `sk_test_`)

#### B. Create Products and Prices
1. Go to [Products](https://dashboard.stripe.com/products)
2. Click **+ Add product**

**For Pro Plan:**
- Name: `JARVIS Omega Pro`
- Description: `Pro features with AI integration`
- Create two prices:
  - Monthly: $9/month (recurring)
  - Yearly: $84/year (recurring)
- Copy both Price IDs (start with `price_`)

**For Business Plan:**
- Name: `JARVIS Omega Business`
- Description: `Commercial license with priority support`
- Create two prices:
  - Monthly: $29/month (recurring)
  - Yearly: $290/year (recurring)
- Copy both Price IDs

### 3. Configure Environment Variables

Create or edit the `.env` file in the root directory:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Stripe Price IDs
PRICE_PRO_MONTHLY=price_YOUR_PRO_MONTHLY_ID
PRICE_BUSINESS_MONTHLY=price_YOUR_BUSINESS_MONTHLY_ID
PRICE_PRO_YEARLY=price_YOUR_PRO_YEARLY_ID
PRICE_BUSINESS_YEARLY=price_YOUR_BUSINESS_YEARLY_ID

# Domain (for development)
DOMAIN=http://localhost:3000
```

### 4. Update Publishable Key in Frontend

Edit `public/pricing.html` and replace the Stripe initialization:

```javascript
// Line ~660 in pricing.html
const stripe = Stripe('YOUR_PUBLISHABLE_KEY_HERE');
```

### 5. Run Locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 6. Test Payment Flow

1. Go to http://localhost:3000/pricing.html
2. Click on "Start Pro Trial" or "Start Business Trial"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future expiry date, any CVC, any ZIP

## 🌐 Deploy to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Set Environment Variables in Vercel

```bash
vercel env add STRIPE_SECRET_KEY
vercel env add PRICE_PRO_MONTHLY
vercel env add PRICE_PRO_YEARLY
vercel env add PRICE_BUSINESS_MONTHLY
vercel env add PRICE_BUSINESS_YEARLY
vercel env add DOMAIN
```

Or add them through the Vercel Dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add all the variables from your `.env` file

### 4. Deploy
```bash
npm run deploy
```

## 🔧 Common Issues

### "Stripe not configured" error
- Make sure all environment variables are set
- Check that your API keys are correct
- Verify you're using the right keys (test vs live)

### "Price ID not configured" error
- Ensure all 4 price IDs are set in environment variables
- Check that you created recurring prices in Stripe
- Verify the price IDs are correct (copy-paste from Stripe)

### Checkout redirects to wrong URL
- Update the `DOMAIN` environment variable
- For local: `http://localhost:3000`
- For production: `https://your-domain.vercel.app`

### Cannot connect to payment server
- Make sure `npm run dev` is running
- Check the browser console for errors
- Verify the API endpoint is accessible

## 📝 Testing

### Test Cards (Stripe Test Mode)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

Use any:
- Future expiry date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## 🔐 Going Live

1. Switch to Live Mode in Stripe Dashboard
2. Get your **live** API keys (start with `pk_live_` and `sk_live_`)
3. Create live products and prices
4. Update environment variables with live keys
5. Update the Stripe.js initialization in `pricing.html`
6. Test thoroughly before announcing

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Vercel logs if deployed
3. Verify all environment variables are set
4. Ensure Stripe keys and price IDs are correct

## 🎯 Next Steps

- [ ] Set up email notifications for purchases
- [ ] Create customer portal for subscription management
- [ ] Add webhook handling for payment events
- [ ] Implement download delivery system
- [ ] Add analytics tracking
