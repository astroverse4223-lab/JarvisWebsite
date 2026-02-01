# Troubleshooting Guide - JARVIS Omega Website

## Common Issues and Solutions

### 1. "Stripe not configured" Error

**Symptoms:**
- Error message when clicking checkout buttons
- Console shows "STRIPE_SECRET_KEY not found"

**Solutions:**
1. Make sure `.env` file exists in the root directory
2. Check that all environment variables are set:
   ```bash
   npm test
   ```
3. Verify your Stripe secret key is correct
4. For Vercel deployment, add env vars in dashboard

---

### 2. "Price ID not configured" Error

**Symptoms:**
- Error about missing PRICE_PRO_MONTHLY or similar
- Checkout fails immediately

**Solutions:**
1. Create products in [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Add both monthly and yearly prices for each product
3. Copy the price IDs (start with `price_`) to your `.env` file
4. Run `npm test` to verify all price IDs are valid

**Example .env:**
```env
PRICE_PRO_MONTHLY=price_1234567890abcdef
PRICE_PRO_YEARLY=price_0987654321fedcba
PRICE_BUSINESS_MONTHLY=price_abcdef1234567890
PRICE_BUSINESS_YEARLY=price_fedcba0987654321
```

---

### 3. Payment Test Not Working

**Symptoms:**
- Card is declined
- Checkout session fails

**Solutions:**
1. Make sure you're using **test mode** in Stripe
2. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
3. Use any future expiry date, any CVC, any ZIP
4. Check browser console for errors

---

### 4. Cannot Connect to Payment Server

**Symptoms:**
- "Could not connect to payment server" error
- Fetch request fails

**Solutions:**

**For Local Development:**
```bash
# Option 1: Using our simple server
npm start

# Option 2: Using Vercel dev
npm run dev
```

**For Vercel Deployment:**
1. Make sure you've deployed: `npm run deploy`
2. Check environment variables are set in Vercel dashboard
3. Check Vercel logs for errors

---

### 5. Environment Variables Not Loading

**Symptoms:**
- Variables are undefined even though .env exists
- Test script shows "NOT SET"

**Solutions:**

**For Local Development:**
1. Make sure `.env` is in the root directory (same level as package.json)
2. Restart your server after changing .env
3. Check file name is exactly `.env` (not `.env.txt`)

**For Vercel:**
1. Go to project settings in Vercel dashboard
2. Navigate to "Environment Variables"
3. Add all variables manually
4. Redeploy after adding variables

---

### 6. Stripe Keys Invalid

**Symptoms:**
- "Invalid API key" error
- Authentication failed

**Solutions:**
1. Check you're using the correct key format:
   - Test secret: `sk_test_...`
   - Test public: `pk_test_...`
   - Live secret: `sk_live_...`
   - Live public: `pk_live_...`
2. Don't mix test and live keys
3. Don't mix test prices with live keys (or vice versa)
4. Regenerate keys if compromised

---

### 7. Wrong Redirect After Payment

**Symptoms:**
- Redirects to wrong domain
- Success page not found

**Solutions:**
1. Update `DOMAIN` in .env:
   ```env
   # For local
   DOMAIN=http://localhost:3000
   
   # For production
   DOMAIN=https://yoursite.vercel.app
   ```
2. Make sure success.html exists in public folder
3. Check Stripe dashboard > Checkout settings

---

### 8. npm install Fails

**Symptoms:**
- Errors during package installation
- Missing dependencies

**Solutions:**
1. Make sure Node.js is installed: `node --version`
2. Update npm: `npm install -g npm@latest`
3. Clear cache: `npm cache clean --force`
4. Delete node_modules and package-lock.json, then reinstall:
   ```bash
   rmdir /s node_modules
   del package-lock.json
   npm install
   ```

---

### 9. Vercel Deployment Fails

**Symptoms:**
- Deployment errors
- Functions not working

**Solutions:**
1. Make sure vercel.json is configured correctly
2. Check all files are committed (if using Git)
3. Verify environment variables in Vercel dashboard
4. Check Vercel logs for specific errors
5. Try deploying again: `npm run deploy`

---

### 10. Pricing Page Not Loading

**Symptoms:**
- Blank page
- Console errors about Stripe

**Solutions:**
1. Check browser console for JavaScript errors
2. Make sure Stripe.js CDN is accessible:
   ```html
   <script src="https://js.stripe.com/v3/"></script>
   ```
3. Update the Stripe publishable key in pricing.html
4. Check if CSS is loading properly

---

## Testing Checklist

Before going live, test:

- [ ] All environment variables are set
- [ ] Stripe API connection works (`npm test`)
- [ ] Can access pricing page
- [ ] Checkout button shows loading state
- [ ] Redirects to Stripe checkout
- [ ] Test card (4242...) completes successfully
- [ ] Redirects back to success page
- [ ] Success page displays correctly
- [ ] Free download works
- [ ] All navigation links work
- [ ] Mobile responsive
- [ ] Cross-browser compatible

---

## Getting Help

### Check Configuration
```bash
npm test
```

### View Logs (Vercel)
```bash
vercel logs
```

### Debug Mode
Add to your .env:
```env
NODE_ENV=development
DEBUG=true
```

### Contact Support
- GitHub Issues: [Your repo]
- Email: support@jarvisomega.com
- Documentation: See SETUP.md

---

## Quick Commands

```bash
# Test configuration
npm test

# Start local server
npm start

# Development with Vercel CLI
npm run dev

# Deploy to production
npm run deploy

# Check Stripe dashboard
# https://dashboard.stripe.com/test/dashboard

# View Vercel logs
vercel logs
```
