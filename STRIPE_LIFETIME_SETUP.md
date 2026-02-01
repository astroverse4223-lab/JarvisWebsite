# Stripe Lifetime Product Setup

## 1. Create Lifetime Product in Stripe

1. Go to Stripe Dashboard: https://dashboard.stripe.com/products
2. Click **"+ Add product"**
3. Fill in details:
   - **Name**: `JARVIS Omega - Lifetime License`
   - **Description**: `Pay once, use forever. Includes all core features (no AI, no cloud sync). Valid for 3 devices.`
   - **Pricing model**: Select **"Standard pricing"**
   - **Price**: `$149.00`
   - **Billing period**: Select **"One time"** (NOT recurring)
   - **Currency**: USD
4. Click **"Save product"**
5. Copy the **Price ID** (starts with `price_...`)

## 2. Add Price ID to Environment Variables

### Local (.env file)
Replace this line:
```
PRICE_LIFETIME=price_YOUR_LIFETIME_PRICE_ID_HERE
```
With your actual price ID:
```
PRICE_LIFETIME=price_1Sw4xyGnteNdff5BAbcDefGh
```

### Production (Vercel)
1. Go to Vercel Dashboard: https://vercel.com/devcodex1s-projects/jarviswebsite
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `PRICE_LIFETIME`
   - **Value**: `price_1Sw4xyGnteNdff5BAbcDefGh` (your actual price ID)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

## 3. Redeploy to Vercel

After adding the environment variable:
```powershell
vercel --prod
```

## 4. Test the Purchase Flow

1. Visit: https://jarvisassistant.online/pricing
2. Click **"Buy Lifetime License"** button
3. You should be redirected to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. After purchase, user's plan should update to `lifetime` in MongoDB

## 5. Verify in Stripe Dashboard

After test purchase:
1. Go to: https://dashboard.stripe.com/payments
2. You should see the one-time payment for $149
3. Customer will NOT have a subscription (it's a one-time payment)

## License Validation API

### Endpoint
`POST /api/license/validate`

### Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### Response (Valid License)
```json
{
  "valid": true,
  "plan": "lifetime",
  "trialExpired": false,
  "message": "Your LIFETIME plan is active.",
  "features": {
    "maxDevices": 3,
    "cloudSync": false,
    "prioritySupport": false
  }
}
```

### Response (Trial Expired)
```json
{
  "valid": false,
  "plan": "trial",
  "trialExpired": true,
  "expiresAt": "2026-01-28T10:30:00.000Z",
  "message": "Your 3-day free trial has expired. Upgrade to continue using JARVIS Omega.",
  "upgradeUrl": "https://jarvisassistant.online/pricing"
}
```

## Integration with JARVIS Omega Desktop App

Add this to your JARVIS Omega startup code:

```python
import requests
import json
import sys

def validate_license(token):
    """Validate license with server on app startup"""
    try:
        response = requests.post(
            'https://jarvisassistant.online/api/license/validate',
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            },
            timeout=10
        )
        
        data = response.json()
        
        if response.status_code == 200 and data.get('valid'):
            print(f"✅ License validated: {data['plan'].upper()}")
            return True
        else:
            print(f"❌ License validation failed: {data.get('message')}")
            if data.get('trialExpired'):
                print(f"\n🔒 Trial Expired - Upgrade at: {data.get('upgradeUrl')}")
            return False
            
    except requests.exceptions.Timeout:
        print("⚠️ License check timed out - allowing offline use")
        return True  # Allow 3-day grace period
    except Exception as e:
        print(f"⚠️ License validation error: {e}")
        return True  # Allow grace period

# On app startup:
token = load_token_from_storage()  # Your token storage logic
if not validate_license(token):
    # Show upgrade dialog
    sys.exit(1)
```

## Features by Plan

| Feature | Trial | Lifetime | Pro | Business |
|---------|-------|----------|-----|----------|
| Core voice commands | ✅ | ✅ | ✅ | ✅ |
| All themes | ✅ | ✅ | ✅ | ✅ |
| Custom commands | ✅ | ✅ | ✅ | ✅ |
| Duration | 3 days | Forever | Forever | Forever |
| Max devices | 1 | 3 | 3 | 10 |
| AI features | ✅ | ❌ | ✅ | ✅ |
| Cloud sync | ❌ | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ | ✅ |
| Commercial use | ❌ | ❌ | ❌ | ✅ |
| Price | Free | $149 one-time | $9/mo or $84/yr | $29/mo or $288/yr |

## Stripe Webhook Handling

The webhook automatically:
- ✅ Sets `plan: 'lifetime'` in MongoDB
- ✅ Clears `trialExpiresAt` 
- ✅ Sets `maxDevices: 3`
- ✅ Sets `subscriptionId: null` (no recurring subscription)

## Support

For issues or questions:
- Email: support@jarvisassistant.online
- Docs: https://jarvisassistant.online/docs
