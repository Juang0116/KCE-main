// scripts/env-parity.mjs
// Detects drift between .env.example and src/lib/env.ts schemas.
//
// Usage:
//   npm run env:parity

import fs from 'node:fs';
import path from 'node:path';

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

function keysFromEnvExample(text) {
  const out = new Set();
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    if (!key) continue;
    out.add(key);
  }
  return out;
}

function keysFromEnvTs(text) {
  // Naive-but-effective: pick keys from z.object({ KEY: ... }) blocks.
  const out = new Set();
  const re = /\n\s*([A-Z0-9_]+)\s*:\s*/g;
  let m;
  while ((m = re.exec(text))) {
    out.add(m[1]);
  }
  return out;
}

function setDiff(a, b) {
  // elements in a not in b
  const out = [];
  for (const x of a) if (!b.has(x)) out.push(x);
  out.sort();
  return out;
}

function main() {
  const cwd = process.cwd();
  const envExamplePath = path.join(cwd, '.env.example');
  const envTsPath = path.join(cwd, 'src', 'lib', 'env.ts');

  if (!fs.existsSync(envExamplePath)) {
    console.error(`[env:parity] Missing file: ${envExamplePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(envTsPath)) {
    console.error(`[env:parity] Missing file: ${envTsPath}`);
    process.exit(1);
  }

  const envExample = keysFromEnvExample(readFile(envExamplePath));
  const envTs = keysFromEnvTs(readFile(envTsPath));

  const missingInSchema = setDiff(envExample, envTs);
  const missingInExample = setDiff(envTs, envExample);

  if (!missingInSchema.length && !missingInExample.length) {
    console.log('[env:parity] OK: .env.example and env.ts are in sync.');
    return;
  }

  console.log('=== env parity report ===');
  if (missingInSchema.length) {
    console.log('\nKeys present in .env.example but NOT validated in src/lib/env.ts:');
    for (const k of missingInSchema) console.log(`- ${k}`);
  }
  if (missingInExample.length) {
    console.log('\nKeys present in src/lib/env.ts but NOT documented in .env.example:');
    for (const k of missingInExample) console.log(`- ${k}`);
  }

  console.log('\n[env:parity] FAIL ❌  Fix drift before releasing.');
  process.exit(1);
}

main();
