#!/bin/bash

# Render build script for PositiveNRG Remix
echo "🚀 Building PositiveNRG Remix app..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
pnpm prisma generate

# Build the application
echo "🔨 Building application..."
pnpm build

echo "✅ Build complete!"
