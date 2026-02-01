# 🚀 Deploy JARVIS Omega to Vercel

## Prerequisites
1. Vercel account (free): https://vercel.com/signup
2. Vercel CLI installed: `npm install -g vercel`
3. Stripe account with API keys

## Step-by-Step Deployment

### 1. Install Vercel CLI (if not installed)
```powershell
npm install -g vercel
```

### 2. Login to Vercel
```powershell
vercel login
```

### 3. Deploy the Website
```powershell
cd C:\Users\count\OneDrive\Desktop\jarvis
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → jarvis-omega (or your choice)
- **Directory to deploy?** → . (current directory)
- **Override settings?** → No

### 4. Add Environment Variables

After deployment, add your Stripe keys as environment variables:

```powershell
# Add Stripe Secret Key
vercel env add STRIPE_SECRET_KEY

# Add Publishable Key
vercel env add STRIPE_PUBLISHABLE_KEY

# Add Webhook Secret (optional for now)
vercel env add STRIPE_WEBHOOK_SECRET

# Add Price IDs
vercel env add PRICE_PRO_MONTHLY
vercel env add PRICE_PRO_YEARLY
vercel env add PRICE_BUSINESS_MONTHLY
vercel env add PRICE_BUSINESS_YEARLY
```

For each command, paste the value from your `.env` file when prompted.

### 5. Update Domain in pricing.html

Once deployed, Vercel will give you a URL like: `https://jarvis-omega.vercel.app`

Update [pricing.html](website/pricing.html):
- Change API endpoint from `http://localhost:5000/api/...` to `https://your-domain.vercel.app/api/...`

### 6. Redeploy with Changes
```powershell
vercel --prod
```

## Using the Deploy Script

Or use the automated script:
```powershell
.\deploy-vercel.ps1
```

## Configure Custom Domain (Optional)

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Domains**
4. Add your custom domain (e.g., jarvisomega.com)
5. Update DNS records as shown

## Update Stripe Webhook

Once deployed with your production domain:

1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret
5. Add to Vercel env: `vercel env add STRIPE_WEBHOOK_SECRET`
6. Redeploy: `vercel --prod`

## Testing Production

1. Visit your Vercel URL
2. Go to pricing page
3. Click "Start Trial"
4. Use test card: 4242 4242 4242 4242
5. Complete checkout

## Troubleshooting

**CORS errors:**
- Make sure `DOMAIN` in checkout.py matches your Vercel URL

**404 on API routes:**
- Check vercel.json routes configuration
- Ensure checkout.py is in website/api/

**Stripe errors:**
- Verify all environment variables are set in Vercel dashboard
- Check Stripe logs: https://dashboard.stripe.com/logs

## Production Checklist

Before going live with real payments:

- [ ] Switch from test keys to live keys
- [ ] Update DOMAIN to production URL
- [ ] Set up webhook with live endpoint
- [ ] Test with real credit card
- [ ] Add terms of service URL
- [ ] Add privacy policy URL
- [ ] Set up customer support email
- [ ] Configure Stripe tax settings
- [ ] Set up receipt emails in Stripe
- [ ] Test subscription cancellation flow

## Monitoring

Monitor your deployment:
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Vercel Logs:** `vercel logs`

## Useful Commands

```powershell
# Deploy to production
vercel --prod

# View logs
vercel logs

# List environment variables
vercel env ls

# Remove environment variable
vercel env rm VARIABLE_NAME

# Open project in dashboard
vercel open
```

## Support

- Vercel Docs: https://vercel.com/docs
- Stripe Docs: https://stripe.com/docs
- JARVIS Issues: Contact support@jarvisomega.com
