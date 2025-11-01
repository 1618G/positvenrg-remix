# 🔑 Fixing Expired Gemini API Key

## 🚨 Current Issue
Your Gemini API key is **expired**. The server logs show:
```
[GoogleGenerativeAI Error]: API key expired. Please renew the API key.
```

## ✅ Quick Fix (Choose One Method)

### Method 1: Google AI Studio (Easiest - Recommended)
1. **Go to**: https://aistudio.google.com/apikey
2. **Sign in** with your Google account
3. **Create or regenerate** an API key:
   - If you see an existing key, click "Regenerate"
   - If no key exists, click "Create API Key"
4. **Copy the new key** (starts with `AIzaSy...`)
5. **Update your .env file** (see below)

### Method 2: Google Cloud Console (CLI)
If you have `gcloud` CLI installed:
```bash
# Authenticate (if needed)
gcloud auth login

# Create new API key
gcloud services api-keys create \
  --display-name="gemini-key-$(date +%Y%m%d)" \
  --api-target=service=generativelanguage.googleapis.com

# Get the key string
gcloud services api-keys list
# Then copy the key ID and run:
gcloud services api-keys get-key-string KEY_ID
```

## 📝 Update Your .env File

### Option A: Use the Setup Script
```bash
chmod +x scripts/setup-gemini-key.sh
./scripts/setup-gemini-key.sh
# Paste your new API key when prompted
```

### Option B: Manual Edit
Edit `.env` file and update:
```env
GEMINI_API_KEY="YOUR_NEW_KEY_HERE"
GEMINI_MODEL=gemini-2.5-flash
```

## 🔄 Restart Server
After updating the key:
```bash
# Stop current server (Ctrl+C)
# Then restart:
pnpm dev
```

## ✅ Verify It's Working
1. **Send a test message** in the chat
2. **Check terminal logs** - you should see:
   ```
   ✅ Gemini API succeeded!
   ```
   Instead of:
   ```
   ❌ Gemini API failed: API key expired
   ```
3. **Chat responses** should be contextual and personalized, not generic fallbacks

## 🛡️ API Key Restrictions (Optional)
To secure your key, you can set restrictions in Google Cloud Console:
- **Application restrictions**: Restrict to specific domains/IPs
- **API restrictions**: Allow only "Generative Language API"

⚠️ **Note**: Restrictions are optional but recommended for production.

## 📚 More Info
- See `API-KEY-SETUP.md` for detailed setup instructions
- See `scripts/create-gemini-api-key.sh` for CLI commands
