#!/bin/bash

echo "📧 Gmail Email Setup Helper"
echo ""
echo "This script helps you set up Gmail for sending emails."
echo ""

# Check if email is provided
if [ -z "$1" ]; then
  echo "Usage: ./scripts/setup-gmail.sh your-email@gmail.com"
  echo ""
  echo "Available accounts:"
  echo "  - info@pawsntails.co.uk"
  echo "  - james@nivd.world"
  echo "  - sliceof@zza.group"
  exit 1
fi

EMAIL=$1

echo "Setting up Gmail for: $EMAIL"
echo ""

# Open Google Account App Passwords page
echo "Opening App Passwords page..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "https://myaccount.google.com/apppasswords"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  xdg-open "https://myaccount.google.com/apppasswords" 2>/dev/null || sensible-browser "https://myaccount.google.com/apppasswords" 2>/dev/null
else
  echo "Please open: https://myaccount.google.com/apppasswords"
fi

echo ""
echo "📋 Steps:"
echo "1. Select 'Mail' and your device"
echo "2. Click 'Generate'"
echo "3. Copy the 16-character password"
echo ""
echo "After you get the App Password, run:"
echo ""
echo "  echo 'GMAIL_USER=$EMAIL' >> .env"
echo "  echo 'GMAIL_APP_PASSWORD=your-16-char-password' >> .env"
echo "  echo 'FROM_EMAIL=$EMAIL' >> .env"
echo ""
echo "Or use: ./scripts/add-gmail-to-env.sh $EMAIL <app-password>"

