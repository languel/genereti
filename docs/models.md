# Models, downloads, and terms

Genereti checks no weight files into Git. `scripts/download_models.sh` invokes the pinned conversion scripts and writes Core ML packages under `models/<size>/`. It also uses Hugging Face’s local cache for source weights. Storage, conversion time, and model terms are the user’s responsibility.

| Capability | Source | Download/conversion | Notes |
| --- | --- | --- | --- |
| Base text and sketch | [SDXS DreamShaper](https://huggingface.co/IDKiro/sdxs-512-dreamshaper) and its [sketch control model](https://huggingface.co/IDKiro/sdxs-512-dreamshaper-sketch) | `scripts/convert.py` | One-step SDXS pipeline, converted to Core ML on macOS |
| Image remix | [SD-Turbo](https://huggingface.co/stabilityai/sd-turbo) | `scripts/convert_turbo.py` | Separate model family; its license is the Stability AI Community License |
| Canny, depth, pose guides | [SD 2.1 ControlNet Canny](https://huggingface.co/thibaud/controlnet-sd21-canny-diffusers), [Depth](https://huggingface.co/thibaud/controlnet-sd21-depth-diffusers), [OpenPose](https://huggingface.co/thibaud/controlnet-sd21-openposev2-diffusers) | `scripts/convert_controls.py` | Experimental one-step use; guide adherence and quality vary |
| Optional anime style | [SDXS Anime LoRA](https://huggingface.co/IDKiro/SDXS-512-DreamShaper-Anime) | `scripts/convert_anime.py` | Merges the adapter into SDXS before conversion |
| Learned 4× upscaling | [Real-ESRGAN Core ML](https://github.com/hanxiao/real-esrgan-coreml) (`animevideo`, `general`) | `scripts/download_upscaler.sh` or `scripts/download_models.sh --with-upscaler` | Optional preconverted Core ML packages; the video model is tuned for stylized moving images, general is broader |
| Optional depth preprocessing | [Depth Anything V2 Small](https://huggingface.co/depth-anything/Depth-Anything-V2-Small-hf) | `scripts/prepare_depth.py` | Current app preprocessor runs the Transformers model locally on CPU. Apple also publishes an [F16 Core ML Depth Anything V2 Small package](https://huggingface.co/apple/coreml-depth-anything-v2-small); it is not yet wired into Genereti. |
| Browser pose tracking | [MediaPipe Pose Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js) | `scripts/setup_macos.sh` downloads the Lite task file | Runs in the browser; camera use is user initiated |

The download scripts pin model revisions where configured, but each upstream repository may have additional terms or attribution obligations. Review its model card and license before using it in class, a performance, or a redistribution. Base model licenses do not automatically grant rights to adapters or control models.

The Real-ESRGAN Core ML packages are pinned to the upstream v1.0.0 release and checked against SHA-256 hashes by the downloader. The wrapper uses their fixed 522px Core ML input to produce 4× output. The upstream project lists its wrapper as MIT and Real-ESRGAN weights as BSD-3-Clause. Its README reports 20ms (`animevideo`) and 30ms (`general`) per 512×512 input on an M3 Ultra; that is the upstream benchmark, not a Genereti measurement. Actual latency on this Mac is recorded in Genereti's per-frame post-processing metrics.

The source scripts can convert 256, 384, or 512 pixel variants, though the default live setup is 256px. Add `--with-guides` and `--with-anime` to include optional model packages; these increase download, conversion, storage, and startup time. Generated model directories and compiled Core ML caches are ignored by Git.

The web app offers a resolution when its SDXS text model, encoder, and decoder packages exist locally. Other pipelines appear only when their required packages exist at that same resolution. For example, an SDXS-only `models/512/` folder enables 512px text and sketch, while the Canny/Turbo composite remains limited to a size that also contains SD-Turbo and Canny ControlNet packages. Switch back to that size for the unavailable pipelines.

## Resolution and model-size catalog

There are three different kinds of size: generation resolution, weight/package storage, and final exported image dimensions. A `models/512/` folder is a fixed-shape conversion of the same SDXS DreamShaper weights as `models/256/`; it is not a larger or newer model. SDXS DreamShaper was released for 512px generation. Genereti's 256 and 384 variants reduce its spatial working size for speed. The [paper](https://arxiv.org/abs/2403.16627) also describes SDXS-1024, but it is not included in Genereti; the [official public release](https://github.com/IDKiro/sdxs) lists the DreamShaper 512 family, sketch controller, anime adapter and older 512-0.9 model.

Local installation audited October 1, 2026:

| Generation size | Latent grid | Installed pipelines on this Mac | Status |
| --- | --- | --- | --- |
| 256 × 256 | 32 × 32 | SDXS text, sketch, Anime; SDXS guide mixer; SD-Turbo image remix; SD2.1 Canny/depth/pose through Turbo; SDXS/Turbo output composite | Default live size; smallest facial features can disappear |
| 384 × 384 | 48 × 48 | None currently | Conversion scripts support it, including the SDXS mixer; speed/detail compromise, unbenchmarked here |
| 512 × 512 | 64 × 64 | SDXS text, sketch, Anime, SDXS guide mixer | Best installed SDXS spatial detail; Turbo/control/composite packages not installed at this size |
| 1024 × 1024 | — | None | Not a supported generator size; do not confuse upscaled output with SDXS-1024 |

These entries describe **this checkout's installed assets**, not downloads included in Git. Availability is detected per resolution. Anime at 512px was added during the mixer experiment. Other installations can have different assets.

Representative FP16 Core ML package sizes measured locally (both 256 and 512 conversions have essentially the same weight sizes):

| Package | Storage | Purpose |
| --- | --- | --- |
| `unet` / `anime_unet` | ~603 MiB each | SDXS denoiser; Anime merges the LoRA into a separate copy |
| `controlled_unet` / `anime_controlled_unet` | ~959 MiB each | Fused SDXS sketch controller + denoiser |
| `sdxs_sketch_control` | ~356 MiB | Released sketch controller exported separately for the mixer |
| `sdxs_residual_unet` / `anime_sdxs_residual_unet` | ~603 MiB each | SDXS denoiser with external residual inputs |
| `encoder`, `decoder` | ~2.4 MiB each | Lightweight latent/image conversion |
| `turbo_unet` | ~1,652 MiB | Separate SD-Turbo denoiser |
| `control_canny` | ~695 MiB | SD2.1 Canny controller for Turbo; not compatible with SDXS |

Compiled Core ML caches and Hugging Face source weights add substantial storage beyond those package sizes. Higher resolution increases activation memory and compute rather than doubling the weights. No package-size number here is a RAM requirement.

### SDXS guide mixer installation

```sh
./scripts/download_models.sh --size 512 --with-anime --with-sdxs-mixer
# Optional intermediate resolution:
./scripts/download_models.sh --size 384 --with-anime --with-sdxs-mixer
# Already downloaded the base and sketch weights? Export only the mixer:
.venv/bin/python scripts/convert_sdxs_mixer.py --size 256 --with-anime
.venv/bin/python scripts/prepare_depth.py
```

The mixer is **experimental transfer through the released sketch weights**. It runs that controller for each active image/edge/depth/pose guide, sums weighted residuals, then runs one SDXS denoiser and decoder. It does not contain dedicated SDXS Canny/depth/pose-trained checkpoints. The paper's trained Canny/depth examples cannot be reproduced faithfully from the public sketch checkpoint alone. The authors state their training code is not released; this implementation does not claim to supply those missing models. ControlNet-XS is a different project and is not an SDXS-compatible drop-in.

Warm Core ML generator timings on this M5 Max, one fixed synthetic character and prompt, October 1, 2026 (single warm sample, no post-processing or changing-frame depth preprocessing):

| SDXS residual mixer | 256px Base / Anime | 512px Base / Anime |
| --- | --- | --- |
| Image/sketch + detail edges | 31.6 / 31.2 ms | 57.8 / 60.4 ms |
| Image/sketch + detail edges + depth | 36.8 / 35.0 ms | 71.6 / 70.1 ms |

These are generator measurements, not guaranteed browser FPS. Depth Anything currently runs on CPU; changing frames pay its preprocessing cost. An identical static input reuses the last depth estimate. More active guides require more controller passes, even though there is only one denoiser pass. First use also loads/compiles models. Single-guide parity with the fused sketch path differed by ~0.12–0.19 mean channel values on the 0–255 scale in this test, consistent with FP16 graph changes.

### Output/upscaler sizes

Real-ESRGAN uses fixed 522px model input with padded/tiled handling in Genereti. Its 4× output is resized according to **AI output size** (source, 2×, or 4×), then **Extra output scale** applies another 1×/2×/4× interpolation. For example, native 512px generation → AI 4× gives 2048px; an additional 2× interpolation gives 4096px. Recursive upscaler passes return to the generator resolution between passes. They alter texture and smoothing without increasing native diffusion detail or the model parameter count.
