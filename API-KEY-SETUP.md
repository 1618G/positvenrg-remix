# Gemini API Key Setup

## Issue
Your Gemini API key has expired. The application is currently falling back to generic demo responses instead of using the real AI.

## Error Message
```
API key expired. Please renew the API key.
```

## How to Fix

### 1. Get a New API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select your project or create a new one
5. Copy the generated API key

### 2. Update Your `.env` File

Open your `.env` file and update the `GEMINI_API_KEY`:

```bash
# Remove or comment out the old key
# GEMINI_API_KEY="your-gemini-api-key-here"

# Add your new key
GEMINI_API_KEY="YOUR_NEW_API_KEY_HERE"
GEMINI_MODEL="gemini-2.5-flash"
```

### 3. Restart Your Server

After updating the `.env` file:

```bash
# Stop your current server (Ctrl+C)
# Then restart:
pnpm dev
```

### 4. Verify It's Working

When you send a message, check your terminal. You should see:
- ✅ `Gemini API succeeded!` instead of ❌ `Gemini API failed`
- Real, contextual responses instead of generic demo responses

## Current Status

- ❌ API key is expired
- ✅ Conversation history is being passed correctly
- ✅ System prompts are being built correctly
- ⚠️ Falling back to demo responses (generic, not contextual)

## After Fixing

Once the API key is updated, you should see:
- Real AI responses that match each companion's personality
- Contextual responses that reference previous messages
- Natural conversation flow
- Responses that directly address user requests (not just asking generic questions)

