# 🚀 Quick Deployment Reference

## Deployment Scripts Available

### 1. PowerShell Script (Recommended for Windows)
**File:** `deploy-vercel.ps1`

#### Features:
- ✅ Colorful, interactive interface
- ✅ Comprehensive validation checks
- ✅ Environment variable verification
- ✅ Multiple deployment options
- ✅ Automatic clipboard copy of URL
- ✅ Browser auto-open option

#### Usage:

```powershell
# Preview deployment (test before going live)
.\deploy-vercel.ps1

# Production deployment
.\deploy-vercel.ps1 -Production

# Production without confirmations
.\deploy-vercel.ps1 -Production -Force

# Skip environment checks
.\deploy-vercel.ps1 -SkipEnvCheck

# Show help
.\deploy-vercel.ps1 -Help
```

---

### 2. Batch Script (Simple Alternative)
**File:** `deploy-vercel.bat`

#### Features:
- ✅ Simple, straightforward
- ✅ Works on all Windows versions
- ✅ Basic validation checks
- ✅ User-friendly prompts

#### Usage:

```cmd
# Preview deployment
deploy-vercel.bat

# Production deployment
deploy-vercel.bat production
```

---

### 3. NPM Script (Cross-platform)
**Available in package.json**

#### Usage:

```bash
# Preview deployment
npm run deploy

# Production deployment (if configured)
vercel --prod
```

---

## Which One Should I Use?

### Use PowerShell Script If:
- ✅ You're on Windows
- ✅ You want detailed checks and validation
- ✅ You want a polished experience
- ✅ You want multiple deployment options

### Use Batch Script If:
- ✅ You prefer simplicity
- ✅ PowerShell scripts don't run on your system
- ✅ You want a quick, no-frills deployment

### Use NPM Script If:
- ✅ You're on Mac/Linux
- ✅ You prefer command-line tools
- ✅ You want the most direct approach

---

## Deployment Types

### Preview Deployment (Default)
- 🟡 **URL Format:** `https://jarvis-omega-abc123.vercel.app`
- **Purpose:** Testing before going live
- **Use When:** Making changes, testing new features
- **Command:** `.\deploy-vercel.ps1` or `deploy-vercel.bat`

### Production Deployment
- 🔴 **URL Format:** `https://jarvis-omega.vercel.app` (your main domain)
- **Purpose:** Live website for users
- **Use When:** Everything tested and ready
- **Command:** `.\deploy-vercel.ps1 -Production` or `deploy-vercel.bat production`

---

## Pre-Deployment Checklist

Before deploying, make sure:

- [ ] All code changes saved
- [ ] `.env` file configured (for local reference)
- [ ] Environment variables set in Vercel Dashboard
- [ ] Tested locally (`npm start`)
- [ ] Stripe configuration tested (`npm test`)
- [ ] No sensitive data in code

---

## Post-Deployment Checklist

After deploying:

- [ ] Visit the deployed URL
- [ ] Test navigation (all pages load)
- [ ] Test pricing page
- [ ] Test checkout flow with test card: `4242 4242 4242 4242`
- [ ] Check browser console for errors
- [ ] Verify environment variables in Vercel
- [ ] Test on mobile device (if possible)

---

## Common Deployment Scenarios

### Scenario 1: First Time Deployment
```powershell
# 1. Login to Vercel (one-time)
vercel login

# 2. Deploy preview first
.\deploy-vercel.ps1

# 3. Test everything

# 4. Deploy to production
.\deploy-vercel.ps1 -Production
```

### Scenario 2: Quick Update
```powershell
# Deploy directly to production (if confident)
.\deploy-vercel.ps1 -Production -Force
```

### Scenario 3: Testing Changes
```powershell
# Deploy preview, skip env checks (faster)
.\deploy-vercel.ps1 -SkipEnvCheck
```

