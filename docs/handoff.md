# Lightweight framework checkpoint

Public Genereti now focuses on realtime creative coding and performance. The private development checkout remains unchanged.

- Supported packs are listed in distribution/manifest.json.
- 26 bundled classroom workflows require no inference models, extra node packs or external generator server. WebGPU is required for GPU textures; audio/capture start explicitly. Optional MIDI/OSC and assistant connections are not prerequisites.
- Inference packs, old standalone web applications, conversion/download scripts and their tests are archived in integrations/legacy-generator, excluded from Registry/student packages. GeneretiCore is the destination for migration and is not yet a working replacement.
- External-generator Send/Receive/Live Preview/Live Generator nodes are no longer registered. Image preview and native output views remain supported.
- Existing user-saved obsolete AI demos are deliberately preserved. They can be removed from Workflows manually; future installs receive only the curated set.
- The canonical workflow path is still integrations/comfyui_genereti/workflows. Sync root example_workflows using scripts/sync_comfy_templates.py.

No model weights or private data were transferred. No Registry version was bumped or published by this cleanup.

## Session checkpoint, 2026-10-27

Work since the lightweight framework checkpoint above. Everything is on `main`; `mediamime` is already an ancestor of `main` (nothing left to merge).

- **Poliplan** (`integrations/genereti_comfy_poliplan`). The optional IMAGE input is a node-level underlay under the transparent editor. It follows pan and zoom and the live source, has a show/hide glyph, and adds nothing to the document or undo. When shown, the IMAGE output is the drawing composited over the input, both at queue time and in live frames (the live composite is rebuilt from the cached drawing, so the editor is not asked to export on every input frame). The vendored editor is upstream 433b027: `export({ format: 'bitmap' })` returns an ImageBitmap, and ink strokes fill one outline. The status line reports `live N fps · export X ms`.
- **top.noise** (`integrations/genereti_comfy_texture`). Algorithms: perlin, simplex, value, hash, worley, voronoi, cracks. Shape (off, ridged, billow, hybrid), domain warp, redistribution power, amplitude, bias, normalize (stretch), seamless loop in seconds (time circles the z–w plane), and RGB / RGBA colour. Shaping, warp, power and normalize default to off, and every parameter has a tooltip. The widget order changed (time, speed and loop now sit before color); saved workflows are re-mapped by name when they load (`genereti_comfy_p5/web/js/offset-control-migration.js`).
- **Performance findings.** Live frame cost is set by the editor's export and by ink length, not image size. Noise cost scales with pixel count, octaves, colour channels, warp, loop (4D) and the cell-based algorithms. The optional stages cost nothing measurable when off. Full numbers are in `docs/texture-operators.md`.
- **Known gaps.** A stroke with Wobble above 0 and closed strokes still use the slower quad-and-disc ink path. Warp is one level, not nested. Hybrid is a plain average of plain and ridged. No random closed curve for the loop (it is a circle). `draftOnly` export (a cached raster of committed strokes, so live frames export only the active stroke) is not requested yet. The noise tutorial is to be revisited later.

Tests at this checkpoint: Node 352 passing, Python 133 passing.
