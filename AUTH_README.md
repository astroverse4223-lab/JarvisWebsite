# Authentication System - Quick Start

## What Was Added

### Frontend Pages
- ✅ **login.html** - User login page with email/password
- ✅ **register.html** - User registration with password validation
- ✅ **dashboard.html** - User account management and device tracking

### Backend API Endpoints
- ✅ **/api/auth/register.js** - User registration with bcrypt hashing
- ✅ **/api/auth/login.js** - User authentication with JWT tokens
- ✅ **/api/download/verify.js** - Device verification and limit enforcement
- ✅ **/api/stripe-webhook.js** - Automatic plan upgrades from Stripe

### Updated Files
- ✅ **download.html** - Added authentication checks and device limit modals
- ✅ **package.json** - Added mongodb, bcryptjs, jsonwebtoken dependencies
- ✅ **.env.example** - Added MongoDB and JWT configuration

### Documentation
- ✅ **AUTH_SETUP_GUIDE.md** - Complete setup instructions

## Quick Setup (5 Minutes)

### 1. Create MongoDB Atlas Database (Free)
```
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free tier
3. Create cluster (takes 3-5 minutes)
4. Database Access → Add User → Save credentials
5. Network Access → Add IP: 0.0.0.0/0
6. Connect → Get connection string
```

### 2. Add Environment Variables
Add to `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jarvis-omega?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Add to Vercel Environment Variables
```
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add MONGODB_URI
3. Add JWT_SECRET
4. Add STRIPE_WEBHOOK_SECRET
```

### 4. Configure Stripe Webhook
```
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: https://jarviswebsite.vercel.app/api/stripe-webhook
3. Select events:
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
4. Copy signing secret → Add as STRIPE_WEBHOOK_SECRET
```

### 5. Deploy
```bash
npm install
vercel --prod
```

## How It Works

### User Registration
1. User goes to `/register`
2. Creates account (name, email, password)
3. Receives JWT token (stored in localStorage)
4. Redirected to `/dashboard`
5. Default plan: **Free (1 device)**

### Download Protection
1. User clicks Download button
2. System checks for login
3. If not logged in → shows login modal
4. If logged in → verifies device limit
5. Device fingerprint created from User-Agent + IP
6. If within limit → download allowed
7. If limit exceeded → shows upgrade modal

### Plan Limits
- **Free Plan**: 1 device
- **Pro Plan**: 3 devices
- **Business Plan**: 10 devices

### Automatic Plan Updates
When user purchases via Stripe:
1. Stripe sends webhook to `/api/stripe-webhook`
2. Webhook finds user by email
3. Updates plan and device limit
4. User can immediately download on more devices

## Testing Locally

### Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234"}'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "plan": "free",
    "devices": []
  }
}
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

### Test Download
```bash
curl -X POST http://localhost:3000/api/download/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"deviceName":"My Computer"}'
```

## Files Overview

```
jarviswebsite/
├── api/
│   ├── auth/
│   │   ├── register.js          # User registration
│   │   └── login.js             # User authentication
│   ├── download/
│   │   └── verify.js            # Device verification
│   └── stripe-webhook.js        # Plan upgrades
├── login.html                   # Login page
├── register.html                # Registration page
├── dashboard.html               # User dashboard
├── download.html                # Download page (protected)
├── package.json                 # Dependencies updated
├── .env.example                 # Environment template
└── AUTH_SETUP_GUIDE.md          # Full documentation
```

## Security Features

✅ Password hashing with bcrypt (10 rounds)
✅ JWT tokens with 30-day expiration
✅ Email validation
✅ Password strength requirements
✅ Device fingerprinting (no personal data stored)
✅ CORS enabled
✅ Stripe webhook signature verification

## Next Steps

1. **Set up MongoDB Atlas** (5 minutes)
2. **Add environment variables** to .env and Vercel
3. **Configure Stripe webhook**
4. **Deploy with `vercel --prod`**
5. **Test registration and login**
6. **Test download with device limits**

## Support

See **AUTH_SETUP_GUIDE.md** for detailed instructions and troubleshooting.

---

**IMPORTANT**: Never commit `.env` file to Git. It's already in `.gitignore`.
