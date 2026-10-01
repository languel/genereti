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
