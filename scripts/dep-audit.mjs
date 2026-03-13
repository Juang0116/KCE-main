#!/usr/bin/env node
// scripts/dep-audit.mjs
import { spawnSync } from 'node:child_process';

function num(v, def) {
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) ? n : def;
}

const maxHigh = num(process.env.AUDIT_MAX_HIGH, 0);
const maxCritical = num(process.env.AUDIT_MAX_CRITICAL, 0);

const res = spawnSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf-8', shell: true });
const out = (res.stdout || '') + (res.stderr || '');

let data = null;
try {
  data = JSON.parse(out);
} catch {
  console.error(out.trim());
  console.error('\n[dep-audit] Failed to parse npm audit JSON. Treating as failure.');
  process.exit(2);
}

const vuln = data.metadata?.vulnerabilities || {};
const high = num(vuln.high, 0);
const critical = num(vuln.critical, 0);

console.log(`[dep-audit] vulnerabilities (omit=dev): critical=${critical}, high=${high}, moderate=${num(vuln.moderate,0)}, low=${num(vuln.low,0)}`);

if (critical > maxCritical || high > maxHigh) {
  console.error(`[dep-audit] FAIL: allowed critical<=${maxCritical}, high<=${maxHigh}`);
  process.exit(1);
}

console.log('[dep-audit] OK');
process.exit(0);
