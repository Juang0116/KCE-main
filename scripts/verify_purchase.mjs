#!/usr/bin/env node

/**
 * verify_purchase.mjs
 *
 * Quick E2E sanity check for a Stripe Checkout purchase:
 *   - /api/bookings/:session_id?t=TOKEN
 *   - /api/invoice/:session_id?t=TOKEN
 *   - /api/calendar/:session_id?t=TOKEN
 *   - /checkout/success?session_id=...
 *   - /booking/:session_id?t=TOKEN
 *
 * Usage examples:
 *   node scripts/verify_purchase.mjs --session cs_test_... --token local-dev --base http://localhost:3000
 *   node scripts/verify_purchase.mjs --success-url "http://localhost:3000/es/checkout/success?session_id=cs_test_...&tour=...&t=local-dev" --base http://localhost:3000
 */

function readArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function parseUrlSafe(input) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function parseSessionFromSuccessUrl(successUrl) {
  const u = parseUrlSafe(successUrl);
  return u?.searchParams.get('session_id') ?? null;
}

function parseTokenFromSuccessUrl(successUrl) {
  const u = parseUrlSafe(successUrl);
  return u?.searchParams.get('t') ?? null;
}

function parseLocalePathname(successUrl) {
  const u = parseUrlSafe(successUrl);
  if (!u) return '/es';
  const seg = u.pathname.split('/').filter(Boolean)[0] || 'es';
  return `/${seg}`;
}

function isLikelyRealSessionId(session) {
  if (!session) return false;
  if (!session.startsWith('cs_')) return false;
  if (session.includes('XXX') || session.includes('XXXX')) return false;
  return true;
}

async function get(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const ct = res.headers.get('content-type') || '';
  let body = '';
  try {
    body = await res.text();
  } catch {
    body = '';
  }
  const ok = res.status === 200;
  return { ok, status: res.status, ct, body, url };
}

function printRow(label, r) {
  const status = r.ok ? 'OK ' : 'FAIL';
  const ct = (r.ct || '').split(';')[0] || '—';
  console.log(`${status}  ${label.padEnd(12)} ${String(r.status).padEnd(3)}  ${ct}`);
}

async function main() {
  if (process.argv.includes('--help')) {
    console.log('Usage: node scripts/verify_purchase.mjs --session cs_test_... --token local-dev --base http://localhost:3000');
    console.log('   or: node scripts/verify_purchase.mjs --success-url "http://localhost:3000/es/checkout/success?session_id=cs_test_...&t=local-dev" --base http://localhost:3000');
    process.exit(0);
  }

  const base = readArg('base') || 'http://localhost:3000';
  const successUrl = readArg('success-url');

  let session = readArg('session');
  if (!session && successUrl) session = parseSessionFromSuccessUrl(successUrl);

  const token = readArg('token') || parseTokenFromSuccessUrl(successUrl) || 'local-dev';
  const localePrefix = parseLocalePathname(successUrl);

  if (!isLikelyRealSessionId(session)) {
    console.error('\n❌ No veo un session_id válido.');
    console.error('Pega el URL completo de /checkout/success o pasa --session cs_test_...');
    console.error('\nEjemplos:');
    console.error('  node scripts/verify_purchase.mjs --session cs_test_... --token local-dev --base http://localhost:3000');
    console.error('  node scripts/verify_purchase.mjs --success-url "http://localhost:3000/es/checkout/success?session_id=cs_test_...&tour=...&t=local-dev" --base http://localhost:3000');
    process.exit(2);
  }

  const enc = encodeURIComponent(session);
  const t = encodeURIComponent(token);

  const urls = {
    booking: `${base}/api/bookings/${enc}?t=${t}`,
    invoice_pdf: `${base}/api/invoice/${enc}?t=${t}`,
    calendar_ics: `${base}/api/calendar/${enc}?t=${t}`,
    success_page: successUrl || `${base}${localePrefix}/checkout/success?session_id=${enc}`,
    booking_page: `${base}/booking/${enc}?t=${t}`,
  };

  const results = {
    booking: await get(urls.booking),
    invoice_pdf: await get(urls.invoice_pdf),
    calendar_ics: await get(urls.calendar_ics),
    success_page: await get(urls.success_page),
    booking_page: await get(urls.booking_page),
  };

  console.log('--- verify_purchase results ---');
  for (const [label, result] of Object.entries(results)) {
    printRow(label, result);
  }

  const total = Object.keys(results).length;
  const passed = Object.values(results).filter((r) => r.ok).length;
  const score = Math.round((passed / total) * 100);
  console.log(`\nScore: ${score}% (${passed}/${total})`);

  const releaseGrade = score >= 95 ? 'release-grade strong' : score >= 80 ? 'almost release-grade' : 'needs hardening';
  console.log(`Release grade: ${releaseGrade}`);

  const failures = Object.entries(results).filter(([, r]) => !r.ok);
  if (failures.length) {
    console.log('\nFailures (debug):');
    for (const [k, r] of failures) {
      const bodyPreview = (r.body || '').slice(0, 400).replace(/\s+/g, ' ');
      console.log(`- ${k}: ${r.url}`);
      console.log(`  status=${r.status} content-type=${r.ct || '—'}`);
      console.log(`  body=${JSON.stringify(bodyPreview)}`);
    }

    console.log('\nSuggested next actions:');
    console.log('- Ve a /admin/qa y corre RC Verify con este session_id.');
    console.log('- Si falta booking, usa “Verificar + Heal booking”.');
    console.log('- Si falta email/PDF, usa “Reenviar email + PDF”.');
    console.log('- Si fallan links, revisa LINK_TOKEN_SECRET.');
    console.log(`- Revisa manualmente ${base}${localePrefix}/account/bookings y ${base}/admin/bookings.`);
    process.exit(1);
  }

  console.log('\n✅ Revenue flow looks healthy. Aún así revisa manualmente /account/bookings y /admin/bookings antes de mover tráfico real.');
  console.log(`• Account review: ${base}${localePrefix}/account/bookings`);
  console.log(`• Admin bookings: ${base}/admin/bookings`);
  console.log(`• Revenue ops: ${base}/admin/revenue`);
}

main().catch((e) => {
  console.error('\n❌ verify_purchase crashed:', e?.message || e);
  process.exit(1);
});
