#!/bin/bash
# scripts/deploy.sh
# Deterministic build, Env Bridge, and asset hoisting for Cloudflare Pages (OpenNext)

set -e

echo "🔐 Bridging Cloudflare Environment Variables to Next.js..."
# This forces the Next.js compiler to bake the public keys into the static bundle
cat << EOF > .env.production
NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
EOF
echo "✅ .env.production generated."

echo "🚀 Starting OpenNext Build..."
npx @opennextjs/cloudflare build

echo "📂 Hoisting static assets to deployment root..."
if [ -d ".open-next/assets" ]; then
    cp -a .open-next/assets/. .open-next/
    echo "✅ Assets hoisted successfully."
    rm -rf .open-next/assets
else
    echo "⚠️  Warning: .open-next/assets directory not found."
fi

echo "🔍 Enforcing 'The Underscore Rule' for Cloudflare routing..."
if [ ! -f ".open-next/_worker.js" ]; then
    if [ -f ".open-next/worker.js" ]; then
        echo "🔄 Renaming worker.js to _worker.js..."
        mv .open-next/worker.js .open-next/_worker.js
    else
        echo "❌ CRITICAL ERROR: _worker.js not found in .open-next/ root."
        exit 1
    fi
fi

echo "🛡️ Generating _routes.json to prevent Asset 404s..."
cat << 'EOF' > .open-next/_routes.json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/_next/static/*", "/images/*", "/favicon.ico", "/*.png", "/*.jpg", "/*.jpeg", "/*.css", "/*.js"]
}
EOF

echo "📊 Deployment Bucket Hierarchy Preview:"
ls -la .open-next | head -n 15

echo "✨ Success! Final build structure prepared."
