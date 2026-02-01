# Authentication System - Deployment Checklist

## Before Deployment

### 1. MongoDB Atlas Setup
- [ ] Created MongoDB Atlas account
- [ ] Created free tier cluster (M0)
- [ ] Created database user with read/write access
- [ ] Added IP address `0.0.0.0/0` to network access
- [ ] Obtained connection string
- [ ] Replaced `<password>` in connection string
- [ ] Tested connection locally

### 2. Environment Variables - Local
- [ ] Created `.env` file (if not exists)
- [ ] Added `MONGODB_URI`
- [ ] Generated `JWT_SECRET` with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Added `JWT_SECRET` to `.env`
- [ ] Verified `.env` is in `.gitignore`

### 3. Environment Variables - Vercel
- [ ] Logged into Vercel Dashboard
- [ ] Navigate to: Project → Settings → Environment Variables
- [ ] Added `MONGODB_URI` (Production)
- [ ] Added `JWT_SECRET` (Production)
- [ ] Added `STRIPE_WEBHOOK_SECRET` (Production)
- [ ] Verified all existing Stripe variables present

### 4. Stripe Webhook Configuration
- [ ] Logged into Stripe Dashboard
- [ ] Navigate to: Developers → Webhooks
- [ ] Clicked "Add endpoint"
- [ ] Endpoint URL: `https://jarviswebsite.vercel.app/api/stripe-webhook`
- [ ] Selected events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
- [ ] Clicked "Add endpoint"
- [ ] Copied webhook signing secret
- [ ] Added as `STRIPE_WEBHOOK_SECRET` to Vercel

### 5. Dependencies
- [ ] Ran `npm install`
- [ ] Verified `mongodb`, `bcryptjs`, `jsonwebtoken` in package.json
- [ ] No errors in installation

## Deployment Steps

### 1. Test Locally (Optional but Recommended)
```bash
# Start local development server
vercel dev

# In another terminal, test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test1234"}'

# Should return success with token
```

### 2. Deploy to Production
```bash
# Deploy to Vercel production
vercel --prod

# Or use the deployment script
.\deploy-vercel.ps1
```

### 3. Verify Deployment
- [ ] Opened https://jarviswebsite.vercel.app
- [ ] Navigated to `/register`
- [ ] Filled out registration form
- [ ] Clicked "Sign Up"
- [ ] Redirected to `/dashboard`
- [ ] Saw user name and plan displayed

### 4. Test Download Flow
- [ ] Went to `/download`
- [ ] Clicked "Download for Windows" button
- [ ] Saw device verification (no error modal)
- [ ] Download started successfully

### 5. Test Device Limit
- [ ] Opened `/dashboard` in incognito/private window
- [ ] Registered new user
- [ ] Went to `/download`
- [ ] Downloaded (registers device 1)
- [ ] Opened in another browser
- [ ] Tried to download again
- [ ] Should show "Device limit reached" modal

### 6. Test Plan Upgrade
- [ ] Went to `/pricing`
- [ ] Selected Pro plan
- [ ] Completed Stripe checkout
- [ ] Used test card: `4242 4242 4242 4242`
- [ ] Returned to dashboard
- [ ] Plan shows "Pro"
- [ ] Max devices shows "3"

## Post-Deployment Verification

### Database Check
- [ ] Logged into MongoDB Atlas
- [ ] Clicked "Browse Collections"
- [ ] Database `jarvis-omega` exists
- [ ] Collection `users` exists
- [ ] Test user document visible
- [ ] Fields match schema (name, email, plan, devices, etc.)

### Webhook Check
- [ ] Went to Stripe Dashboard → Webhooks
- [ ] Clicked on webhook endpoint
- [ ] Checked "Recent events"
- [ ] Verified events are being received
- [ ] No errors in event log

### API Endpoint Check
```bash
# Test registration endpoint
curl -X POST https://jarviswebsite.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test","email":"apitest@test.com","password":"Test1234"}'

# Should return 201 with token

# Test login endpoint
curl -X POST https://jarviswebsite.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"apitest@test.com","password":"Test1234"}'

# Should return 200 with token
```

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution:**
- Verify MONGODB_URI in Vercel environment variables
- Check MongoDB Atlas network access allows 0.0.0.0/0
- Verify database user has correct permissions
- Check connection string format

### Issue: "Invalid token" or "Token expired"
**Solution:**
- JWT_SECRET must match between local and production
- Tokens expire after 30 days
- Clear localStorage and login again
- Check JWT_SECRET in Vercel environment variables

### Issue: "Device limit reached" immediately
**Solution:**
- Check user's plan in MongoDB
- Verify maxDevices matches plan (free=1, pro=3, business=10)
- Clear devices array in user document
- User can remove devices from dashboard

### Issue: Webhook not receiving events
**Solution:**
- Verify endpoint URL matches deployment
- Check STRIPE_WEBHOOK_SECRET matches Stripe dashboard
- Test webhook in Stripe dashboard
- Check Vercel function logs

### Issue: Password validation failing
**Solution:**
- Password must be 8+ characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Check regex in register.html: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/`

## Monitoring

### Vercel Function Logs
```
1. Go to Vercel Dashboard
2. Click on your project
3. Click "Logs" tab
4. Filter by function name (e.g., /api/auth/login)
5. Check for errors
```

### MongoDB Atlas Monitoring
```
1. Go to MongoDB Atlas
2. Click "Metrics" tab
3. View connections, operations, storage
4. Check "Collections" for data
```

### Stripe Dashboard
```
1. Go to Stripe Dashboard
2. Click "Developers" → "Webhooks"
3. Check event delivery status
4. View webhook logs
```

## Rollback Plan

If issues occur after deployment:

### Option 1: Rollback in Vercel
```
1. Go to Vercel Dashboard
2. Click "Deployments" tab
3. Find previous working deployment
4. Click "..." → "Promote to Production"
```

### Option 2: Revert Git Commit
```bash
git log  # Find previous commit hash
git revert <commit-hash>
git push origin main
```

### Option 3: Disable Auth Temporarily
```
1. Remove authentication check from download.html
2. Comment out device verification
3. Deploy quick fix
4. Fix issues
5. Re-enable authentication
```

## Success Criteria

✅ Users can register new accounts
✅ Users can login with email/password
✅ Dashboard shows user information
✅ Download page requires authentication
✅ Device limits enforced correctly
✅ Stripe purchases update user plans
✅ Webhook processes events successfully
✅ No errors in Vercel function logs
✅ MongoDB connection stable
✅ JWT tokens working correctly

## Next Steps After Successful Deployment

1. **Test with Real Users**
   - Share registration link with beta testers
   - Monitor for issues
   - Collect feedback

2. **Email Verification** (Future Enhancement)
   - Send confirmation email on registration
   - Require email verification before download

3. **Password Reset** (Future Enhancement)
   - "Forgot password" flow
   - Email reset link
   - Secure token generation

4. **Admin Panel** (Future Enhancement)
   - View all users
   - Manage devices
   - Override limits
   - View analytics

5. **Analytics**
   - Track registrations
   - Monitor downloads
   - Plan conversion rates
   - Device usage patterns

---

## Emergency Contacts

- Vercel Support: https://vercel.com/support
- MongoDB Support: https://www.mongodb.com/support
- Stripe Support: https://support.stripe.com

## Documentation Links

- [Full Setup Guide](./AUTH_SETUP_GUIDE.md)
- [Quick Start](./AUTH_README.md)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

**Last Updated:** December 2024
**Version:** 1.0.0
