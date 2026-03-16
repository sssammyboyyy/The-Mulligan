#!/bin/bash

# Industrial Deployment Pipeline for Cloudflare Pages (OpenNext)
echo "🚀 Starting OpenNext Build..."
npx @opennextjs/cloudflare build

# 🛠 Step 1: Standardize Entry Point (The Underscore Rule)
# Cloudflare Pages expects _worker.js (with underscore) at the root
if [ -f ".open-next/worker.js" ]; then
    echo "✅ Renaming worker.js to _worker.js"
    mv .open-next/worker.js .open-next/_worker.js
elif [ ! -f ".open-next/_worker.js" ]; then
    echo "❌ CRITICAL ERROR: _worker.js not found in .open-next/"
    exit 1
fi

# 🏗 Step 2: Hoist Assets
# OpenNext nests assets in /assets, but Cloudflare serves from root
if [ -d ".open-next/assets" ]; then
    echo "🔗 Moving assets from .open-next/assets/ to .open-next/"
    cp -r .open-next/assets/* .open-next/
    rm -rf .open-next/assets
fi

# 🏗 Step 3: Validate Final Structure
if [ -f ".open-next/_worker.js" ]; then
    echo "✨ Success! Final build structure prepared in .open-next/"
    ls -la .open-next/ | grep _worker.js
else
    echo "❌ Final verification failed: _worker.js is missing!"
    exit 1
fi
