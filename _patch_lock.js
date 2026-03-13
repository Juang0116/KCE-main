const fs = require('fs');
const p = 'package-lock.json';
const j = JSON.parse(fs.readFileSync(p, 'utf8'));

if (j.packages && j.packages[''] && j.packages[''].devDependencies) {
  j.packages[''].devDependencies.typescript = '5.5.4';
}

if (j.packages && j.packages['node_modules/typescript']) {
  j.packages['node_modules/typescript'].version = '5.5.4';
  delete j.packages['node_modules/typescript'].resolved;
  delete j.packages['node_modules/typescript'].integrity;
}

if (j.dependencies && j.dependencies.typescript) {
  j.dependencies.typescript.version = '5.5.4';
  delete j.dependencies.typescript.resolved;
  delete j.dependencies.typescript.integrity;
}

fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
console.log('patched package-lock typescript -> 5.5.4 (cleared resolved/integrity)');
