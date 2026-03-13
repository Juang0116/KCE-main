// src/app/site.webmanifest/route.ts
// Legacy alias: some clients (and our smoke test) request /site.webmanifest.
// Next.js Metadata API emits /manifest.webmanifest from src/app/manifest.ts.
// We serve the exact same manifest JSON here to keep both paths working.

import manifest from '../manifest';

export const runtime = 'nodejs';

export function GET() {
  const data = manifest();
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/manifest+json; charset=utf-8',
      // Safe caching: browsers can cache the manifest; Next will revalidate on deploy.
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}

export function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'content-type': 'application/manifest+json; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
