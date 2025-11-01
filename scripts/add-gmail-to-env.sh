#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./scripts/add-gmail-to-env.sh <email> <app-password>"
  echo "Example: ./scripts/add-gmail-to-env.sh info@pawsntails.co.uk abcd-efgh-ijkl-mnop"
  exit 1
fi

EMAIL=$1
APP_PASSWORD=$2
ENV_FILE=".env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating .env file..."
  touch "$ENV_FILE"
fi

# Remove existing Gmail config
sed -i.bak '/^GMAIL_USER=/d' "$ENV_FILE" 2>/dev/null || sed -i '' '/^GMAIL_USER=/d' "$ENV_FILE"
sed -i.bak '/^GMAIL_APP_PASSWORD=/d' "$ENV_FILE" 2>/dev/null || sed -i '' '/^GMAIL_APP_PASSWORD=/d' "$ENV_FILE"
sed -i.bak '/^FROM_EMAIL=/d' "$ENV_FILE" 2>/dev/null || sed -i '' '/^FROM_EMAIL=/d' "$ENV_FILE"
rm -f "${ENV_FILE}.bak" 2>/dev/null

# Add new config
echo "" >> "$ENV_FILE"
echo "# Gmail Email Configuration" >> "$ENV_FILE"
echo "GMAIL_USER=\"$EMAIL\"" >> "$ENV_FILE"
echo "GMAIL_APP_PASSWORD=\"$APP_PASSWORD\"" >> "$ENV_FILE"
echo "FROM_EMAIL=\"$EMAIL\"" >> "$ENV_FILE"

echo "✅ Gmail configuration added to .env!"
echo ""
echo "Current Gmail settings:"
grep -E "^GMAIL_|^FROM_EMAIL" "$ENV_FILE"
echo ""
echo "Restart your dev server (pnpm dev) for changes to take effect."

