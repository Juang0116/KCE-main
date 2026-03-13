#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const typesFile = path.join(root, 'src/types/supabase.ts');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(full, out);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(srcDir);
const used = new Set();
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g)) {
    used.add(m[1]);
  }
}

const typesText = fs.readFileSync(typesFile, 'utf8');
const typed = new Set();
for (const line of typesText.split(/\r?\n/)) {
  const m = line.match(/^\s{6}([a-zA-Z0-9_]+): \{$/);
  if (m) typed.add(m[1]);
}

const missing = [...used].filter((t) => !typed.has(t)).sort();
const payload = {
  scannedFiles: files.length,
  usedTables: [...used].sort(),
  typedTables: [...typed].sort(),
  missingTables: missing,
  ok: missing.length === 0,
};
const outFile = path.join(root, 'audit-supabase-types.json');
fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
console.log(JSON.stringify({ ok: payload.ok, used: used.size, typed: typed.size, missing: missing.length, outFile }, null, 2));
if (!payload.ok) process.exitCode = 1;
