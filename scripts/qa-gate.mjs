// scripts/qa-gate.mjs
// Lightweight "production-readiness" gate: secrets hygiene + required files + security config sanity checks.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();

function isTracked(relPath) {
  try {
    execSync(`git ls-files --error-unmatch ${relPath}`, { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function die(msg) {
  console.error(`\n[QA-GATE] FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`[QA-GATE] OK: ${msg}`);
}

function read(p) {
  return fs.readFileSync(path.join(ROOT, p), 'utf8');
}

function exists(p) {
  return fs.existsSync(path.join(ROOT, p));
}

// 1) Ensure common secret files are NOT present in repo
const forbidden = ['.env', '.env.local', '.env.production', '.env.development', '.env.test'];
for (const f of forbidden) {
  // Only fail if tracked by git (committed or staged). Presence on disk is OK if ignored.
  if (isTracked(f)) die(`Secret env file should NOT be committed: ${f}`);
}
ok('No committed .env* files found');

// 2) Ensure .gitignore protects env files and build artifacts
if (!exists('.gitignore')) die('Missing .gitignore');
const gi = read('.gitignore');
const mustIgnore = ['.env', '.env.local', 'node_modules', '.next'];
for (const entry of mustIgnore) {
  if (!gi.split(/\r?\n/).some((l) => l.trim() === entry || l.trim() === `${entry}/` || l.trim().startsWith(`${entry}`))) {
    die(`.gitignore should include: ${entry}`);
  }
}
ok('.gitignore contains critical ignores');

// 3) Basic security config sanity in next.config.ts (headers/CSP)
if (!exists('next.config.ts')) die('Missing next.config.ts');
const nextCfg = read('next.config.ts');
const hasCsp = /content-security-policy/i.test(nextCfg) || /Content-Security-Policy/i.test(nextCfg);
if (!hasCsp) die('next.config.ts should set Content-Security-Policy headers');
ok('CSP header detected in next.config.ts');

// 4) Ensure admin guard is deny-by-default in production when ADMIN_TOKEN is set
const adminGuardPath = 'src/lib/adminGuard.ts';
if (!exists(adminGuardPath)) die('Missing src/lib/adminGuard.ts');
const adminGuard = read(adminGuardPath);
const looksDenyByDefault =
  /ADMIN_TOKEN/.test(adminGuard) &&
  /(x-admin-token|admin_token)/.test(adminGuard) &&
  /(redirect|unauthorized|forbidden|403)/i.test(adminGuard);

if (!looksDenyByDefault) {
  die('adminGuard.ts should enforce ADMIN_TOKEN via header/cookie and deny access when missing/invalid (prod)');
}
ok('adminGuard.ts enforcement heuristic passed');

// 5) Scan for obvious leaked keys in source (heuristic)
// NOTE: This is intentionally conservative to avoid false positives.
const suspiciousRe = /(SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|RESEND_API_KEY|OPENAI_API_KEY|GEMINI_API_KEY)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/g;

function walk(dir, acc = []) {
  const full = path.join(ROOT, dir);
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const rel = path.join(dir, entry.name);
    const abs = path.join(ROOT, rel);
    if (entry.isDirectory()) walk(rel, acc);
    else acc.push(rel);
  }
  return acc;
}

const files = walk('src');
let leaked = 0;
for (const f of files) {
  if (!/\.(ts|tsx|js|jsx|mjs|cjs|json)$/.test(f)) continue;
  const body = read(f);
  const m = body.match(suspiciousRe);
  if (m?.length) {
    leaked += m.length;
    console.error(`\n[QA-GATE] Possible leaked secret in ${f}:\n  ${m.join('\n  ')}`);
  }
}
if (leaked) die(`Found ${leaked} potential leaked secrets in source files`);
ok('No obvious leaked secrets detected in src');

// 6) Ensure scripts exist for health / QA
if (!exists('scripts/qa-pass1.mjs')) die('Missing scripts/qa-pass1.mjs');
ok('QA harness scripts present');

if (process.exitCode) {
  console.error('\n[QA-GATE] One or more checks failed. Fix issues and rerun: npm run qa:gate');
  process.exit(process.exitCode);
} else {
  console.log('\n[QA-GATE] PASS ✅');
}
