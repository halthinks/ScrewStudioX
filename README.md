# ScrewStudioX — ISO Screw Studio

An offline-capable ISO metric fastener geometry engine and single-page screw configurator.
Choose a head, drive, diameter, pitch and length to view dimensioned drawings and a
3D preview, then export a binary STL and an AP214 **faceted** STEP model.

This fork preserves the original Screw Studio work by
[@underdogbuilder](https://www.instagram.com/underdogbuilder/), and adds
standalone browser downloads, a dependency-free native Node.js interface,
input validation, and fail-on-error regression checks.

## Try the browser studio

Open [index.html](index.html) locally, or serve the repository as a static site:

~~~sh
python3 -m http.server 8000
# Open http://localhost:8000
~~~

ZIP (STEP + STL) and SVG drawing downloads use the browser's built-in download
capability. No Claude account or special host API is required. The 3D viewer
uses Three.js r128 from cdnjs and therefore requires network access to load
that dependency; geometry generation and file export are local.

## Native/offline integration

Node.js 20+ is sufficient. There are no npm dependencies or cloud services.

~~~sh
node bin/screwstudiox.js --list
node bin/screwstudiox.js --head cap --drive hex --diameter 5 --length 16 --out ./exports
node bin/screwstudiox.js --head hex --drive none --diameter 8 --length 30 --helix --out ./exports
npm test
~~~

The native command produces three files per configuration:

- AP214 **faceted** STEP representation;
- Binary STL mesh;
- JSON metadata with standard, normalized configuration, manifold metrics,
  volume, warnings and a clear qualification statement.

It validates sizes, nominal lengths and pitches, refuses unsupported selections,
and refuses accidental overwrites. Non-standard fine-pitch combinations require
explicit `--allow-nonstandard`; replacing an existing export requires `--force`.
Use `--help` for all options.

The same engine is available to Node integrations:

~~~js
const K = require('./src/kernel.js');
const part = K.buildValidated({ head: 'cap', drive: 'hex', d: 5, L: 16 });
const step = K.toSTEP(part.mesh, {
  id: 'fastener-M5', name: part.spec.designation,
  desc: 'Faceted fastener geometry', file: 'fastener-M5.step'
});
const stl = K.toSTL(part.mesh, part.spec.designation);
~~~

See [Native integration contract](docs/NATIVE_INTEGRATION.md) for adapter guidance.

## ISO coverage

| Head | Hex socket | Torx | Phillips / Pozidriv | Slot |
|---|---|---|---|---|
| Socket cap | ISO 4762 | ISO 14579 | | |
| Button | ISO 7380-1 | | | |
| Pan | | ISO 14583 | ISO 7045 | ISO 1580 |
| Cheese | | ISO 14580 | | ISO 1207 |
| Countersunk socket | ISO 10642 | | | |
| Countersunk flat | | ISO 14581 | ISO 7046-1 | ISO 2009 |
| Hex head | ISO 4017 | | | |

Diameters M1.6–M12 are covered where the selected standard provides data.
Pitch data follows ISO 261; nominal lengths are selected from ISO 888.
Some supported fine pitches are **not** designated by the selected fastener
standard. Native callers must opt in to such combinations.

## Architecture and tests

- `src/kernel.js`: shared JavaScript geometry kernel, mesh and export writers,
  validation API; usable through `require()` or `window.ScrewKit`.
- `index.html`: ready-to-serve single-page studio, with the kernel inlined.
- `src/template.html`: source UI template; `src/apple.css` and
  `src/body.html` are additional presentation sources.
- `bin/screwstudiox.js`: Node CLI for independent exports.
- `tests/`: 1,040 manifold/orientation/volume cases, STEP entity reference
  checks, native validation and standalone-download checks.

~~~sh
npm test
~~~

Tests now exit nonzero on failed assertions and do not write STEP/STL artifacts
into the working tree.

## Engineering qualification boundaries

The STEP exporter creates a triangulated/faceted B-rep representation, **not**
editable analytic cylinders/threads. The geometry is useful for visualization,
reference assemblies and preliminary mechanical integration, but passing
manifold tests does **not** establish correct ISO tolerances, physical
manufacturability, dimensional inspection or native FreeCAD/OCCT import
acceptance. Validate on the target CAD kernel and supplier datasheets before
promoting parts to manufacturing BOM authority.

**Licensing:** The upstream project did not include an explicit LICENSE at
the time of this fork. Attribution is retained; do not assume a permissive
redistribution or commercial-use license. Obtain clarification from the
original copyright holder before transferring code into another product.

## Original project

Created by [@underdogbuilder](https://www.instagram.com/underdogbuilder/).
Original upstream: [adarshmalpeddiwar-beep/ScrewStudio](https://github.com/adarshmalpeddiwar-beep/ScrewStudio).
