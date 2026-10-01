# Genereti handoff — 2026-10-01

## Project and current checkout

- Repository: `/Users/liuboto/dev/genereti`; remote: `https://github.com/languel/genereti.git`.
- Current branch: `excalidraw-host`, created from main checkpoint `25173b9` (editable canvas, live output and input color/value controls). The sections below retain the renderer history; see the latest workspace milestone first.
- Genereti is a local real-time image-generation tool for teaching, performance, and creative coding. The complete generator targets macOS 14+ on Apple silicon and runs Core ML models locally. The ComfyUI source nodes documented in `docs/platform-support.md` are the PC-compatible portion.
- The local web app is served at `http://127.0.0.1:8765/` when `./Start-Genereti.command` or `./run.sh` is running. The server binds to loopback; browser camera and screen capture remain user-started.

## Latest milestone: Excalidraw is the host

The default `/` page is a single Excalidraw document, not an editor iframe within the old layout. Native Sidebar, a unified icon toolbar in the Footer, and custom embeddable renderers host Genereti. All existing control IDs and event handlers remain active, including model-aware settings, numeric overrides, presets, independent guides, post-processing, captures and scene exports. `/lab.html` preserves the checkpoint's classic page, with its embedded drawing editor. External p5/TouchDesigner/Comfy bridges and generator contracts are unchanged.

Read `docs/excalidraw-host.md` for controls and implementation details. Source selection starts with Shapes. The default input crop uses world coordinates 0,0–512,512; optional Frame input selects a native frame and crops its contents. Live output, external source previews and optional guide previews are runtime embeddables excluded from editable guide export and autosave. Detached output placement, overlay mode and input ordering persist locally. Animation/keyframes and a complete saved workspace layout remain future work.

Verification: rebuilt the local editor bundle; 21 Python tests passed; browser exercised live generation with the sidebar hidden, sidebar reopen, demo/file/vector source switching, preset save/delete, drawing download/reopen, PNG download and scene ZIP download. PNG metadata was read with Pillow after loading pixels; the ZIP contained source, outcome, guide, metadata and an editable drawing with no runtime preview elements. Both default host and classic iframe page loaded without page errors in the final check. Camera/screen permission prompts were not exercised.

Files: `web/index.html`, `web/host-bootstrap.js`, `web/host.css`, `editor/index.jsx`, `web/drawing-bridge.js`, `web/app.js`, locally rebuilt `web/vendor/excalidraw/editor.js`, and `web/lab.html`. Rebuild after editor changes with `npm ci && npm run build:editor`. The server serves these files directly, so frontend changes do not require a model restart.

## Current renderer experiments

This milestone explores Genereti as a composable, real-time NPR renderer. It adds:

- A **Composite · SDXS + Canny** pipeline that runs sketch-guided SDXS and Canny-guided SD-Turbo as separate branches, then blends them using crossfade, screen, multiply, or difference. The branches may use different source images for sketch structure and Canny contours.
- Independent guide-polarity switches for SDXS sketch, Canny, depth, and pose; composite mode can invert the sketch and Canny branches separately.
- An emboss-first finish stack, followed by palette-reference transfer using global Lab chroma statistics, black/white levels, gamma, brightness, contrast, saturation, learned upscaling, sharpening, and fast interpolation.
- A controlled Real-ESRGAN feedback loop: run 1–4 learned upscales, downsample each intermediate result to generation size, then blend it with the original pre-upscaler frame before the next pass. Final output can stay at source size, use 2×, or use native 4× dimensions.
- Resolution selection based on installed packages. The local 512px packages enable SDXS text and sketch. Canny/Turbo composite remains available at 256px because that is where the required packages are installed.
- Optional Core ML Real-ESRGAN AnimeVideo and General 4× packages, installed with `./scripts/download_upscaler.sh` or `./scripts/download_models.sh --with-upscaler`. The download script verifies pinned archive SHA-256 hashes. Model weights and compiled packages remain outside Git.
- Documentation and starter studies in `docs/experiments.md`, with model/package notes in `docs/models.md`.

The measurements in `docs/experiments.md` are from this development Mac and should be read as local observations, not performance guarantees. A composite requires two model passes and runs substantially slower than one branch. The learned upscaler also adds latency. The app reports frame and post-processing metrics so experiments can compare quality against live rate.

## Relevant implementation

- `web/index.html`, `web/app.js`, and `web/style.css`: experiment controls, resolution/model-aware availability, independent image sources, palette reference, post-processing UI, and scene/preset state.
- `server.py`: loopback FastAPI/WebSocket bridge, request validation, resolution switching, guide preprocessing, model inference, and post-processing integration.
- `engine.py`: Core ML inference and the two-branch composite path.
- `postprocess.py`: layer blending, emboss-first finishing, Lab palette transfer, levels/BCS controls, recursive learned upscaling, sharpening, and resampling.
- `coreml_upscaler.py`: lazy Core ML Real-ESRGAN model loading and fixed-size frame inference.
- `scripts/download_upscaler.sh`: checksummed optional model download.
- `tests/test_postprocess.py` and `tests/test_guides.py` / `tests/test_server_guides.py`: unit coverage for post-processing and guide inversion routing.
- `integrations/`: ComfyUI nodes/workflows, TouchDesigner bridge, and p5 integration.

