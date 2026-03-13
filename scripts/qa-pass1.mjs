#!/usr/bin/env node
/**
 * QA Pass 1 (local) - simple smoke runner.
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/qa-pass1.mjs
 * Optional:
 *   ADMIN_BASIC_USER=... ADMIN_BASIC_PASS=... (for /admin/* APIs if enabled)
 */

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

function basicAuthHeader() {
  const u = process.env.ADMIN_BASIC_USER;
  const p = process.env.ADMIN_BASIC_PASS;
  if (!u || !p) return {};
  const token = Buffer.from(`${u}:${p}`).toString('base64');
  return { Authorization: `Basic ${token}` };
}

async function fetchJson(path, init = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...basicAuthHeader(),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { url, res, json };
}

function line(title, ok, extra = '') {
  const status = ok ? 'OK ' : 'FAIL';
  process.stdout.write(`[${status}] ${title}${extra ? ` — ${extra}` : ''}\n`);
}

async function main() {
  process.stdout.write(`QA Pass 1 — Base URL: ${BASE_URL}\n\n`);

  // 1) Health
  {
    const t0 = Date.now();
    const { res, json } = await fetchJson('/api/health');
    const ms = Date.now() - t0;
    line('GET /api/health', res.ok && json?.ok === true, `status=${res.status} (${ms}ms)`);
    if (!res.ok) process.stdout.write(JSON.stringify(json, null, 2) + '\n');
  }

  // 2) Tours list
  let firstSlug = null;
  {
    const t0 = Date.now();
    const { res, json } = await fetchJson('/api/tours?limit=5');
    const ms = Date.now() - t0;
    const ok = res.ok && json?.ok === true && Array.isArray(json?.data);
    line('GET /api/tours?limit=5', ok, `status=${res.status} (${ms}ms)`);
    if (ok && json.data.length) {
      firstSlug = json.data[0]?.slug || json.data[0]?.tour_slug || null;
      process.stdout.write(`      first slug: ${firstSlug}\n`);
    } else {
      process.stdout.write(JSON.stringify(json, null, 2) + '\n');
    }
  }

  // 3) View tour event (best-effort)
  if (firstSlug) {
    const t0 = Date.now();
    const { res, json } = await fetchJson(`/api/events/view-tour?slug=${encodeURIComponent(firstSlug)}`);
    const ms = Date.now() - t0;
    line('GET /api/events/view-tour', res.ok && json?.ok === true, `status=${res.status} (${ms}ms)`);
  }

  // 4) Availability (may be empty if table not set)
  // Only runs if you provide TOUR_ID env (uuid)
  if (process.env.TOUR_ID) {
    const t0 = Date.now();
    const { res, json } = await fetchJson(`/api/availability?tour_id=${encodeURIComponent(process.env.TOUR_ID)}`);
    const ms = Date.now() - t0;
    line('GET /api/availability', res.ok && json?.ok === true, `status=${res.status} (${ms}ms)`);
    if (!res.ok) process.stdout.write(JSON.stringify(json, null, 2) + '\n');
  } else {
    process.stdout.write('SKIP /api/availability (set TOUR_ID=... uuid to test)\n');
  }

  // 5) Create checkout (requires STRIPE_SECRET_KEY configured)
  if (firstSlug) {
    const date = process.env.TEST_DATE || '2026-02-15';
    const body = { slug: firstSlug, date, guests: 1 };

    const t0 = Date.now();
    const { res, json } = await fetchJson('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const ms = Date.now() - t0;

    const ok = res.ok && json?.ok === true;
    line('POST /api/checkout', ok, `status=${res.status} (${ms}ms)`);

    if (ok) {
      process.stdout.write(`      checkout url: ${json.url || json.checkout_url || '(missing)'}\n`);
      process.stdout.write(`      session_id: ${json.session_id || json.id || '(missing)'}\n`);
    } else {
      // Not fatal if Stripe not configured yet
      process.stdout.write('      (if Stripe is not configured, this may fail — check /api/health)\n');
      process.stdout.write(JSON.stringify(json, null, 2) + '\n');
    }
  }

  // 6) QR
  {
    const t0 = Date.now();
    const url = `${BASE_URL}/api/qr?text=${encodeURIComponent('https://kce.travel/test')}`;
    const res = await fetch(url);
    const ms = Date.now() - t0;
    line('GET /api/qr', res.ok, `status=${res.status} (${ms}ms)`);
  }

  process.stdout.write('\nDone. If you want a deeper pass, run /admin/runbook and log results to events.\n');
}

main().catch((err) => {
  console.error('QA Pass 1 failed:', err);
  process.exit(1);
});
