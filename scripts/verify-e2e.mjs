// scripts/verify-e2e.mjs
// Minimal, fast E2E verification for PROD/PREVIEW or local.
//
// Usage:
//   npm run verify:e2e
//   BASE_URL=https://your-domain.com ADMIN_BASIC_USER=... ADMIN_BASIC_PASS=... npm run verify:e2e
//
// Notes:
// - Uses /api/admin/system/status as a single source of truth for env + Supabase + queues.

import { Buffer } from 'node:buffer';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const DEEP = String(process.env.E2E_DEEP || '') === '1';

function headerAuth() {
  const h = {};
  const token = String(process.env.ADMIN_TOKEN || '').trim();
  if (token) h['x-admin-token'] = token;

  const u = String(process.env.ADMIN_BASIC_USER || '').trim();
  const p = String(process.env.ADMIN_BASIC_PASS || '').trim();
  if (!h['x-admin-token'] && u && p) {
    h.authorization = `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`;
  }
  return h;
}

async function mustFetch(path, opts = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      accept: 'application/json',
      ...headerAuth(),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text().catch(() => '');
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}\n${text.slice(0, 800)}`);
  }
  return json;
}

async function main() {
  console.log('=== KCE verify:e2e (P71) ===');
  console.log(`[E2E] BASE_URL: ${BASE_URL}`);

  const status = await mustFetch(`/api/admin/system/status?deep=${DEEP ? '1' : '0'}`);
  if (!status?.ok) {
    console.log('[E2E] System status payload:', JSON.stringify(status, null, 2));
    throw new Error('[E2E] FAIL: /api/admin/system/status not OK');
  }

  console.log('[E2E] OK: system status');

  // Optional: shallow check that admin metrics endpoint responds.
  try {
    const byCity = await mustFetch('/api/admin/metrics/by-city');
    if (!byCity) throw new Error('empty response');
    console.log('[E2E] OK: metrics/by-city');
  } catch (e) {
    console.warn('[E2E] WARN: metrics/by-city failed (non-blocking):', String(e?.message || e));
  }

  console.log('\n[E2E] PASS ✅');
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
