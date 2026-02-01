# JARVIS Omega - Authentication System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐          │
│  │ index    │  │ register │  │   login   │  │dashboard │          │
│  │  .html   │  │  .html   │  │   .html   │  │  .html   │          │
│  └────┬─────┘  └─────┬────┘  └─────┬─────┘  └────┬─────┘          │
│       │              │              │              │                 │
│       └──────────────┴──────────────┴──────────────┘                │
│                              │                                       │
│                       ┌──────▼──────┐                               │
│                       │  download   │                               │
│                       │   .html     │                               │
│                       │ (Protected) │                               │
│                       └──────┬──────┘                               │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                               │ localStorage
                               │ - authToken (JWT)
                               │ - userEmail
                               │ - userPlan
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                      API LAYER (Vercel Functions)                     │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ /api/auth/       │  │ /api/download/   │  │ /api/stripe-     │  │
│  │  register        │  │   verify         │  │   webhook        │  │
│  │                  │  │                  │  │                  │  │
│  │ • Validate input │  │ • Verify JWT     │  │ • Process Stripe │  │
│  │ • Hash password  │  │ • Check device   │  │   events         │  │
│  │ • Create user    │  │ • Check limit    │  │ • Update plans   │  │
│  │ • Generate JWT   │  │ • Register dev   │  │ • Update limits  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                      │             │
│  ┌────────▼─────────┐          │                      │             │
│  │ /api/auth/       │          │                      │             │
│  │  login           │          │                      │             │
│  │                  │          │                      │             │
│  │ • Find user      │          │                      │             │
│  │ • Verify pass    │          │                      │             │
│  │ • Generate JWT   │          │                      │             │
│  └────────┬─────────┘          │                      │             │
│           │                     │                      │             │
└───────────┼─────────────────────┼──────────────────────┼─────────────┘
            │                     │                      │
            │                     │                      │
┌───────────▼─────────────────────▼──────────────────────▼─────────────┐
│                      MONGODB ATLAS DATABASE                           │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Database: jarvis-omega                                              │
│  Collection: users                                                   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ User Document                                                │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │ _id: ObjectId("...")                                        │    │
│  │ name: "John Doe"                                            │    │
│  │ email: "john@example.com"                                   │    │
│  │ password: "$2a$10$..." (bcrypt hash)                        │    │
│  │ plan: "free" | "pro" | "business"                           │    │
│  │ maxDevices: 1 | 3 | 10                                      │    │
│  │ devices: [                                                  │    │
│  │   {                                                         │    │
│  │     fingerprint: "sha256_hash_...",                         │    │
│  │     name: "My Computer",                                    │    │
│  │     registeredAt: ISODate("..."),                           │    │
│  │     lastDownload: ISODate("..."),                           │    │
│  │     ip: "192.168.1.1",                                      │    │
│  │     userAgent: "Mozilla/5.0..."                             │    │
│  │   }                                                         │    │
│  │ ]                                                           │    │
│  │ stripeCustomerId: "cus_..."                                 │    │
│  │ subscriptionId: "sub_..."                                   │    │
│  │ createdAt: ISODate("...")                                   │    │
│  │ lastLogin: ISODate("...")                                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────┐
│                         STRIPE INTEGRATION                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User → pricing.html → Stripe Checkout                               │
│                            │                                          │
│                            ▼                                          │
│                    Payment Success                                    │
│                            │                                          │
│                            ▼                                          │
│                  Stripe sends webhook                                 │
│                            │                                          │
│                            ▼                                          │
│              /api/stripe-webhook receives event                       │
│                            │                                          │
│              ┌─────────────┴─────────────┐                          │
│              │                           │                           │
│     checkout.session      customer.subscription      customer.sub    │
│        .completed              .updated                .deleted       │
│              │                           │                    │       │
│              ▼                           ▼                    ▼       │
│        Update user plan          Update plan          Downgrade       │
│         (Pro/Business)          (Pro/Business)        to Free         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## User Flow Diagrams

### Registration Flow
```
User visits /register
       │
       ▼
Fills form (name, email, password)
       │
       ▼
Frontend validates:
  • Email format
  • Password strength (8+ chars, upper, lower, number)
  • Terms accepted
       │
       ▼
POST to /api/auth/register
       │
       ▼
Backend:
  1. Validates input
  2. Checks email not already registered
  3. Hashes password (bcrypt, 10 rounds)
  4. Creates user document:
     - plan: "free"
     - maxDevices: 1
     - devices: []
  5. Generates JWT token (30-day expiration)
       │
       ▼
Returns { token, user }
       │
       ▼
Frontend stores:
  • localStorage.authToken = token
  • localStorage.userName = user.name
  • localStorage.userEmail = user.email
  • localStorage.userPlan = user.plan
       │
       ▼
Redirect to /dashboard
```

