// scripts/release-candidate.mjs
// Release Candidate gate for MVP: runs local QA + (optional) remote smoke + env validation.
// Usage:
//   npm run qa:rc
//   BASE_URL=https://knowingcultures.vercel.app npm run qa:rc
//
// Behavior:
//  - Always runs: qa:ci + qa:smoke
//  - If BASE_URL is set, runs: qa:smoke:remote
//  - Validates required environment variables for a sellable MVP (can be relaxed with RC_ALLOW_MISSING=1)

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = (process.env.BASE_URL || '').replace(/\/$/, '');
const ALLOW_MISSING = String(process.env.RC_ALLOW_MISSING || '') === '1';

function parseEnvLines(text) {
  const out = {};
  const lines = String(text || '').split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (!key) continue;
    // Strip surrounding quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function hydrateProcessEnvFromDotenvFiles() {
  const cwd = process.cwd();
  const candidates = ['.env.local', '.env'];

  for (const filename of candidates) {
    const fp = path.join(cwd, filename);
    if (!fs.existsSync(fp)) continue;

    try {
      const parsed = parseEnvLines(fs.readFileSync(fp, 'utf8'));
      for (const [k, v] of Object.entries(parsed)) {
        if (!process.env[k] && typeof v === 'string' && v !== '') {
          process.env[k] = v;
        }
      }
    } catch {
      // ignore
    }
  }
}

function run(cmd, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true, // Windows Git Bash compatibility
      env: { ...process.env, ...extraEnv },
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${code}): ${cmd} ${args.join(' ')}`));
    });
  });
}

function validateEnv() {
  // Allow validation even when vars are only present in .env.local (common in dev).
  hydrateProcessEnvFromDotenvFiles();

  const strictEnv = String(process.env.RC_STRICT_ENV || '').trim() === '1';
  const remoteMode = Boolean(BASE_URL);
  // En modo remoto (BASE_URL), las env vars viven en Vercel. No bloqueamos el RC por env local faltante.
  const enforce = strictEnv || !remoteMode;

  const required = [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'LINK_TOKEN_SECRET',
  ];

  const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');

  // Optional AI providers
  const hasAI = Boolean(process.env.OPENAI_API_KEY) || Boolean(process.env.GEMINI_API_KEY);

  if (!hasAI) {
    // Not required for MVP selling, but we warn.
    console.warn('[RC] WARN: No AI provider key detected (OPENAI_API_KEY or GEMINI_API_KEY). AI endpoints may be disabled.');
  }

  if (missing.length && enforce) {
    const msg = `[RC] Missing required env vars for a sellable MVP:\n- ${missing.join('\n- ')}\n\nSet them in .env.local (dev) / Vercel env (prod).`;
    if (ALLOW_MISSING) {
      console.warn(`${msg}\n[RC] RC_ALLOW_MISSING=1 set, continuing...`);
    } else {
      throw new Error(msg);
    }
  }

  if (missing.length && !enforce) {
    console.warn('[RC] WARN: faltan env vars locales, pero estás en modo remoto (BASE_URL).');
    console.warn('     Missing (local only):', missing.join(', '));
    console.warn('     Si quieres volverlo estricto: RC_STRICT_ENV=1 npm run qa:rc');
  }


  console.log('[RC] OK: Required env vars present (or allowed).');
}

async function main() {
  console.log('=== KCE Release Candidate (MVP) ===');
  console.log(`[RC] BASE_URL: ${BASE_URL || '(not set)'}`);

  validateEnv();

  console.log('\n[RC] Step 1/3: qa:ci (lint + types + prettier + qa-gate + build)');
  await run('npm', ['run', 'qa:ci']);

  console.log('\n[RC] Step 2/3: qa:smoke (local production server smoke)');
  await run('npm', ['run', 'qa:smoke']);

  if (BASE_URL) {
    console.log('\n[RC] Step 3/3: qa:smoke:remote (deployment smoke)');
    await run('npm', ['run', 'qa:smoke:remote'], { BASE_URL });
  } else {
    console.log('\n[RC] Step 3/3: skipped (set BASE_URL to smoke test production).');
  }

  console.log('\n[RC] PASS ✅  (Ready for MVP release checks)');
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
