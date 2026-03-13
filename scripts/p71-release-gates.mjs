// scripts/p71-release-gates.mjs
// P71: production-grade release gates (env parity + CI + smoke + remote system checks).
//
// Usage:
//   npm run qa:p71
//   BASE_URL=https://your-domain.com ADMIN_BASIC_USER=... ADMIN_BASIC_PASS=... npm run qa:p71

import { spawn } from 'node:child_process';

const BASE_URL = (process.env.BASE_URL || '').replace(/\/$/, '');

function run(cmd, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...extraEnv },
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${code}): ${cmd} ${args.join(' ')}`));
    });
  });
}

async function main() {
  console.log('=== KCE P71 Release Gates ===');
  console.log(`[P71] BASE_URL: ${BASE_URL || '(not set)'}`);

  console.log('\n[P71] Step 1/4: env parity (.env.example ↔ env.ts)');
  await run('npm', ['run', 'env:parity']);

  console.log('\n[P71] Step 2/4: qa:ci (lint + types + prettier + qa-gate + build)');
  await run('npm', ['run', 'qa:ci']);

  console.log('\n[P71] Step 3/4: qa:smoke (local production server smoke)');
  await run('npm', ['run', 'qa:smoke']);

  if (BASE_URL) {
    console.log('\n[P71] Step 4/4: verify:e2e (remote gates via /api/admin/system/status)');
    await run('npm', ['run', 'verify:e2e'], { BASE_URL });
  } else {
    console.log('\n[P71] Step 4/4: verify:e2e skipped (set BASE_URL for remote gates).');
  }

  console.log('\n[P71] PASS ✅');
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
