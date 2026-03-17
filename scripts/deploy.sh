#!/bin/bash
set -e

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
CLOUDFLARE_EMAIL="${CLOUDFLARE_EMAIL:-samuelj121314@gmail.com}"
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-7682db99759e8274d4cb60b25393f1af}"
EOF

npx @opennextjs/cloudflare build

if [ -d ".open-next/assets" ]; then
    cp -a .open-next/assets/. .open-next/
    rm -rf .open-next/assets
fi

if [ ! -f ".open-next/_worker.js" ]; then
    if [ -f ".open-next/worker.js" ]; then
        mv .open-next/worker.js .open-next/_worker.js
    else
        exit 1
    fi
fi

cat << 'EOF' > .open-next/_routes.json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/_next/static/*", "/images/*", "/favicon.ico", "/*.png", "/*.jpg", "/*.jpeg", "/*.css", "/*.js"]
}
EOF

npx wrangler pages deploy .open-next --project-name themes-golf-sim
