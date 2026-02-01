# Email Setup for Password Reset

## Quick Setup Options

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Step Verification** on your Gmail account:
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Create App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update Environment Variables**:

**Local (.env file):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM=JARVIS Omega <noreply@jarvisassistant.online>
```

**Vercel (Production):**
1. Go to: https://vercel.com/devcodex1s-projects/jarviswebsite/settings/environment-variables
2. Add these variables (select all environments):
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = your Gmail address
   - `SMTP_PASS` = your app password
   - `EMAIL_FROM` = `JARVIS Omega <noreply@jarvisassistant.online>`

---

### Option 2: SendGrid (Recommended for Production)

1. **Create SendGrid Account**:
   - Sign up at: https://signup.sendgrid.com/
   - Free tier: 100 emails/day

2. **Create API Key**:
   - Go to: Settings → API Keys
   - Click "Create API Key"
   - Name: "JARVIS Password Reset"
   - Permissions: "Full Access"
   - Copy the API key

3. **Update Environment Variables**:

**Local (.env file):**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-actual-api-key-here
EMAIL_FROM=JARVIS Omega <noreply@jarvisassistant.online>
```

**Vercel:**
- Same as above, but use SendGrid values

4. **Verify Sender Email**:
   - Go to: Settings → Sender Authentication
   - Verify your "from" email address
   - Check your email and click verification link

---

### Option 3: Other SMTP Services

**Mailgun:**
- SMTP Host: `smtp.mailgun.org`
- Port: `587`
- Free tier: 5,000 emails/month

**Amazon SES:**
- SMTP Host: `email-smtp.us-east-1.amazonaws.com`
- Port: `587`
- Very cheap, ~$0.10 per 1,000 emails

**Outlook/Hotmail:**
- SMTP Host: `smtp-mail.outlook.com`
- Port: `587`

---

## Installation

The password reset system requires `nodemailer` package:

```bash
npm install nodemailer
```

Or add to `package.json`:
```json
{
  "dependencies": {
    "nodemailer": "^6.9.7"
  }
}
```

---

## Testing the Flow

1. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

2. **Test Password Reset:**
   - Go to: https://jarvisassistant.online/forgot-password
   - Enter your email
   - Check your inbox for reset email
   - Click the link in the email
   - Set a new password
   - Try logging in with new password

3. **Check Vercel Logs** if emails don't send:
   ```bash
   vercel logs
   ```

---

## API Endpoints

### 1. Request Password Reset
**POST** `/api/auth/forgot-password`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "If an account exists with that email, a password reset link has been sent."
}
```

### 2. Reset Password
**POST** `/api/auth/reset-password`

**Request:**
```json
{
  "email": "user@example.com",
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset successful! You can now log in with your new password."
}
```

---

## Database Schema Updates

The password reset system adds two new fields to the `users` collection:

```javascript
{
  // ... existing fields
  resetPasswordToken: String,      // SHA256 hash of reset token
  resetPasswordExpiry: Date         // Token expiration (1 hour from request)
}
```

These fields are automatically created when a user requests a password reset.

---

## Security Features

✅ **Token Hashing**: Reset tokens are hashed with SHA256 before storage
✅ **Expiration**: Reset links expire after 1 hour
✅ **One-Time Use**: Tokens are deleted after successful password reset
✅ **Email Enumeration Prevention**: Always returns success to prevent discovering valid emails
✅ **HTTPS Only**: Reset links use HTTPS to prevent token interception

---

## Email Preview

The reset email includes:
- 🎨 Branded HTML template with JARVIS theme
- 🔒 Security warnings and expiration notice
- 📱 Mobile-responsive design
- 📧 Plain text fallback for email clients that don't support HTML
- ⚠️ Clear instructions and link

---

## Troubleshooting

### Email Not Sending

1. **Check Vercel Logs:**
   ```bash
   vercel logs --follow
   ```

2. **Common Issues:**
   - ❌ Wrong SMTP credentials → Double-check username/password
   - ❌ Port blocked → Try port 465 (SSL) instead of 587 (TLS)
   - ❌ Gmail blocking → Enable "Less secure app access" or use app password
   - ❌ SendGrid not verified → Verify your sender email

3. **Test SMTP Locally:**
   ```bash
   npm install -g nodemailer
   node -e "const nm=require('nodemailer');nm.createTransport({host:'smtp.gmail.com',port:587,auth:{user:'your@email.com',pass:'your-password'}}).sendMail({from:'test@test.com',to:'you@email.com',subject:'Test',text:'Test'})"
   ```

### Reset Link Expired

- User must request a new reset link
- Links expire after 1 hour for security
- Old tokens are automatically invalidated

### Link Not Working

- Ensure `DOMAIN` environment variable is set correctly
- Check that the URL scheme is `https://` not `http://`
- Verify the token wasn't modified (email clients sometimes break long URLs)

---

## Cost Analysis

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| Gmail | ~100/day* | Free |
| SendGrid | 100/day | $14.95/mo (40k emails) |
| Mailgun | 5,000/mo | $35/mo (50k emails) |
| Amazon SES | 62,000/mo** | $0.10 per 1,000 |

*Gmail has no official limit but may throttle  
**If sending from EC2, otherwise first 62k free then paid

---

## Production Checklist

- [ ] Set up SMTP credentials in Vercel
- [ ] Test password reset flow end-to-end
- [ ] Verify sender email (if using SendGrid/Mailgun)
- [ ] Update `EMAIL_FROM` to use your domain
- [ ] Set up SPF/DKIM records for better deliverability
- [ ] Monitor Vercel logs for email errors
- [ ] Add rate limiting (prevent spam)
- [ ] Consider adding CAPTCHA on forgot password page

---

## Future Enhancements

1. **Email Templates**: Use a template engine like Handlebars
2. **Rate Limiting**: Prevent abuse (max 3 reset requests per hour)
3. **Account Recovery**: Add security questions or 2FA
4. **Email Verification**: Require email verification on signup
5. **Password History**: Prevent reusing last 5 passwords
6. **Notification Emails**: Alert user when password is changed
