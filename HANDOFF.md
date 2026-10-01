# Genereti handoff — 2026-10-01

## Project and current checkout

- Repository: `/Users/liuboto/dev/genereti`; remote: `https://github.com/languel/genereti.git`.
- Main branch. At the start of this milestone it was based on `c353f9d` (`Add Comfy teaching workflows and projector node`); the real-time renderer experiments in this handoff are the current follow-up changes.
- Genereti is a local real-time image-generation tool for teaching, performance, and creative coding. The complete generator targets macOS 14+ on Apple silicon and runs Core ML models locally. The ComfyUI source nodes documented in `docs/platform-support.md` are the PC-compatible portion.
- The local web app is served at `http://127.0.0.1:8765/` when `./Start-Genereti.command` or `./run.sh` is running. The server binds to loopback; browser camera and screen capture remain user-started.

## Current renderer experiments

This milestone explores Genereti as a composable, real-time NPR renderer. It adds:

- A **Composite · SDXS + Canny** pipeline that runs sketch-guided SDXS and Canny-guided SD-Turbo as separate branches, then blends them using crossfade, screen, multiply, or difference. The branches may use different source images for sketch structure and Canny contours.
- Separate palette-reference transfer using global Lab chroma statistics, plus black/white levels, gamma, emboss, sharpening, learned upscaling, and fast interpolation.
- Resolution selection based on installed packages. The local 512px packages enable SDXS text and sketch. Canny/Turbo composite remains available at 256px because that is where the required packages are installed.
- Optional Core ML Real-ESRGAN AnimeVideo and General 4× packages, installed with `./scripts/download_upscaler.sh` or `./scripts/download_models.sh --with-upscaler`. The download script verifies pinned archive SHA-256 hashes. Model weights and compiled packages remain outside Git.
- Documentation and starter studies in `docs/experiments.md`, with model/package notes in `docs/models.md`.

The measurements in `docs/experiments.md` are from this development Mac and should be read as local observations, not performance guarantees. A composite requires two model passes and runs substantially slower than one branch. The learned upscaler also adds latency. The app reports frame and post-processing metrics so experiments can compare quality against live rate.

## Relevant implementation

- `web/index.html`, `web/app.js`, and `web/style.css`: experiment controls, resolution/model-aware availability, independent image sources, palette reference, post-processing UI, and scene/preset state.
- `server.py`: loopback FastAPI/WebSocket bridge, request validation, resolution switching, guide preprocessing, model inference, and post-processing integration.
- `engine.py`: Core ML inference and the two-branch composite path.
- `postprocess.py`: layer blending, Lab palette transfer, levels, emboss, sharpen, and resampling.
- `coreml_upscaler.py`: lazy Core ML Real-ESRGAN model loading and fixed-size frame inference.
- `scripts/download_upscaler.sh`: checksummed optional model download.
- `tests/test_postprocess.py`: focused unit tests for composite endpoints, palette transfer, levels, and scaling.
- `integrations/`: ComfyUI nodes/workflows, TouchDesigner bridge, and p5 integration.

## Verification for this milestone

- `node --check web/app.js`
- Python bytecode compilation for `server.py`, `engine.py`, `postprocess.py`, `coreml_upscaler.py`, `guides.py`, and `tests/test_postprocess.py`
- Shell syntax checks for `run.sh`, `scripts/download_models.sh`, and `scripts/download_upscaler.sh`
- `git diff --check`
- `python -m unittest discover -s tests -v`: four post-processing tests pass.
- The live API was exercised with 512px text/sketch, independent composite guides and palette references, and Real-ESRGAN output at enlarged dimensions.

## Next useful work

1. Compare saved, named studies for line drawing, watercolor, ink wash, and paper collage. Record the scene metadata and latency with each result.
2. Try live source video and camera movement at 256 and 512px while watching generation FPS and end-to-end latency.
3. Evaluate whether segmentation or shader stages add controllable visual value before broadening the pipeline. Keep segmentation and compositing as optional stages so simple live operation stays responsive.
4. Consider bringing the most useful renderer experiments into Artist–Model Studio or Underscores after the presets and stage behavior are repeatable.

## Setup and data boundaries

Follow `docs/student-quickstart.md`, `docs/models.md`, `scripts/setup_macos.sh`, and `scripts/download_models.sh` for local setup. `AGENTS.md` contains repository constraints. Keep model weights, Core ML packages, compiled model caches, generated captures, and private training data out of Git.
