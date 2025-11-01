#!/bin/bash

# Quick script to update the Gemini API key in .env
# Run this after getting your key from Google AI Studio

set -e

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env file not found"
  exit 1
fi

echo "🔑 Gemini API Key Setup"
echo ""
echo "Please enter your new Gemini API key:"
read -s NEW_KEY

if [ -z "$NEW_KEY" ]; then
  echo "❌ No key provided"
  exit 1
fi

# Update .env file
if grep -q "GEMINI_API_KEY=" "$ENV_FILE"; then
  # Replace existing key
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|GEMINI_API_KEY=.*|GEMINI_API_KEY=\"$NEW_KEY\"|" "$ENV_FILE"
  else
    # Linux
    sed -i "s|GEMINI_API_KEY=.*|GEMINI_API_KEY=\"$NEW_KEY\"|" "$ENV_FILE"
  fi
  echo "✅ Updated GEMINI_API_KEY in .env"
else
  # Add new key
  echo "GEMINI_API_KEY=\"$NEW_KEY\"" >> "$ENV_FILE"
  echo "✅ Added GEMINI_API_KEY to .env"
fi

# Ensure model is set
if ! grep -q "GEMINI_MODEL=" "$ENV_FILE"; then
  echo "GEMINI_MODEL=gemini-2.5-flash" >> "$ENV_FILE"
  echo "✅ Added GEMINI_MODEL to .env"
fi

echo ""
echo "✅ Done! Restart your dev server with: pnpm dev"