### Login Flow
```
User visits /login
       │
       ▼
Enters email and password
       │
       ▼
POST to /api/auth/login
       │
       ▼
Backend:
  1. Finds user by email
  2. Compares password with bcrypt
  3. Updates lastLogin timestamp
  4. Generates new JWT token
       │
       ▼
Returns { token, user }
       │
       ▼
Frontend stores token in localStorage
       │
       ▼
Redirect to /dashboard
```

### Download Flow (Protected)
```
User visits /download
       │
       ▼
Clicks "Download for Windows"
       │
       ▼
Frontend checks localStorage.authToken
       │
       ├─ NO TOKEN ──────────────┐
       │                          ▼
       │                  Show login modal
       │                  "Login Required"
       │                          │
       ▼                          ▼
   Has token              User clicks Login
       │                          │
       ▼                          ▼
POST to /api/download/verify      Go to /login
  Headers: Authorization: Bearer <token>
  Body: { deviceName }
       │
       ▼
Backend:
  1. Verifies JWT token
  2. Generates device fingerprint:
     - SHA256(User-Agent + IP)
  3. Checks if device already registered
       │
       ├─ Device exists ─────────────────┐
       │                                  │
       │                                  ▼
       ▼                          Allow download
   New device                     Return success
       │
       ▼
Check device limit:
  free plan: maxDevices = 1
  pro plan: maxDevices = 3
  business plan: maxDevices = 10
       │
       ├─ Limit reached ─────────────────┐
       │                                  │
       │                                  ▼
       ▼                      Show upgrade modal
  Within limit                "Device limit reached"
       │                              │
       ▼                              ▼
Register new device            User clicks "Upgrade"
  • Add to devices array              │
  • Save to MongoDB                   ▼
       │                         Go to /pricing
       ▼
Allow download
Return success
       │
       ▼
Start download from GitHub
```

### Upgrade Flow
```
User on /dashboard (free plan)
  Sees: "Devices: 1/1"
       │
       ▼
Clicks "Upgrade Plan"
       │
       ▼
Redirect to /pricing
       │
       ▼
Selects Pro plan ($9.99/month)
       │
       ▼
Stripe Checkout opens
       │
       ▼
User enters payment info
       │
       ▼
Payment successful
       │
       ▼
Stripe sends webhook to /api/stripe-webhook
  Event: checkout.session.completed
       │
       ▼
Backend:
  1. Extracts customer email
  2. Extracts price ID
  3. Determines plan from price ID:
     - price_pro_* → plan: "pro", maxDevices: 3
     - price_business_* → plan: "business", maxDevices: 10
  4. Updates user in MongoDB:
     - plan: "pro"
     - maxDevices: 3
     - stripeCustomerId: "cus_..."
     - subscriptionId: "sub_..."
       │
       ▼
User redirected to /dashboard
       │
       ▼
Dashboard shows:
  • Plan: PRO
  • Devices: 1/3
       │
       ▼
User can now download on 3 devices
```

## Device Fingerprinting

### How It Works
```
User's Browser
       │
       ├─ User-Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
       │
       ├─ IP Address: "192.168.1.1" (from X-Forwarded-For header)
       │
       ▼
Backend combines:
  data = User-Agent + IP
       │
       ▼
Generate SHA-256 hash:
  fingerprint = crypto.createHash('sha256')
                      .update(data)
                      .digest('hex')
       │
       ▼
Result: "a3f4b8c9d2e1..."
       │
       ▼
Store in user.devices[] array
```

### Why This Approach?
- ✅ Doesn't store personal information
- ✅ Reasonably unique per device
- ✅ Works across sessions
- ✅ Simple to implement
- ⚠️ Changes if user switches IP or browser

## Security Features

### Password Security
```
User enters password: "MyPassword123"
       │
       ▼
bcrypt.hash(password, 10)
       │
       ▼
Stored in DB: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
       │
       ▼
Login attempt:
  bcrypt.compare("MyPassword123", storedHash)
       │
       ▼
Returns: true (match) or false (no match)
```

### JWT Token Security
```
Token Payload:
{
  userId: ObjectId("..."),
  email: "user@example.com",
  plan: "free",
  iat: 1234567890,  // Issued At
  exp: 1237246290   // Expires (30 days later)
}
       │
       ▼
Signed with JWT_SECRET
       │
       ▼
Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2M..."
       │
       ▼
Stored in localStorage
       │
       ▼
Sent with each API request:
  Headers: { Authorization: "Bearer eyJhbGci..." }
       │
       ▼
Backend verifies signature
  jwt.verify(token, JWT_SECRET)
       │
       ├─ Valid ─────────────────┐
       │                          │
       │                          ▼
       ▼                    Process request
   Invalid/Expired              │
       │                          ▼
       ▼                    Return data
Return 401 Unauthorized
```