### Scenario 4: Emergency Hotfix
```powershell
# Fast production deployment
.\deploy-vercel.ps1 -Production -Force -SkipEnvCheck
```

---

## Environment Variables Setup

### Via Vercel CLI
```powershell
vercel env add STRIPE_SECRET_KEY
vercel env add PRICE_PRO_MONTHLY
vercel env add PRICE_PRO_YEARLY
vercel env add PRICE_BUSINESS_MONTHLY
vercel env add PRICE_BUSINESS_YEARLY
vercel env add DOMAIN
```

### Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable from your `.env` file
5. Select which environments (Production, Preview, Development)
6. Save and redeploy

---

## Troubleshooting

### "Command not found: vercel"
**Solution:**
```powershell
npm install -g vercel
```

### "Not logged in to Vercel"
**Solution:**
```powershell
vercel login
```

### "Deployment failed"
**Possible causes:**
- No internet connection
- Vercel service down (check https://vercel-status.com)
- Invalid project configuration
- Missing required files

**Solution:**
```powershell
# Check authentication
vercel whoami

# Try manual deployment
vercel --prod

# Check logs
vercel logs
```

### "Environment variables not working"
**Solution:**
1. Make sure they're set in Vercel Dashboard (not just .env)
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)

### "Checkout not working after deployment"
**Solution:**
1. Update `DOMAIN` environment variable in Vercel
2. Verify Stripe keys are for correct mode (test vs live)
3. Check browser console for errors
4. Verify API routes are accessible

---

## Quick Commands Reference

```powershell
# Preview deployment
.\deploy-vercel.ps1

# Production deployment
.\deploy-vercel.ps1 -Production

# Fast production update
.\deploy-vercel.ps1 -Production -Force

# Check who you're logged in as
vercel whoami

# View recent deployments
vercel ls

# View logs
vercel logs

# Remove old deployments
vercel rm [deployment-url]

# Add environment variable
vercel env add VARIABLE_NAME

# List environment variables
vercel env ls

# Open project in browser
vercel --open
```

---

## Deployment Workflow Diagram

```
┌─────────────────┐
│  Make Changes   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Test Locally   │  npm start
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy Preview  │  .\deploy-vercel.ps1
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Test Preview   │  Check preview URL
└────────┬────────┘
         │
         ▼
    ┌────┴────┐
    │  Good?  │
    └────┬────┘
         │ YES
         ▼
┌─────────────────┐
│Deploy Production│  .\deploy-vercel.ps1 -Production
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Test Live!    │  🎉
└─────────────────┘
```

---

## Best Practices

1. **Always deploy to preview first** unless it's an emergency
2. **Test thoroughly** before production deployment
3. **Keep .env file secure** - never commit to Git
4. **Use environment variables** in Vercel for all secrets
5. **Monitor deployment logs** for errors
6. **Test after every production deployment**
7. **Keep backup** of working version
8. **Document changes** in commit messages
9. **Use production flag carefully** - it updates live site
10. **Have rollback plan** - keep previous deployment URL handy

---

## Need Help?

### Documentation
- 📚 SETUP.md - Complete setup guide
- 📚 TROUBLESHOOTING.md - Common issues
- 📚 CHECKLIST.md - Step-by-step guide

### Online Resources
- 🌐 Vercel Docs: https://vercel.com/docs
- 🌐 Vercel CLI: https://vercel.com/docs/cli
- 🌐 Vercel Dashboard: https://vercel.com/dashboard

### Support Channels
- 💬 Vercel Support: https://vercel.com/support
- 📧 Email: support@jarvisomega.com
- 🐛 Check logs: `vercel logs`

---

## Summary

You now have **3 ways** to deploy:

1. **PowerShell Script** - Full-featured, best for Windows ⭐ Recommended
2. **Batch Script** - Simple, works everywhere
3. **NPM Commands** - Direct, for power users

Choose the one that fits your workflow and happy deploying! 🚀
