# JARVIS Omega - Authentication System Setup Guide

## Overview
This authentication system allows users to login, register, and track which devices they've downloaded JARVIS Omega on. It enforces device limits based on subscription plans.

## Features
- User registration with password validation
- JWT-based authentication
- Device fingerprinting and tracking
- Plan-based device limits (Free: 1, Pro: 3, Business: 10)
- MongoDB backend for user management
- Stripe webhook integration for automatic plan upgrades

## Required Environment Variables

Add these to your `.env` file and Vercel environment variables:

```env
# Existing Stripe variables
STRIPE_SECRET_KEY=sk_live_51S2ham...
STRIPE_PUBLISHABLE_KEY=pk_live_51S2ham...
STRIPE_WEBHOOK_SECRET=whsec_...
PRICE_PRO_MONTHLY=price_...
PRICE_PRO_YEARLY=price_...
PRICE_BUSINESS_MONTHLY=price_...
PRICE_BUSINESS_YEARLY=price_...
DOMAIN=https://jarviswebsite.vercel.app

# New MongoDB variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jarvis-omega?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free tier (M0)
   - Create a new cluster (takes 3-5 minutes)

2. **Configure Database Access**
   - Click "Database Access" in left sidebar
   - Add new database user
   - Username: `jarvis-admin`
   - Password: Generate secure password
   - Database User Privileges: "Read and write to any database"
   - Save the username and password

3. **Configure Network Access**
   - Click "Network Access" in left sidebar
   - Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
   - This is needed for Vercel serverless functions

4. **Get Connection String**
   - Click "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `jarvis-omega`
   - Example: `mongodb+srv://jarvis-admin:PASSWORD@cluster0.abc123.mongodb.net/jarvis-omega?retryWrites=true&w=majority`

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

   This will install:
   - `mongodb@^6.0.0` - MongoDB driver
   - `bcryptjs@^2.4.3` - Password hashing
   - `jsonwebtoken@^9.0.2` - JWT token generation

2. **Update Environment Variables**
   - Add `MONGODB_URI` to `.env`
   - Add `JWT_SECRET` to `.env` (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - Add both to Vercel dashboard under Settings > Environment Variables

3. **Configure Stripe Webhook**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://jarviswebsite.vercel.app/api/stripe-webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy webhook signing secret
   - Add as `STRIPE_WEBHOOK_SECRET` to `.env` and Vercel

4. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

## API Endpoints

### Authentication

**POST /api/auth/register**
- Registers new user
- Body: `{ name, email, password }`
- Returns: `{ success, token, user }`

**POST /api/auth/login**
- Authenticates user
- Body: `{ email, password }`
- Returns: `{ success, token, user }`

### Download Verification

**POST /api/download/verify**
- Verifies device eligibility
- Headers: `Authorization: Bearer <token>`
- Body: `{ deviceName }`
- Returns: `{ success, allowed, device, message }`

### Stripe Webhook

**POST /api/stripe-webhook**
- Handles Stripe events
- Automatically updates user plans on purchase
- Updates device limits based on plan

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, lowercase),
  password: String (bcrypt hashed),
  plan: String ('free' | 'pro' | 'business'),
  maxDevices: Number (1, 3, or 10),
  devices: [{
    fingerprint: String (SHA-256 hash),
    name: String,
    registeredAt: Date,
    lastDownload: Date,
    ip: String,
    userAgent: String
  }],
  stripeCustomerId: String (optional),
  subscriptionId: String (optional),
  createdAt: Date,
  lastLogin: Date,
  updatedAt: Date
}
```

## User Flow

### Registration
1. User visits `/register`
2. Fills out form (name, email, password)
3. Frontend validates password strength
4. POST to `/api/auth/register`
5. Backend creates user with `plan: 'free'`, `maxDevices: 1`
6. Returns JWT token
7. Stored in localStorage
8. Redirects to `/dashboard`

### Login
1. User visits `/login`
2. Enters email and password
3. POST to `/api/auth/login`
4. Backend verifies credentials
5. Returns JWT token
6. Stored in localStorage
7. Redirects to `/dashboard`

### Download
1. User visits `/download`
2. Clicks download button
3. Frontend checks for token
4. If no token → show login modal
5. If token exists → POST to `/api/download/verify`
6. Backend generates device fingerprint
7. Checks if device already registered
8. If new device, checks plan limits
9. If within limit → register device and allow download
10. If limit exceeded → show upgrade modal
11. If allowed → download starts

### Plan Upgrade
1. User purchases Pro/Business plan via Stripe
2. Stripe sends webhook to `/api/stripe-webhook`
3. Webhook updates user record:
   - Pro: `plan: 'pro'`, `maxDevices: 3`
   - Business: `plan: 'business'`, `maxDevices: 10`
4. User can now download on more devices

## Device Fingerprinting

Device fingerprint is created using:
- User-Agent header
- IP address (from X-Forwarded-For or X-Real-IP)
- SHA-256 hash of combined data

This creates a unique identifier for each device without storing personal information.

## Security Features

1. **Password Hashing**: bcrypt with 10 rounds
2. **JWT Tokens**: 30-day expiration
3. **CORS Enabled**: All API endpoints support cross-origin requests
4. **Input Validation**: Email format, password strength
5. **SQL Injection Protection**: MongoDB prevents SQL injection
6. **Rate Limiting**: Consider adding express-rate-limit in production

## Testing

### Test Registration
```bash
curl -X POST https://jarviswebsite.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234"}'
```

### Test Login
```bash
curl -X POST https://jarviswebsite.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

### Test Download Verification
```bash
curl -X POST https://jarviswebsite.vercel.app/api/download/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"deviceName":"My Computer"}'
```

## Troubleshooting

### "Cannot connect to MongoDB"
- Check MongoDB URI is correct
- Verify network access allows `0.0.0.0/0`
- Ensure database user has correct permissions

### "Invalid token"
- Token may be expired (30 days)
- JWT_SECRET must match between deployments
- Check Authorization header format: `Bearer <token>`

### "Device limit reached"
- Check user's plan in MongoDB
- Verify maxDevices matches plan
- User can remove devices from dashboard

### Webhook not working
- Verify endpoint URL in Stripe dashboard
- Check STRIPE_WEBHOOK_SECRET is correct
- Test webhook in Stripe dashboard

## Future Enhancements

1. **Email Verification**: Send confirmation email on registration
2. **Password Reset**: Forgot password flow
3. **2FA**: Two-factor authentication
4. **Session Management**: Logout from all devices
5. **Admin Panel**: Manage users and devices
6. **Analytics**: Track downloads and active users
7. **Device Names**: Allow users to name their devices
8. **Last Active**: Show when device was last used

## Support

For issues or questions, contact:
- Email: support@jarvisomega.com
- Discord: [Your Discord Server]
- GitHub Issues: [Your Repo URL]

---

**IMPORTANT**: Keep your MongoDB URI and JWT_SECRET private. Never commit them to Git. Add to `.gitignore`:

```
.env
.env.local
.env.*.local
```