## Plan Comparison

| Feature              | Free Plan | Pro Plan | Business Plan |
|---------------------|-----------|----------|---------------|
| **Price**           | $0        | $9.99/mo | $29.99/mo     |
| **Max Devices**     | 1         | 3        | 10            |
| **Voice Commands**  | ✅        | ✅       | ✅            |
| **AI Features**     | ✅        | ✅       | ✅            |
| **System Control**  | ✅        | ✅       | ✅            |
| **Priority Support**| ❌        | ✅       | ✅            |
| **API Access**      | ❌        | ❌       | ✅            |
| **Custom Commands** | ❌        | ✅       | ✅            |

## Database Indexes (Recommended)

```javascript
// MongoDB Shell Commands

// Index on email for fast login lookups
db.users.createIndex({ email: 1 }, { unique: true })

// Index on stripeCustomerId for webhook processing
db.users.createIndex({ stripeCustomerId: 1 })

// Index on subscriptionId
db.users.createIndex({ subscriptionId: 1 })

// Compound index for device lookups
db.users.createIndex({ "devices.fingerprint": 1 })
```

## Environment Variables

| Variable              | Purpose                        | Example                           |
|----------------------|--------------------------------|-----------------------------------|
| MONGODB_URI          | MongoDB connection string      | mongodb+srv://user:pass@...       |
| JWT_SECRET           | JWT signing key                | a1b2c3d4e5f6...                   |
| STRIPE_SECRET_KEY    | Stripe API key                 | sk_live_51...                     |
| STRIPE_WEBHOOK_SECRET| Webhook signature verification | whsec_...                         |
| PRICE_PRO_MONTHLY    | Pro monthly price ID           | price_1ABC...                     |
| PRICE_PRO_YEARLY     | Pro yearly price ID            | price_1DEF...                     |
| PRICE_BUSINESS_MONTHLY| Business monthly price ID     | price_1GHI...                     |
| PRICE_BUSINESS_YEARLY | Business yearly price ID      | price_1JKL...                     |
| DOMAIN               | Site URL                       | https://jarviswebsite.vercel.app  |

## API Response Codes

| Code | Meaning               | Example Response                        |
|------|-----------------------|-----------------------------------------|
| 200  | Success               | `{ success: true, data: {...} }`        |
| 201  | Created               | `{ success: true, token: "..." }`       |
| 400  | Bad Request           | `{ error: "Invalid input" }`            |
| 401  | Unauthorized          | `{ error: "Invalid token" }`            |
| 403  | Forbidden             | `{ error: "Device limit reached" }`     |
| 404  | Not Found             | `{ error: "User not found" }`           |
| 405  | Method Not Allowed    | `{ error: "Method not allowed" }`       |
| 500  | Internal Server Error | `{ error: "Server error" }`             |

## File Structure

```
jarviswebsite/
├── api/
│   ├── auth/
│   │   ├── register.js         # User registration endpoint
│   │   └── login.js            # User login endpoint
│   ├── download/
│   │   └── verify.js           # Device verification endpoint
│   ├── create-checkout-session.js  # Stripe checkout
│   └── stripe-webhook.js       # Stripe webhook handler
├── public/ (if exists, should be removed)
├── _public_backup/             # Old public folder
├── index.html                  # Landing page
├── pricing.html                # Pricing page with Stripe
├── download.html               # Download page (protected)
├── login.html                  # Login page
├── register.html               # Registration page
├── dashboard.html              # User dashboard
├── privacy.html                # Privacy policy
├── terms.html                  # Terms of service
├── license.html                # EULA
├── faq.html                    # FAQ page
├── contact.html                # Contact page
├── docs.html                   # Documentation
├── success.html                # Payment success page
├── styles.css                  # Global styles
├── script.js                   # Global JS (particles, etc.)
├── package.json                # Dependencies
├── vercel.json                 # Vercel config
├── .env                        # Environment variables (local)
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── AUTH_README.md              # Quick start guide
├── AUTH_SETUP_GUIDE.md         # Detailed setup
└── DEPLOYMENT_CHECKLIST.md     # Deployment steps
```

---

## Performance Considerations

### Connection Pooling
- MongoDB client caching (`cachedClient`)
- Reuses connections across function invocations
- Reduces cold start latency

### JWT Tokens
- 30-day expiration reduces DB lookups
- Stateless authentication
- No session storage needed

### Device Fingerprinting
- SHA-256 hashing is fast
- No database lookup until verification
- Cached in user document

### Vercel Serverless Functions
- Auto-scaling based on traffic
- Cold start: ~1-2 seconds
- Warm invocation: ~100-200ms

---

**Last Updated:** December 2024
**Architecture Version:** 1.0.0
