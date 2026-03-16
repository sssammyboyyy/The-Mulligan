#!/bin/bash

# Industrial Deployment Pipeline for Cloudflare Pages (OpenNext)
# Version: 2.1 (Industrial Asset Hoisting)

echo "🚀 Starting OpenNext Build..."
npx @opennextjs/cloudflare build

# 🏗 Step 1: Hoist Assets (Priority Execution)
# OpenNext nests assets in /assets, but Cloudflare serves from root.
# We must move them before renaming the worker to avoid structural conflicts.
if [ -d ".open-next/assets" ]; then
    echo "🔗 Moving assets from .open-next/assets/ to .open-next/ (Recursive Merge)"
    # Using -a if available for preservation, falling back to -r
    cp -r .open-next/assets/* .open-next/
    rm -rf .open-next/assets
    echo "✅ Asset Hoisting Complete."
else
    echo "⚠️ WARNING: .open-next/assets/ not found. Skipping hoisting."
fi

# 🛠 Step 2: Standardize Entry Point (The Underscore Rule)
# Cloudflare Pages expects _worker.js (with underscore) at the root
if [ -f ".open-next/worker.js" ]; then
    echo "✅ Renaming worker.js to _worker.js"
    mv .open-next/worker.js .open-next/_worker.js
elif [ -f ".open-next/_worker.js" ]; then
    echo "ℹ️ _worker.js already exists. Proceeding."
else
    echo "❌ CRITICAL ERROR: worker.js not found in .open-next/"
    exit 1
fi

# 🏗 Step 3: Debug Visibility & Structure Validation
echo "🔎 Final Build Structure (Top 30 lines):"
ls -R .open-next | head -n 30

if [ -f ".open-next/_worker.js" ]; then
    echo "✨ Success! Final build structure prepared for Cloudflare Pages."
else
    echo "❌ Final verification failed: _worker.js is missing!"
    exit 1
fi
