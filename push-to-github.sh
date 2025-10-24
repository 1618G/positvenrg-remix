#!/bin/bash

# Push PositiveNRG Remix to GitHub
echo "🚀 Pushing PositiveNRG Remix to GitHub..."

# Check if remote exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "✅ Remote origin already configured"
    git remote -v
else
    echo "❌ No remote origin found. Please create the GitHub repository first:"
    echo "   1. Go to https://github.com/1618G"
    echo "   2. Click 'New' to create repository"
    echo "   3. Name: positvenrg-remix"
    echo "   4. Don't initialize with README"
    echo "   5. Then run: git remote add origin https://github.com/1618G/positvenrg-remix.git"
    exit 1
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🎯 Next step: Deploy on Render"
    echo "   - Go to https://dashboard.render.com"
    echo "   - Create new Web Service"
    echo "   - Connect GitHub repository"
    echo "   - Render will auto-detect Dockerfile"
else
    echo "❌ Failed to push to GitHub"
    echo "   Make sure the repository exists at https://github.com/1618G/positvenrg-remix"
fi