## Verification for this milestone

- `node --check web/app.js`
- Python bytecode compilation for `server.py`, `engine.py`, `postprocess.py`, `coreml_upscaler.py`, `guides.py`, and `tests/test_postprocess.py`
- Shell syntax checks for `run.sh`, `scripts/download_models.sh`, and `scripts/download_upscaler.sh`
- `git diff --check`
- `.venv/bin/python -m unittest discover -s tests -v`: twelve tests pass, including post-processing feedback, BCS, emboss order, and independent guide inversion.
- Playwright CLI checks passed on desktop and a 390 × 844 viewport: selecting a learned upscaler reveals its loop controls, editable parameters and saved presets retain the settings, and the browser console reports no errors.
- The live API was exercised with 512px text/sketch, independent composite guides and palette references, and Real-ESRGAN output at enlarged dimensions.

## Next useful work

1. Compare saved, named studies for line drawing, watercolor, ink wash, and paper collage. Record the scene metadata and latency with each result.
2. Try live source video and camera movement at 256 and 512px while watching generation FPS and end-to-end latency.
3. Evaluate whether segmentation or shader stages add controllable visual value before broadening the pipeline. Keep segmentation and compositing as optional stages so simple live operation stays responsive.
4. Consider bringing the most useful renderer experiments into Artist–Model Studio or Underscores after the presets and stage behavior are repeatable.

## Setup and data boundaries

Follow `docs/student-quickstart.md`, `docs/models.md`, `scripts/setup_macos.sh`, and `scripts/download_models.sh` for local setup. `AGENTS.md` contains repository constraints. Keep model weights, Core ML packages, compiled model caches, generated captures, and private training data out of Git.

## October 1: SDXS residual guide mixer

Implemented `sdxs_mixer` with independently weighted sketch/RGB, high-resolution Canny edges, cached CPU Depth Anything, and optional uploaded pose guides. All controller evaluations use the released SDXS sketch weights, sum residuals, then run one SDXS denoiser. This is experimental guide transfer, not the paper's separately trained Canny/depth controllers. UI supports both 256/512, base/Anime, independent inversion, thresholds, thickness, presets and scene metadata. New `scripts/convert_sdxs_mixer.py` and `download_models.sh --with-sdxs-mixer`; generated models stay ignored. Exported and tested base/Anime mixers at 256/512, added original Anime packages at 512. 384 is script-supported but uninstalled/unbenchmarked. Docs/model-size catalog in `docs/models.md`, usage in `docs/experiments.md`. Tests: 16 pass; real browser generated 512 mixer frames and verified saved preset plus ZIP/PNG metadata. Synthetic benchmark artifacts live in ignored `artifacts/sdxs-mixer/`; not evidence of exact face/identity preservation on user images. Included in the SDXS mixer and frame-recovery milestone; see Git history. Server restarted at usual 256 default.

## October 1: recoverable frames and Motion explanation

Frame errors now keep last image and the live intent, suspend repeat invalid requests, and resume when controls change. Busy/loading errors back off; internal Runtime.generate exceptions become HTTP/WebSocket frame errors without setting fatal runtime state. Added same-socket validation recovery and failed-worker/last-frame preservation tests (18 total pass). Documented teal/gold/black relief study, exact Motion equation, frame-driven periodicity and proposed latent keyframes in docs/experiments.md. Result metrics expose noise_phase and noise_target_seed. No latent-keyframe transport or separate target seed UI implemented.

Final recovery check: real browser held its frame at missing-pose validation, kept running=true, and resumed frame advancement after setting pose weight to zero. Server running with the user's current 512px resolution. Repository milestone includes mixer, size catalog, setup scripts, Motion explanation and frame recovery; generated weights/captures excluded.

## October 1: editable Excalidraw input

Added Input → Shapes · Excalidraw with native editable paths/shapes/text/images, a fixed world-space 512px artboard and expanded editor beside generated output. Locally bundled Excalidraw 0.18.1/React assets and fonts under web/vendor/excalidraw; no CDN dependency. Source editor/index.jsx, scripts/build_editor.mjs, parent web/drawing-bridge.js. npm ci && npm run build:editor rebuilds the checked-in assets. Pinned dependencies/overrides; npm audit reports zero vulnerabilities at this checkpoint.

IndexedDB restores the local drawing. Open/Save drawing uses standard .excalidraw files; Save scene ZIP includes drawing.excalidraw. PNG/scene metadata embeds the vector snapshot paired with its raster, preserving IDs and geometry for future keyframes. window.genereti.drawing.getScene/loadScene/fit provides a small same-origin bridge. Timeline/interpolation is not implemented. Documentation: docs/drawing-editor.md.

