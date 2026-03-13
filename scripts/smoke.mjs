/* scripts/smoke.mjs */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.SMOKE_PORT || 3100);
const BASE = `http://127.0.0.1:${PORT}`;
const SMOKE_HEALTHCHECK_TOKEN =
  process.env.SMOKE_HEALTHCHECK_TOKEN || process.env.HEALTHCHECK_TOKEN || 'local-smoke-token';
const HEALTH_URL = `${BASE}/api/health?token=${encodeURIComponent(SMOKE_HEALTHCHECK_TOKEN)}`;

async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'manual' });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function waitForReady() {
  const deadline = Date.now() + 45_000;
  let lastErr = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetchWithTimeout(HEALTH_URL, 2000);
      if (res.ok) return;
      lastErr = new Error(`health returned ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await sleep(500);
  }
  throw lastErr ?? new Error('Server not ready');
}

function startServer() {
  const env = {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: 'production',
    HEALTHCHECK_TOKEN: process.env.HEALTHCHECK_TOKEN || SMOKE_HEALTHCHECK_TOKEN,
  };
  // Windows + Git Bash can throw spawn EINVAL when launching *.cmd directly.
  // Use shell=true with a single command string for maximum portability.
  const cmd = `npm run start -- -p ${PORT}`;
  const child = spawn(cmd, { stdio: 'inherit', env, shell: true });
  return child;
}

async function main() {
  const child = startServer();
  try {
    await waitForReady();

    const routes = [
      '/',
      '/es',
      '/es/tours',
      '/es/discover',
      '/es/blog',
      '/es/vlog',
      '/robots.txt',
      '/sitemap.xml',
      '/site.webmanifest',
    ];

    for (const p of routes) {
      const res = await fetchWithTimeout(`${BASE}${p}`);
      const ok = res.status >= 200 && res.status < 400;
      if (!ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`SMOKE_FAIL ${p} -> ${res.status}\n${body.slice(0, 500)}`);
      }
      // eslint-disable-next-line no-console
      console.log(`SMOKE_OK ${p} -> ${res.status}`);
    }

    const healthRes = await fetchWithTimeout(HEALTH_URL);
    if (!(healthRes.status >= 200 && healthRes.status < 400)) {
      const body = await healthRes.text().catch(() => '');
      throw new Error(`SMOKE_FAIL /api/health -> ${healthRes.status}\n${body.slice(0, 500)}`);
    }
    // eslint-disable-next-line no-console
    console.log(`SMOKE_OK /api/health -> ${healthRes.status}`);

    // eslint-disable-next-line no-console
    console.log('SMOKE_OK ✅');
  } finally {
    child.kill('SIGTERM');
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
