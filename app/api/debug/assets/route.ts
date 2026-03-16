export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // We can't use 'fs' in Edge, but we can check if certain things are available 
    // or if we can fetch local assets relative to the worker.
    
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME,
      // Cloudflare specific
      CF_PAGES: process.env.CF_PAGES,
      CF_PAGES_COMMIT_SHA: process.env.CF_PAGES_COMMIT_SHA,
    };

    // Attempt to see if we can resolve a public asset via fetch
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000';
    
    // We check the logo specifically as it's a known 404
    const assetCheck = await fetch(`${protocol}://${host}/images/upscalelogomulligan.jpeg`, { method: 'HEAD' });

    return Response.json({
      status: "Asset Diagnostic Active",
      environment: env,
      asset_test: {
        target: "/images/upscalelogomulligan.jpeg",
        found: assetCheck.ok,
        http_status: assetCheck.status
      }
    });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
