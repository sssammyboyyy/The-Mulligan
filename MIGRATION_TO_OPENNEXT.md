# Migration Guide: Switching to OpenNext Cloudflare Adapter

## Why OpenNext?

**OpenNext (`@opennextjs/cloudflare`)** is the **modern, officially recommended, and actively maintained** Next.js adapter for Cloudflare Workers and Pages. It provides:

- **Better Next.js 15+ support** - Full compatibility with the latest App Router features
- **Active maintenance** - Regular updates aligned with Next.js releases
- **Official recommendation** - Endorsed by both Cloudflare and the OpenNext community
- **Enhanced performance** - Optimized for Cloudflare's edge runtime
- **Improved reliability** - Better handling of Next.js features like Server Actions, streaming, and middleware

The previous adapter (`@cloudflare/next-on-pages`) is being phased out in favor of OpenNext, making this transition essential for long-term support and stability.

## Local Migration Steps

Follow these steps **exactly** to ensure a smooth transition:

### Step 1: Remove Old Adapter

First, remove the deprecated `@cloudflare/next-on-pages` package:

\`\`\`bash
pnpm remove @cloudflare/next-on-pages
\`\`\`

This ensures no conflicts between the old and new adapters.

### Step 2: Install OpenNext Adapter

Install the new `@opennextjs/cloudflare` package as a development dependency:

\`\`\`bash
pnpm add -D @opennextjs/cloudflare
\`\`\`

### Step 3: Install All Dependencies

Ensure all dependencies are properly installed and the lockfile is updated:

\`\`\`bash
pnpm install
\`\`\`

This step is critical for Cloudflare to recognize the correct adapter during deployment.

### Step 4: Verify Configuration Files

Your configuration files should already be updated. Verify the following:

**`wrangler.toml` should have:**
\`\`\`toml
[build]
command = "npx opennextjs-cloudflare build"
\`\`\`

**`package.json` should have:**
\`\`\`json
{
  "scripts": {
    "deploy": "npm run build && npx @opennextjs/cloudflare && wrangler pages deploy"
  },
  "devDependencies": {
    "@opennextjs/cloudflare": "^1.0.0"
  }
}
\`\`\`

**`open-next.config.ts` should exist** with basic configuration.

### Step 5: Test Build Locally

Before deploying, test the build process locally:

\`\`\`bash
pnpm build
npx @opennextjs/cloudflare
\`\`\`

This should generate the `.open-next` directory with your Cloudflare-optimized build.

### Step 6: Commit Changes

Commit these changes with a clear message to ensure Cloudflare recognizes the new adapter:

\`\`\`bash
git add package.json pnpm-lock.yaml wrangler.toml open-next.config.ts
git commit -m "chore: migrate to OpenNext Cloudflare adapter

- Remove deprecated @cloudflare/next-on-pages
- Add @opennextjs/cloudflare as recommended adapter
- Update wrangler.toml build command
- Ensure Cloudflare uses correct adapter during deployment"
git push origin main
\`\`\`

### Step 7: Deploy to Cloudflare

Once pushed, Cloudflare Pages will automatically:
1. Detect the `@opennextjs/cloudflare` package in your dependencies
2. Use the build command from `wrangler.toml`
3. Generate the optimized Workers deployment
4. Deploy your application with the new adapter

**Manual deployment (if needed):**
\`\`\`bash
pnpm deploy
\`\`\`

## What Changed?

| Aspect | Old (@cloudflare/next-on-pages) | New (@opennextjs/cloudflare) |
|--------|--------------------------------|------------------------------|
| **Output Directory** | `.vercel/output/static` | `.open-next/` |
| **Build Command** | `npx @cloudflare/next-on-pages` | `npx @opennextjs/cloudflare` |
| **Configuration** | None required | `open-next.config.ts` |
| **Next.js Support** | Up to Next.js 14 | Full Next.js 15+ support |
| **Maintenance** | Deprecated | Actively maintained |

## Environment Variables

**No changes needed!** Your environment variables in Cloudflare Dashboard remain the same:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `N8N_WEBHOOK_URL`
- `YOCO_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`

## Verifying Successful Migration

After deployment, verify the migration was successful:

1. **Check Build Logs** - Look for "Using @opennextjs/cloudflare" in Cloudflare build logs
2. **Test Functionality** - Verify all booking flows work correctly
3. **Check API Routes** - Ensure all API endpoints respond properly
4. **Test Payments** - Confirm Yoco payment integration still works
5. **Monitor Performance** - Compare response times (should be similar or better)

## Troubleshooting

### Build fails with "command not found"

**Solution:** Run `pnpm install` to ensure `@opennextjs/cloudflare` is installed.

### Deployment uses old adapter

**Solution:** Ensure `pnpm-lock.yaml` includes `@opennextjs/cloudflare` and is committed to git.

### API routes return 404

**Solution:** Verify `wrangler.toml` uses `command = "npx opennextjs-cloudflare build"` exactly.

### Environment variables not working

**Solution:** Check Cloudflare Dashboard → Settings → Environment Variables are still set.

## Rollback (If Needed)

If you encounter critical issues, you can temporarily rollback:

\`\`\`bash
pnpm remove @opennextjs/cloudflare
pnpm add -D @cloudflare/next-on-pages
\`\`\`

Update `wrangler.toml`:
\`\`\`toml
[build]
command = "npx @cloudflare/next-on-pages"
\`\`\`

However, **this is only a temporary solution**. OpenNext is the future, and the old adapter will eventually stop receiving updates.

## Benefits You'll See

After migrating to OpenNext, you'll experience:

- **Faster builds** - More efficient bundling for Cloudflare Workers
- **Better compatibility** - Full support for Next.js 15 features like parallel routes and intercepting routes
- **Improved reliability** - Fewer edge-case bugs with Server Actions and middleware
- **Future-proof** - Guaranteed updates as Next.js evolves
- **Better error messages** - More helpful debugging information during builds

## Support

If you encounter any issues during migration:

1. **Check the build logs** in Cloudflare Dashboard
2. **Review the OpenNext documentation**: https://opennext.js.org/cloudflare
3. **Cloudflare Community**: https://community.cloudflare.com
4. **OpenNext GitHub Issues**: https://github.com/opennextjs/opennextjs-cloudflare/issues

## Summary

By switching to OpenNext, you're ensuring your golf booking application uses the **modern, supported, and recommended** adapter for deploying Next.js on Cloudflare. This migration guarantees long-term compatibility, better performance, and peace of mind that your deployment infrastructure is built on the latest standards.

**The migration is straightforward:** Remove old package → Install new package → Commit → Deploy. Cloudflare will handle the rest! 🚀
