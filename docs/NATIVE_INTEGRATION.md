# ScrewStudioX native fastener capability — integration contract

## Purpose

ScrewStudioX is a dependency-free fastener **geometry candidate** producer.
It can supply VibeMechanica assemblies and TextPCB enclosure and mounting
workflows without a hosted CAD service. It is **not** a released supplier part
catalog or an ISO tolerance authority.

## API

Use `require('./src/kernel.js')` in Node.js 20+ or
`window.ScrewKit` in a browser.

1. `validateConfig(input)` returns
   `{valid, standardCompliant, errors, warnings, stdId, config}`.
2. `buildValidated(input, {allowNonstandard: false})` returns
   `{spec, mesh, topology, warnings}`. Invalid ISO size/pitch/length
   selections throw `RangeError`. Non-designated fine pitches throw unless
   callers explicitly opt in. Every accepted result must have a finite
   positive volume and a closed, oriented edge-manifold surface.
3. `toSTEP(mesh, {id, name, desc, file, time?})` returns an ISO 10303-21
   AP214 **faceted** B-rep string.
4. `toSTL(mesh, name)` returns a binary STL `ArrayBuffer`.
5. `makeZip(files)` returns a browser-compatible ZIP `Blob`.

Normalized input shape:

~~~json
{
  "head": "cap",
  "drive": "hex",
  "d": 5,
  "L": 16,
  "pitch": 0.8,
  "helix": false
}
~~~

Units are millimetres, volume is mm³, and the origin is on the screw axis at
the length-reference plane. Positive Z points toward the head.

## Recommended integration boundary

TextPCB/VibeMechanica should invoke this library in an isolated component
adapter and persist:

- the requested and normalized configuration;
- selected ISO designation and non-standard warnings;
- source revision and generated artifact hashes;
- mesh topology evidence and native-CAD import status;
- supplier/tolerance evidence separately from geometry.

A geometry export is **CANDIDATE**, not `MANUFACTURING_VERIFIED`.
No automatic acceptance should be inferred from `FACETED_BREP` or a
zero-count manifold report. Native CAD load, solid validity, dimensions and
manufacturing tolerances require independent verification.

## Next qualification gates

1. Import representative STEP outputs into installed FreeCAD/OCCT and inspect
   closed-solid classification, topology, units, axis and bounding boxes.
2. Compare nominal dimensions to current licensed standards and representative
   supplier drawings, including head geometry, recess and thread profiles.
3. Implement true analytic/parametric B-rep generation where editable CAD
   geometry is required; do not relabel faceted geometry as analytic.
4. Resolve the upstream copyright/license before embedding the codebase in a
   second distributable product.
5. Only then add a TextPCB and VibeMechanica native adapter with explicit
   evidence levels and deterministic part identity.

No external CAD or cloud service is required for the existing geometry
generation and file export, but the native-CAD import qualification gate is
**not yet proven** by this repository's tests.
