#!/usr/bin/env node
'use strict';
// Offline, dependency-free STEP/STL exporter for the browser geometry kernel.
const fs = require('node:fs');
const path = require('node:path');
const K = require('../src/kernel.js');

const HELP = [
  'ScrewStudioX native exporter (faceted AP214 STEP + binary STL)',
  '',
  'Usage:',
  '  node bin/screwstudiox.js --head cap --drive hex --diameter 5 --length 16 --out ./exports',
  '  node bin/screwstudiox.js --head hex --drive none --diameter 8 --pitch 1.25 --length 30 --helix --out ./exports',
  '  node bin/screwstudiox.js --list',
  '',
  'Options:',
  '  --head              cap | button | pan | cheese | csks | cskf | hex',
  '  --drive             hex | torx | ph | pz | slot | none',
  '  --diameter          metric major diameter in mm',
  '  --length            nominal ISO length in mm',
  '  --pitch             metric thread pitch in mm (defaults to coarse)',
  '  --helix             model the helical thread (default: cosmetic)',
  '  --out               output directory; required for generation',
  '  --allow-nonstandard explicitly allow pitch outside the selected fastener standard',
  '  --force             allow replacement of existing output files',
  '  --list              print supported standard/head/drive/diameter combinations',
  '  --help              print this message',
  '',
  'This exports a closed faceted solid, not editable analytic or tolerance-certified CAD.',
  ''
].join('\n');
function parseArgs(args) {
  const values = new Set(['--head', '--drive', '--diameter', '--length', '--pitch', '--out']);
  const toggles = new Set(['--helix', '--allow-nonstandard', '--force', '--list', '--help']);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (toggles.has(flag)) { result[flag] = true; continue; }
    if (!values.has(flag)) throw new RangeError('Unknown argument: ' + flag);
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw new RangeError('Missing value for ' + flag);
    if (result[flag] !== undefined) throw new RangeError('Repeated argument: ' + flag);
    result[flag] = args[++i];
  }
  return result;
}
function listStandards() {
  return Object.entries(K.STD).map(([id, std]) => ({
    standard: id, head: std.head, drives: std.drives,
    diameters_mm: Object.keys(std.data).map(Number)
  }));
}
function stem(spec) {
  const raw = [spec.designStd.replace(/\s/g, ''), 'M' + spec.d, 'P' + spec.P,
    'L' + spec.L, spec.head + '-' + spec.drive, spec.helix ? 'helix' : 'cosmetic'].join('_');
  return raw.replace(/[^A-Za-z0-9._-]/g, '-');
}
function run(args) {
  const flags = parseArgs(args);
  if (flags['--help']) { process.stdout.write(HELP); return; }
  if (flags['--list']) { process.stdout.write(JSON.stringify(listStandards(), null, 2) + '\n'); return; }
  for (const required of ['--head', '--drive', '--diameter', '--length', '--out']) {
    if (!flags[required]) throw new RangeError(required + ' is required. Use --help for examples.');
  }
  const config = {
    head: flags['--head'], drive: flags['--drive'],
    d: Number(flags['--diameter']), L: Number(flags['--length']),
    pitch: flags['--pitch'] === undefined ? undefined : Number(flags['--pitch']),
    helix: !!flags['--helix']
  };
  const model = K.buildValidated(config, { allowNonstandard: !!flags['--allow-nonstandard'] });
  const name = stem(model.spec);
  const out = path.resolve(flags['--out']);
  const metadata = {
    schema: 'screwstudiox.native.v1',
    designation: model.spec.designation,
    source_standard: model.spec.stdId,
    designated_standard: model.spec.designStd,
    configuration: K.validateConfig(config).config,
    topology: model.topology,
    volume_mm3: model.mesh.volume,
    triangle_count: model.mesh.idx.length / 3,
    warnings: model.warnings,
    representation: 'AP214 faceted B-rep STEP; binary STL',
    qualification: 'Geometry topology checked; native CAD import and ISO dimensional tolerances not certified'
  };
  const meta = {
    id: name, name: model.spec.designation, desc: 'ScrewStudioX faceted fastener model',
    file: name + '.step'
  };
  const files = [
    [name + '.step', K.toSTEP(model.mesh, meta)],
    [name + '.stl', Buffer.from(K.toSTL(model.mesh, name))],
    [name + '.json', JSON.stringify(metadata, null, 2) + '\n']
  ];
  if (!flags['--force']) {
    for (const [filename] of files) {
      if (fs.existsSync(path.join(out, filename))) throw new Error('Refusing to overwrite ' + filename + '; use --force.');
    }
  }
  fs.mkdirSync(out, { recursive: true });
  for (const [filename, data] of files) fs.writeFileSync(path.join(out, filename), data, { flag: flags['--force'] ? 'w' : 'wx' });
  process.stdout.write(JSON.stringify({
    designation: metadata.designation, output: files.map(([f]) => path.join(out, f)),
    triangles: metadata.triangle_count, volume_mm3: metadata.volume_mm3, warnings: metadata.warnings
  }, null, 2) + '\n');
}
if (require.main === module) {
  try { run(process.argv.slice(2)); }
  catch (error) { process.stderr.write('ScrewStudioX: ' + error.message + '\n'); process.exitCode = 1; }
}
module.exports = { parseArgs, listStandards, stem, run };
