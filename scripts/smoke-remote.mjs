// scripts/smoke-remote.mjs
// Smoke test against a running deployment (e.g., Vercel).
// Usage:
//   BASE_URL=https://knowingcultures.vercel.app npm run qa:smoke:remote

const BASE_URL = (process.env.BASE_URL || '').replace(/\/$/, '');
if (!BASE_URL) {
  console.error('SMOKE_REMOTE_FAIL: Missing BASE_URL env var. Example: BASE_URL=https://knowingcultures.vercel.app');
  process.exit(1);
}

const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 12_000);

function withTimeout(promise, ms, label) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return Promise.race([
    promise(ctrl.signal).finally(() => clearTimeout(t)),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`Timeout after ${ms}ms: ${label}`)), ms + 50)),
  ]);
}

async function check(path, expectedStatus = 200) {
  const url = `${BASE_URL}${path}`;
  const res = await withTimeout((signal) => fetch(url, { redirect: 'manual', signal }), TIMEOUT_MS, url);
  const ok = res.status === expectedStatus;
  if (!ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SMOKE_REMOTE_FAIL ${path} -> ${res.status} (expected ${expectedStatus})\n${text.slice(0, 4000)}`);
  }
  console.log(`SMOKE_REMOTE_OK ${path} -> ${res.status}`);
}

async function main() {
  // Public pages
  await check('/', 307);
  await check('/es', 200);
  await check('/es/tours', 200);
  await check('/es/discover', 200);
  await check('/robots.txt', 200);
  await check('/sitemap.xml', 200);

  // Manifests (support both)
  await check('/manifest.webmanifest', 200);
  await check('/site.webmanifest', 200);

  // Health
  await check('/api/health', 200);
  await check('/api/health/supabase', 200);

  console.log('SMOKE_REMOTE_OK ✅');
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
