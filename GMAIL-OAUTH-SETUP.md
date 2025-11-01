# Gmail OAuth2 Setup (Alternative to App Passwords)

If App Passwords are not available (Workspace account or 2FA not enabled), use OAuth2 instead.

## Option 1: Enable 2-Step Verification (Recommended)

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Then App Passwords will be available

## Option 2: Use OAuth2 with Gmail API

If you're using Google Workspace or can't enable App Passwords:

### Step 1: Enable Gmail API

```bash
gcloud services enable gmail.googleapis.com --project=pawsntails-476413
```

### Step 2: Create OAuth2 Credentials

1. Go to: https://console.cloud.google.com/apis/credentials?project=pawsntails-476413
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Authorized redirect URIs:
   - `http://localhost:8780/auth/gmail/callback` (dev)
   - `https://yourdomain.com/auth/gmail/callback` (prod)
5. Copy Client ID and Client Secret

### Step 3: Add to .env

```bash
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:8780/auth/gmail/callback
```

### Step 4: Update Code

The email service would need to be updated to use OAuth2 instead of SMTP. This requires:
- OAuth2 token generation
- Token refresh handling
- Initial user authorization flow

**Note**: For now, SMTP with App Passwords is simpler. If you can enable 2-Step Verification, that's the easiest path.

