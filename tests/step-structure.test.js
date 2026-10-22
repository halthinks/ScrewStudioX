'use strict';
const assert = require('node:assert/strict');
const K = require('../src/kernel.js');

const samples = [
  { head: 'pan', drive: 'pz', d: 4, L: 12 },
  { head: 'cheese', drive: 'slot', d: 3, L: 10, helix: true },
  { head: 'hex', drive: 'none', d: 8, L: 30 }
];
for (const config of samples) {
  const spec = K.resolve(config);
  assert.ok(!spec.error, spec.error);
  const mesh = K.buildMesh(spec);
  const step = K.toSTEP(mesh, { id: 'test', name: spec.designation, desc: 'Structural test', file: 'test.step', time: '2026-01-01T00:00:00' });
  assert.ok(step.startsWith('ISO-10303-21;\nHEADER;\n'));
  assert.ok(step.includes("FILE_SCHEMA(('AUTOMOTIVE_DESIGN"));
  assert.ok(step.includes('FACETED_BREP('));
  assert.ok(step.includes('CLOSED_SHELL('));
  assert.ok(step.endsWith('END-ISO-10303-21;\n'));
  const definitions = new Set([...step.matchAll(/^#(\d+)=/gm)].map(m => m[1]));
  const references = [...step.matchAll(/#(\d+)/g)].map(m => m[1]);
  const missing = references.filter(ref => !definitions.has(ref));
  assert.deepEqual(missing, [], 'Undefined STEP entity references for ' + spec.designation);
  const loops = [...step.matchAll(/POLY_LOOP\('',\(([^)]*)\)\)/g)];
  assert.ok(loops.length > 0, 'No STEP polygon faces for ' + spec.designation);
  assert.ok(mesh.idx.length > 0 && Number.isFinite(mesh.volume) && mesh.volume > 0);
}
process.stdout.write('PASS: ' + samples.length + ' structural STEP export cases (not a CAD-import certification)\n');
