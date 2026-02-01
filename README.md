# JARVIS Omega Website

Advanced AI voice assistant website with Stripe payment integration.

## Features

- 🎨 Futuristic UI with 8 themes
- 💳 Stripe payment integration
- 📱 Fully responsive design
- ⚡ Fast and optimized
- 🔒 Secure payment processing

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Deploy to Vercel
npm run deploy
```

## Setup

See [SETUP.md](SETUP.md) for detailed configuration instructions.

## Project Structure

```
jarviswebsite/
├── api/
│   └── create-checkout-session.js    # Stripe checkout API
├── public/
│   ├── index.html                     # Landing page
│   ├── pricing.html                   # Pricing page
│   ├── download.html                  # Download page
│   ├── success.html                   # Payment success page
│   ├── styles.css                     # Global styles
│   └── script.js                      # JavaScript
├── .env                               # Environment variables (not in git)
├── .env.example                       # Environment template
├── package.json                       # Dependencies
├── vercel.json                        # Vercel configuration
└── SETUP.md                           # Setup guide
```

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Payment**: Stripe Checkout
- **Deployment**: Vercel
- **Backend**: Vercel Serverless Functions (Node.js)

## Environment Variables

Required environment variables:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PRICE_PRO_MONTHLY=price_...
PRICE_BUSINESS_MONTHLY=price_...
PRICE_PRO_YEARLY=price_...
PRICE_BUSINESS_YEARLY=price_...
DOMAIN=http://localhost:3000
```

## License

© 2026 JARVIS Omega. All rights reserved.
