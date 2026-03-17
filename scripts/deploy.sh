#!/bin/bash
# scripts/deploy.sh
# Deterministic build and asset hoisting for Cloudflare Pages (OpenNext)

set -e

# 1. Environment Bridge: Map public & secret app variables into Next.js build
cat << EOF > .env.production
NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
YOCO_SECRET_KEY="${YOCO_SECRET_KEY}"
ADMIN_PIN="${ADMIN_PIN}"
AUTOMATION_WEBHOOK_URL="${AUTOMATION_WEBHOOK_URL:-$N8N_WEBHOOK_URL}"
N8N_WEBHOOK_SECRET="${N8N_WEBHOOK_SECRET}"
RECONCILE_SECRET="${RECONCILE_SECRET}"
EOF

# 2. Execute OpenNext Build
npx @opennextjs/cloudflare build

# 3. Hoist static assets to root for Cloudflare Pages delivery
if [ -d ".open-next/assets" ]; then
    cp -a .open-next/assets/. .open-next/
    rm -rf .open-next/assets
fi

# 4. Enforce worker filename for Cloudflare entry point
if [ ! -f ".open-next/_worker.js" ]; then
    if [ -f ".open-next/worker.js" ]; then
        mv .open-next/worker.js .open-next/_worker.js
    else
        exit 1
    fi
fi

# 5. Generate routing table to prevent asset 404s
cat << 'EOF' > .open-next/_routes.json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/_next/static/*", "/images/*", "/favicon.ico", "/*.png", "/*.jpg", "/*.jpeg", "/*.css", "/*.js"]
}
EOF

# Note: The script ends here to allow Cloudflare Pages to perform its native deployment flow.