Update while drawing defaults on: 33ms throttled raster exports during pointer gestures. Off holds input until release (nonpointer changes still update). Browser check observed six guide exports before mouse release when on; zero during dragging then one after release when off. Native S/G palettes and Shift+Alt+D editor theme work with iframe-wide keyboard handling, including after toolbar focus; explicit Stroke/Fill/theme buttons provided. Empty selection requires a shape or active drawing tool for color palettes. Dark editor appearance does not invert exported guide pixels.

Verified live 512px SDXS mixer output from editor input, shape translation/rotation/color with stable ID, browser autosave restore, editable vector data in ZIP/PNG metadata, locally loaded editor resources, and the live-update toggle. Existing 18 backend tests pass. Server remains on port 8765 at 512px; generated captures are ignored. Changes for this editor milestone are not yet committed/pushed.

## October 1: spatial input colors and robust palettes

Added Post-processing Follow input colors (source_color_strength 0–1) and Color spread (source_color_spread, 512px-relative blur). Uses original input before guide preprocessing/inversion; transfers spatial Lab chroma while preserving generated luminance, after palette-reference transfer and before levels/BCS/upscaling. Not trained color conditioning or semantic filling. Defaults off; saved in presets/metadata. docs/drawing-editor.md includes usage/limits. Added spatial blue/gold and shading preservation test (19 backend tests pass).

Fixed Excalidraw palettes in compact/mobile layout: open shape menu as well as popup. Empty selection activates freehand for next-stroke colors; selected shapes keep their editing context. Native S/G handling is intercepted only outside text fields and existing palette; Shift+Alt+D supported. Parent forwards these shortcuts after Genereti button focus; iframe checks trusted same-origin parent messages. Tested empty-selection Stroke/Fill buttons and S after expand/close. Server restarted at 512px on port 8765; user live producer can cause 429 busy responses in separate QA browser.

Live browser eventually acquired the generator and completed editor-input frames with source_color_strength=0.8 and source_color_spread=8 in result metrics. Separate QA producer paused/closed after verification.

## Input colors/shading refinement

Color following now ignores neutral white/gray/black source pixels instead of desaturating generated watercolor across unpainted areas. Normalized weighted chroma blur spreads colored marks locally. Added independent Follow input shading (source_value_strength), which shifts low-frequency Lab luminance toward input values while preserving high-frequency generated detail. Color / shading spread is shared. These remain output treatments, not semantic fill or trained lighting. Source value/color settings saved in presets and metadata; see docs/drawing-editor.md. Regression checks cover neutral-source preservation and broad value changes with retained fine texture.

## Live output on Excalidraw canvas

Added Output in canvas footer mode with native Generated frame and native embeddable element using renderEmbeddable for live results. Parent caches/forwards output data through DrawingBridge; no per-frame file accumulation. Expanded canvas fills viewport and hides separate result panel. Input export/scene serialization filters customData.generetiOutput elements, preventing output feedback or huge snapshots. Mode remembered locally; moved output geometry retained during current session, not reload. Stable initializeEditor callback avoids restoring/refitting on each React live update. Internal live-output hyperlink UI hidden; no external page loaded. Verified live result rendered, native element selected/moved, and output interaction left input raster unchanged. docs/drawing-editor.md updated.

### Frame input and painting below output

The Excalidraw host now has a toolbar Draw over output button and Output view controls for input above/below output, frame input and native frame selection. Below hides the raw marks while retaining pointer input and model guidance. Frame input crops editable shapes/images and combines a transparent drawing layer with an external live source. Overlay follows selected frame geometry. The sidebar stays open during canvas interaction and closes only explicitly. See docs/excalidraw-host.md for controls and verification limits. Rebuild editor source using npm run build:editor.

### Browser performance pass

Performance sidebar details and window.genereti.performance snapshot/reset expose bounded mean/P95 timings, long tasks, output/export counts and server-busy retries. Live preview images now update directly without React host rerenders. Steady editable input encoding is cached; hidden guide previews are not returned/decoded; drawing raster exports are rate limited and skipped in external source-only mode. docs/excalidraw-host.md records 256px measurement scope. Backend/model files were unchanged. A separate producer was active during later browser checks; do not run competing producers for benchmarks.

### Prompt submission checkpoint

Prompt A/B edits remain drafts until Cmd+Enter, Ctrl+Enter or the apply icon. Live prompt is an opt-in toggle, remembered locally and off by default. Presets and window.genereti.setPrompt apply immediately. Generated metadata records applied text rather than drafts. Browser checks intercepted outgoing requests: typing retained the previous prompt, Cmd+Enter applied the draft, and Live prompt applied Prompt B edits. No real generation was needed for this check.

The user's later 10 FPS report was traced to post-processing settings, not an additional confirmed Excalidraw regression. Use the Performance post-processing row and compare identical model size, upscaler/pass count and request limit before interpreting frame rates.
