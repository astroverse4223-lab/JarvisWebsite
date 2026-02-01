# ✅ JARVIS Omega Setup Checklist

## Before You Start

- [ ] Node.js installed (v16 or higher)
- [ ] Stripe account created (https://stripe.com)
- [ ] Code editor ready (VS Code recommended)

---

## Step 1: Stripe Setup (30 minutes)

### Get API Keys
- [ ] Log in to [Stripe Dashboard](https://dashboard.stripe.com)
- [ ] Navigate to **Developers → API Keys**
- [ ] Copy **Publishable key** (starts with `pk_test_`)
- [ ] Copy **Secret key** (starts with `sk_test_`)
- [ ] Save these securely!

### Create Products

**Pro Plan:**
- [ ] Go to **Products** → **Add product**
- [ ] Name: `JARVIS Omega Pro`
- [ ] Description: `Pro features with AI integration`
- [ ] Click **Add pricing**
  - [ ] Monthly: $9.00 USD, Recurring
  - [ ] Copy the Price ID (e.g., `price_1ABC...`)
  - [ ] Add another price: Yearly: $84.00 USD, Recurring
  - [ ] Copy this Price ID too

**Business Plan:**
- [ ] Click **Add product** again
- [ ] Name: `JARVIS Omega Business`
- [ ] Description: `Commercial license with priority support`
- [ ] Click **Add pricing**
  - [ ] Monthly: $29.00 USD, Recurring
  - [ ] Copy the Price ID
  - [ ] Add another price: Yearly: $290.00 USD, Recurring
  - [ ] Copy this Price ID

### Total Price IDs Needed: 4
1. Pro Monthly
2. Pro Yearly
3. Business Monthly
4. Business Yearly

---

## Step 2: Local Configuration (5 minutes)

### Edit .env File
- [ ] Open `.env` in your code editor
- [ ] Replace `STRIPE_SECRET_KEY` with your secret key
- [ ] Replace all 4 `PRICE_*` variables with your price IDs
- [ ] Save the file

**Example:**
```env
STRIPE_SECRET_KEY=sk_test_51ABC...xyz
PRICE_PRO_MONTHLY=price_1ABC...def
PRICE_PRO_YEARLY=price_1ABC...ghi
PRICE_BUSINESS_MONTHLY=price_1ABC...jkl
PRICE_BUSINESS_YEARLY=price_1ABC...mno
DOMAIN=http://localhost:3000
```

### Update pricing.html
- [ ] Open `public/pricing.html`
- [ ] Find line ~660: `const stripe = Stripe('pk_test_...')`
- [ ] Replace with YOUR publishable key
- [ ] Save the file

---

## Step 3: Test Configuration (2 minutes)

### Run Test Script
- [ ] Open terminal/PowerShell
- [ ] Run: `npm test`
- [ ] All checks should be ✅ green
- [ ] If any are ❌ red, fix them first

**Expected output:**
```
✅ Stripe Secret Key: sk_test_...xyz
✅ Pro Monthly Price: price_...def
✅ Pro Yearly Price: price_...ghi
✅ Business Monthly Price: price_...jkl
✅ Business Yearly Price: price_...mno
✅ Stripe API connection successful!
```

---

## Step 4: Local Testing (10 minutes)

### Start Server
- [ ] Run: `npm start`
- [ ] Server should start at http://localhost:3000

### Test Pages
- [ ] Visit http://localhost:3000 (homepage)
- [ ] Click "Pricing" link
- [ ] Page loads without errors

### Test Checkout
- [ ] Click "Start Pro Trial" button
- [ ] Button shows "Processing..."
- [ ] Redirects to Stripe Checkout page
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Expiry: Any future date (e.g., 12/30)
- [ ] CVC: Any 3 digits (e.g., 123)
- [ ] ZIP: Any 5 digits (e.g., 12345)
- [ ] Click "Subscribe"
- [ ] Redirects back to success.html
- [ ] Success page displays correctly

### Test Free Download
- [ ] Go back to homepage or download page
- [ ] Click "Download Free Version"
- [ ] Link works (may show 404 if download not uploaded yet - this is OK)

---

## Step 5: Vercel Deployment (15 minutes)

### Install Vercel CLI
- [ ] Run: `npm install -g vercel`
- [ ] Run: `vercel login`
- [ ] Follow login instructions

### Set Environment Variables
- [ ] Run: `vercel`
- [ ] Follow prompts to create new project
- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Select your project
- [ ] Go to **Settings** → **Environment Variables**
- [ ] Add each variable from your .env file:
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `PRICE_PRO_MONTHLY`
  - [ ] `PRICE_PRO_YEARLY`
  - [ ] `PRICE_BUSINESS_MONTHLY`
  - [ ] `PRICE_BUSINESS_YEARLY`
  - [ ] `DOMAIN` (set to your Vercel URL)

### Deploy
- [ ] Run: `npm run deploy`
- [ ] Wait for deployment to complete
- [ ] Copy your production URL
- [ ] Update `DOMAIN` environment variable with production URL
- [ ] Redeploy if needed

### Test Production
- [ ] Visit your production URL
- [ ] Test checkout flow again
- [ ] Use same test card: 4242 4242 4242 4242
- [ ] Verify everything works

---

## Step 6: Going Live (When Ready)

### Switch to Live Mode
- [ ] In Stripe Dashboard, toggle to **Live mode** (top right)
- [ ] Get new **live API keys** (start with `pk_live_` and `sk_live_`)
- [ ] Create **live products** (same setup as test)
- [ ] Get live price IDs

### Update Production
- [ ] Update Vercel environment variables with **live** keys
- [ ] Update `public/pricing.html` with **live** publishable key
- [ ] Deploy: `npm run deploy`

### Final Test (IMPORTANT!)
- [ ] Test with your own real card first
- [ ] Complete a real purchase
- [ ] Verify you receive payment in Stripe
- [ ] Check success page works
- [ ] Cancel the subscription in Stripe (refund yourself)

---

## Quick Reference

### Test Cards (Test Mode Only)
- ✅ Success: `4242 4242 4242 4242`
- ❌ Decline: `4000 0000 0000 0002`
- 🔐 3D Secure: `4000 0025 0000 3155`

### Useful Commands
```bash
npm test          # Test configuration
npm start         # Start local server
npm run dev       # Start with Vercel dev
npm run deploy    # Deploy to production
```

### Useful Links
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Test Cards](https://stripe.com/docs/testing)
- [Stripe Docs](https://stripe.com/docs)

---

## Need Help?

📖 Read: TROUBLESHOOTING.md
📖 Read: SETUP.md
🐛 Check browser console for errors
📊 Check Vercel logs: `vercel logs`
✅ Run configuration test: `npm test`

---

## Status Tracker

Mark your progress:

- [ ] Stripe account created
- [ ] Products and prices created
- [ ] .env configured
- [ ] Test script passes (npm test)
- [ ] Local server runs
- [ ] Checkout tested locally
- [ ] Vercel account created
- [ ] Environment variables set in Vercel
- [ ] Production deployed
- [ ] Production tested
- [ ] Ready for live mode (optional)

**When all checked, you're ready to launch! 🚀**
