# Shop Creation & Password Change Setup Guide

## Overview
This guide explains how to set up the shop creation workflow with email and WhatsApp notifications, and the password change feature with email verification.

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Create a `backend/.env` file with the following:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rental-saas
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# WhatsApp Configuration (Optional - Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 3. Email Setup (Gmail)

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `SMTP_PASS`

### 4. WhatsApp Setup (Optional - Twilio)

1. Sign up for [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Set up WhatsApp Sandbox or use Twilio WhatsApp API
4. Add credentials to `.env`

**Note**: For production, you may want to use WhatsApp Business API or other services.

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Variables
Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Features

### Shop Creation Workflow

1. **Super Admin creates shop**:
   - Navigate to `/super-admin/shops`
   - Click "Create New Shop"
   - Fill in all mandatory fields:
     - Shop name
     - Shop email
     - Phone number
     - Address (optional)
     - Admin name
     - Admin email
     - Admin password
   - Submit form

2. **Automatic notifications**:
   - Email sent to shop owner with credentials
   - WhatsApp message sent (if configured) with credentials
   - Shop is automatically activated

3. **Shop owner login**:
   - Shop owner receives credentials via email/WhatsApp
   - Logs in at `/login` with role "Shop Admin"
   - Can access dashboard immediately

### Password Change Workflow

1. **Request password change**:
   - Shop owner navigates to Settings → Change Password
   - Chooses verification method (Email Link or OTP)
   - Enters new password
   - Submits request

2. **Email verification**:
   - **Link method**: Verification link sent to email
     - Click link → Redirected to password change page
     - Enter new password → Password changed
   - **OTP method**: 6-digit code sent to email
     - Enter OTP on verification page
     - Password changed immediately

3. **Confirmation**:
   - Confirmation email sent after successful password change
   - User redirected to login/dashboard

## API Endpoints

### Shop Creation
```
POST /api/shops
Headers: Authorization: Bearer <token>
Body: {
  name: string (required)
  email: string (required)
  phone: string (required)
  whatsappNumber: string (optional)
  address: object (optional)
  adminName: string (required)
  adminEmail: string (required)
  adminPassword: string (required, min 6 chars)
}
```

### Password Change Request
```
POST /api/auth/request-password-change
Headers: Authorization: Bearer <token>
Body: {
  newPassword: string (required, min 6 chars)
  verificationType: 'link' | 'otp' (required)
}
```

### Verify Password Change (Link)
```
POST /api/auth/verify-password-change
Body: {
  token: string (required)
  email: string (required)
  newPassword: string (required, min 6 chars)
}
```

### Verify Password Change (OTP)
```
POST /api/auth/verify-otp
Headers: Authorization: Bearer <token>
Body: {
  otp: string (required, 6 digits)
  newPassword: string (required, min 6 chars)
}
```

## Testing

### Test Shop Creation
1. Login as Super Admin
2. Go to Shops page
3. Create a new shop with test credentials
4. Check email inbox for credentials
5. Check WhatsApp (if configured)
6. Login as shop owner with received credentials

### Test Password Change
1. Login as Shop Admin
2. Go to Settings → Change Password
3. Request password change with OTP method
4. Check email for OTP code
5. Enter OTP and new password
6. Verify password change confirmation email

## Troubleshooting

### Email not sending
- Check SMTP credentials in `.env`
- Verify Gmail App Password is correct
- Check spam folder
- Ensure 2-Step Verification is enabled

### WhatsApp not sending
- Verify Twilio credentials
- Check if WhatsApp Sandbox is set up
- Ensure phone number format includes country code (+1234567890)

### Password change link not working
- Check token expiration (15 minutes)
- Verify email matches user email
- Check if token was already used

## Security Notes

1. **Password Storage**: Passwords are hashed using bcrypt
2. **Token Expiration**: Reset tokens expire in 15 minutes
3. **One-time Use**: Tokens can only be used once
4. **Email Verification**: Required for all password changes
5. **Rate Limiting**: Consider adding rate limiting for production

## Production Considerations

1. Use Redis for temporary password storage (instead of database)
2. Implement rate limiting on password change requests
3. Use proper email service (SendGrid, AWS SES, etc.)
4. Set up proper WhatsApp Business API
5. Add logging and monitoring
6. Implement CAPTCHA for password change requests
7. Add SMS verification as alternative to email
