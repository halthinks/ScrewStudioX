'use strict';
const assert = require('node:assert/strict');
const K = require('../src/kernel.js');
const { parseArgs, listStandards, stem } = require('../bin/screwstudiox.js');

assert.equal(listStandards().length, 13);
assert.equal(parseArgs(['--head', 'cap', '--helix'])['--head'], 'cap');
assert.throws(() => parseArgs(['--mystery']), /Unknown argument/);
assert.throws(() => parseArgs(['--diameter']), /Missing value/);

const c = { head: 'cap', drive: 'hex', d: 5, L: 16, helix: false };
assert.equal(K.validateConfig(c).valid, true);
assert.equal(K.validateConfig(c).standardCompliant, true);
for (const bad of [
  { ...c, head: 'missing' },
  { ...c, drive: 'pz' },
  { ...c, d: 99 },
  { ...c, pitch: 3 },
  { ...c, L: 999 },
  { ...c, L: -1 },
  { ...c, helix: 'true' }
]) {
  assert.equal(K.validateConfig(bad).valid, false, JSON.stringify(bad));
  assert.throws(() => K.buildValidated(bad), RangeError);
}
const fine = { ...c, pitch: 0.5 };
assert.equal(K.validateConfig(fine).valid, true);
assert.equal(K.validateConfig(fine).standardCompliant, false);
assert.throws(() => K.buildValidated(fine), /allowNonstandard/);
assert.equal(K.buildValidated(fine, { allowNonstandard: true }).warnings.length, 1);

const model = K.buildValidated(c);
assert.equal(model.topology.nonManifold, 0);
assert.equal(model.topology.misoriented, 0);
assert.ok(model.mesh.volume > 0);
const buffer = K.toSTL(model.mesh, stem(model.spec));
assert.equal(new DataView(buffer).getUint32(80, true), model.mesh.idx.length / 3);
assert.equal(buffer.byteLength, 84 + (model.mesh.idx.length / 3) * 50);

const zip = K.makeZip([{ name: 'hello.txt', data: new TextEncoder().encode('hello') }]);
Promise.resolve(zip).then(blob => {
  assert.equal(blob.type, 'application/zip');
  assert.ok(blob.size > 50);
  process.stdout.write('PASS: native API, input validation, STL, ZIP\n');
}).catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; });
