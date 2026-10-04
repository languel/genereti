# Native Core ML generators

ComfyUI-hosted inference on **macOS 14+ Apple silicon**. No external model server,
CoreMLSuite dependency, or CoreAI format conversion. The external `ꘇ generator`
remains available as a separate comparison path.

Run `scripts/install_comfy.sh` with your Comfy directory, then restart Comfy and
reload the frontend. Models are discovered under `ComfyUI/models/genereti`; the
current local installation symlinks that folder to this repository's ignored
`models/`. Use `scripts/setup_macos.sh` and `scripts/download_models.sh` for setup.
Model sources and licenses are documented in `docs/models.md`.

## Nodes

| Node | Modes | Native packages currently installed |
| --- | --- | --- |
| ꘇ SDXS generator | text, sketch | 256 and 512; base and anime |
| ꘇ SD Turbo generator | image, Canny, depth, pose | 256; base |

Each generator selects its own relative model path, e.g.
`256/unet.mlpackage`, `512/anime_unet.mlpackage`, or
`256/turbo_unet.mlpackage`. The path determines native resolution and style;
there are no loader, pipeline socket, style selector, or resolution override.
Model-directory configuration belongs in setup documentation, not node chrome.
To change the directory, configure ComfyUI’s `genereti_coreml` model folder or
replace the `ComfyUI/models/genereti` symlink. The model selector shows package
paths relative to that folder; symlinks resolve to their existing files. Required
encoder/decoder and guide packages stay beside the denoiser in the existing
Genereti bundle layout. The shared engine currently also requires the base UNet
in each bundle. Menus show only installed compatible modes. Invalid combinations
fail before loading models. A new Flux node needs a real backend integration;
there is no placeholder Flux node.

The generator owns mode, seed, influence, invert, movement and prompt submission.
SD Turbo additionally exposes preprocessing and image-remix strength. Influence
is guide strength (`control_scale` internally). Preprocessing extracts Canny edges
or depth; disable it for a prepared guide. Pose requires an existing guide and
does not start capture. Inversion runs after preprocessing. Strength controls
image remix; guide modes use their one-step schedule. SDXS doesn't expose those
irrelevant controls. Anime is a baked SDXS package variant, not a runtime LoRA.

Movement smoothly rotates seeded noise in Live; zero holds it fixed. Queue renders
one phase. Prompt submission can be live typing or a held draft committed with
the send glyph or Cmd/Ctrl+Enter. Live/Queue and Play/Pause are at the top. Errors
appear there too, with details in the hover tip and browser console.

## Examples

- `ꘇ-p5-SDXS.json`: p5 drawing → SDXS sketch → live image preview.
- `ꘇ-Drawing-SDXS.json`: drawing → SDXS sketch → live image preview.
- `ꘇ-Drawing-SD-Turbo.json`: drawing → SD Turbo Canny → live image preview.

Both live and queue call the same inference code. Live inference uses Comfy's
loopback-only `/genereti/coreml/generate` endpoint, with one inference at a time
and a 429 busy response. Viewers retain live generation automatically; manual
pause sticks. Source delivery pause freezes the stream without disabling editing.
Queue runs through Comfy's Run action. Only the first image of an input batch is
used; transparent inputs composite on white for model inference. Browser drawing
and raw preview remain independent of these macOS-only generators.

Engine caching is shared internally and keyed by model directory and native size;
a loader node is not required for caching. Fixed Core ML residual shapes cannot
be made compatible by merely resizing an image. Upscaling is a separate stage,
not inference at a different native resolution. No weights or captures enter Git.
