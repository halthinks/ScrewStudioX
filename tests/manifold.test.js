'use strict';
const assert = require('node:assert/strict');
const K = require('../src/kernel.js');

let cases = 0;
for (const [standard, S] of Object.entries(K.STD)) {
  for (const drive of S.drives) {
    for (const d of Object.keys(S.data).map(Number)) {
      const lengths = K.lengthsFor(standard, d);
      assert.ok(lengths.length, standard + ' M' + d + ' has no valid ISO 888 lengths');
      for (const L of [lengths[0], lengths[lengths.length - 1]]) {
        for (const helix of [false, true]) {
          for (const pitch of [K.COARSE[d], K.FINE[d][0]]) {
            const config = { head: S.head, drive, d, L, pitch, helix };
            const spec = K.resolve(config);
            assert.ok(!spec.error, JSON.stringify(config) + ': ' + spec.error);
            const mesh = K.buildMesh(spec), topology = K.checkManifold(mesh);
            assert.equal(topology.nonManifold, 0, JSON.stringify(config) + ': open/nonmanifold mesh');
            assert.equal(topology.misoriented, 0, JSON.stringify(config) + ': misoriented mesh');
            assert.ok(Number.isFinite(mesh.volume) && mesh.volume > 0, JSON.stringify(config) + ': invalid volume');
            cases++;
          }
        }
      }
    }
  }
}
assert.equal(cases, 1040, 'ISO coverage changed; inspect the expected matrix');
process.stdout.write('PASS: ' + cases + ' manifold + orientation + volume cases\n');
