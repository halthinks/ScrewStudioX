'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

const kernel = fs.readFileSync('src/kernel.js', 'utf8').trim();
for (const path of ['index.html', 'src/template.html']) {
  const page = fs.readFileSync(path, 'utf8');
  assert.ok(page.includes('URL.createObjectURL(blob)'), path + ' lacks native browser downloads');
  assert.ok(page.includes("link.download = filename"), path + ' lacks an explicit filename');
  assert.ok(!page.includes('Saving files works when this page is open on claude.ai.'), path + ' still requires Claude');
}
const page = fs.readFileSync('index.html', 'utf8');
assert.ok(page.includes(kernel), 'Built HTML has drifted from src/kernel.js');
process.stdout.write('PASS: standalone browser downloads + inlined kernel parity\n');
