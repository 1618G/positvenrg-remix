#!/bin/bash

# Script to create a new Gemini API key via Google Cloud Console
# Note: Gemini API keys are typically created through Google AI Studio
# This script helps with the CLI approach

set -e

PROJECT_ID="reach-for-the-zzas-466421"
KEY_NAME="gemini-api-key-$(date +%Y%m%d)"

echo "🔑 Creating Gemini API Key..."
echo "Project: $PROJECT_ID"
echo "Key Name: $KEY_NAME"
echo ""

# Ensure authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
  echo "❌ Not authenticated. Please run: gcloud auth login"
  exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Enable Generative AI API if not already enabled
echo "📡 Enabling Generative AI API..."
gcloud services enable generativelanguage.googleapis.com --project=$PROJECT_ID || echo "API may already be enabled"

# Create API key
echo "🔐 Creating API key..."
KEY_OUTPUT=$(gcloud services api-keys create \
  --display-name="$KEY_NAME" \
  --api-target=service=generativelanguage.googleapis.com \
  --project=$PROJECT_ID 2>&1)

# Extract key value (might need manual retrieval)
echo ""
echo "✅ API key created!"
echo ""
echo "To get the actual key value, run:"
echo "  gcloud services api-keys get-key-string $(echo \"$KEY_OUTPUT\" | grep -oP 'name: \K[^ ]*' || echo 'KEY_ID')"
echo ""
echo "Or visit: https://console.cloud.google.com/apis/credentials"
echo ""
echo "⚠️  For Gemini, you may also need to create the key at:"
echo "    https://aistudio.google.com/apikey"
echo ""

