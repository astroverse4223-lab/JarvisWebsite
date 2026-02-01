# 🔧 API 404 Error - Quick Fix Guide

## Problem
Getting "404 Not Found" when clicking payment buttons on deployed site.
Error: `Unexpected token 'T', "The page c"... is not valid JSON`

## Root Cause
The API endpoint `/api/create-checkout-session` is not accessible on Vercel.

## Solution - Redeploy After Fixes

### ✅ What Was Fixed

1. **Updated vercel.json** - Better routing configuration
2. **Fixed pricing.html** - Better error handling and JSON parsing
3. **Moved originalText** - Fixed JavaScript scope error

### 🚀 Deploy the Fixes

```powershell
# Deploy with the fixed configuration
.\deploy-vercel.ps1 -Production
```

### ✅ Verify After Deployment

1. **Check Functions Tab in Vercel:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Click "Functions" tab
   - You should see: `api/create-checkout-session.js`

2. **Check Environment Variables:**
   - Go to Settings > Environment Variables
   - Verify all are set:
     - `STRIPE_SECRET_KEY`
     - `PRICE_PRO_MONTHLY`
     - `PRICE_PRO_YEARLY`
     - `PRICE_BUSINESS_MONTHLY`
     - `PRICE_BUSINESS_YEARLY`
     - `DOMAIN`

3. **Test the API Directly:**
   ```
   Open browser to:
   https://your-site.vercel.app/api/create-checkout-session
   
   You should see: {"error":"Method not allowed"}
   (This is correct - means API is working but only accepts POST)
   ```

4. **Test Payment Flow:**
   - Go to pricing page
   - Click "Start Pro Trial"
   - Should redirect to Stripe
   - Use test card: 4242 4242 4242 4242

---

## If Still Not Working

### Check 1: API File Deployed?

In Vercel Dashboard:
- Functions tab should show `api/create-checkout-session.js`
- If NOT there, the function wasn't deployed

**Fix:** Redeploy:
```powershell
.\deploy-vercel.ps1 -Production -Force
```

### Check 2: Environment Variables Set?

In Vercel Dashboard > Settings > Environment Variables:
- All 6 variables must be present
- Must be set for "Production" environment
- Values must not be placeholders

**Fix:** Add missing variables:
```powershell
vercel env add STRIPE_SECRET_KEY
# Paste your actual key when prompted
# Repeat for other variables
```

Then redeploy:
```powershell
.\deploy-vercel.ps1 -Production
```

### Check 3: Vercel Logs

Check for errors:
```powershell
vercel logs
```

Look for:
- "Module not found" errors
- "Environment variable not found" errors
- Stripe API errors

---

## Common Issues

### Issue: "Stripe not configured"
**Cause:** Environment variables not set in Vercel
**Fix:** Set all environment variables in Vercel Dashboard, then redeploy

### Issue: "Invalid price ID"
**Cause:** Placeholder price IDs or wrong Stripe keys
**Fix:** 
1. Create products in Stripe Dashboard
2. Copy real price IDs
3. Update Vercel environment variables
4. Redeploy

### Issue: Functions tab is empty
**Cause:** API files not deployed
**Fix:**
1. Check that `api/` folder exists in your project
2. Check `vercel.json` has correct builds configuration
3. Redeploy with: `.\deploy-vercel.ps1 -Production -Force`

### Issue: Still getting 404 after redeploy
**Cause:** Vercel may be caching old config
**Fix:**
1. Go to Vercel Dashboard
2. Settings > General
3. Scroll down and click "Delete Project"
4. Run deployment script again (will create new project)

---

## Quick Commands

```powershell
# Redeploy after fixes
.\deploy-vercel.ps1 -Production

# Check deployment logs
vercel logs

# Add environment variable
vercel env add STRIPE_SECRET_KEY

# List all deployments
vercel ls

# Test API endpoint (in browser)
https://your-site.vercel.app/api/create-checkout-session
```

---

## Expected Behavior

**When API is working correctly:**

1. Click payment button
2. Button shows "Processing..."
3. Browser console shows:
   ```
   Starting checkout for: {plan: "pro", isYearly: false}
   API URL: /api/create-checkout-session
   Response status: 200
   Response data: {sessionId: "cs_..."}
   ```
4. Redirects to Stripe Checkout

**When API has errors:**

1. Click payment button
2. Button shows "Processing..."
3. Browser console shows:
   ```
   Response status: 404 or 500
   Checkout Error: ...
   ```
4. Alert with helpful error message
5. Button resets to original state

---

## Deployment Checklist

After deploying, verify:

- [ ] Site loads at your Vercel URL
- [ ] Functions tab shows `api/create-checkout-session.js`
- [ ] Environment Variables are all set (6 total)
- [ ] API endpoint returns 405 error (correct - means it exists)
- [ ] Pricing page loads without errors
- [ ] Payment button shows loading state
- [ ] Stripe checkout opens
- [ ] Test payment completes
- [ ] Redirects to success page

---

## Need More Help?

1. **Check Vercel Status:** https://vercel-status.com
2. **View Deployment Logs:** `vercel logs`
3. **Check Browser Console:** F12 > Console tab
4. **Vercel Documentation:** https://vercel.com/docs/functions
5. **Our Docs:** See TROUBLESHOOTING.md

---

## Summary

1. ✅ Fixed JavaScript errors in pricing.html
2. ✅ Improved error handling for API failures
3. ✅ Updated vercel.json for better routing
4. 🚀 **Next:** Redeploy with `.\deploy-vercel.ps1 -Production`
5. ✅ **Verify:** Check Functions tab and test payment flow

The code is now fixed - just redeploy and it should work! 🎉
