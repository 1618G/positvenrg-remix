# Gmail Email Setup

## Setup Instructions

### Step 1: Enable 2-Step Verification
1. Go to your [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (required for App Passwords)

### Step 2: Create Gmail App Password
1. Go to [Google Account App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and your device
3. Click "Generate"
4. Copy the 16-character password (no spaces)

### Step 3: Add to .env File

Add these variables to your `.env` file:

```bash
# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
FROM_EMAIL=your-email@gmail.com
BASE_URL=http://localhost:8780
```

## Environment Variables

- **GMAIL_USER**: Your Gmail address (e.g., `youremail@gmail.com`)
- **GMAIL_APP_PASSWORD**: The 16-character app password from Step 2
- **FROM_EMAIL**: Email address to show as sender (usually same as GMAIL_USER)
- **BASE_URL**: Your application URL (for email links)

## Production Setup

For production, update:
- `BASE_URL=https://yourdomain.com`
- Keep `GMAIL_USER` and `GMAIL_APP_PASSWORD` as environment variables (never commit to git)

## Security Notes

- ✅ App Passwords are secure and can be revoked individually
- ✅ Use different app passwords for development and production
- ✅ Never commit app passwords to version control
- ✅ Regularly rotate app passwords

## Troubleshooting

### "Less secure app access" error
- App Passwords replace "less secure app access"
- Make sure 2-Step Verification is enabled first

### Authentication failed
- Double-check the app password (no spaces, exactly 16 characters)
- Ensure 2-Step Verification is enabled
- Try generating a new app password

### Emails not sending
- Check server logs for error messages
- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set correctly
- Test with a simple email first

