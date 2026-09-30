# Models, downloads, and terms

Genereti checks no weight files into Git. `scripts/download_models.sh` invokes the pinned conversion scripts and writes Core ML packages under `models/<size>/`. It also uses Hugging Face’s local cache for source weights. Storage, conversion time, and model terms are the user’s responsibility.

| Capability | Source | Download/conversion | Notes |
| --- | --- | --- | --- |
| Base text and sketch | [SDXS DreamShaper](https://huggingface.co/IDKiro/sdxs-512-dreamshaper) and its [sketch control model](https://huggingface.co/IDKiro/sdxs-512-dreamshaper-sketch) | `scripts/convert.py` | One-step SDXS pipeline, converted to Core ML on macOS |
| Image remix | [SD-Turbo](https://huggingface.co/stabilityai/sd-turbo) | `scripts/convert_turbo.py` | Separate model family; its license is the Stability AI Community License |
| Canny, depth, pose guides | [SD 2.1 ControlNet Canny](https://huggingface.co/thibaud/controlnet-sd21-canny-diffusers), [Depth](https://huggingface.co/thibaud/controlnet-sd21-depth-diffusers), [OpenPose](https://huggingface.co/thibaud/controlnet-sd21-openposev2-diffusers) | `scripts/convert_controls.py` | Experimental one-step use; guide adherence and quality vary |
| Optional anime style | [SDXS Anime LoRA](https://huggingface.co/IDKiro/SDXS-512-DreamShaper-Anime) | `scripts/convert_anime.py` | Merges the adapter into SDXS before conversion |
| Optional depth preprocessing | [Depth Anything V2 Small](https://huggingface.co/depth-anything/Depth-Anything-V2-Small-hf) | `scripts/prepare_depth.py` | Local guide preprocessor; downloads its own model |
| Browser pose tracking | [MediaPipe Pose Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js) | `scripts/setup_macos.sh` downloads the Lite task file | Runs in the browser; camera use is user initiated |

The download scripts pin model revisions where configured, but each upstream repository may have additional terms or attribution obligations. Review its model card and license before using it in class, a performance, or a redistribution. Base model licenses do not automatically grant rights to adapters or control models.

The source scripts can convert 256, 384, or 512 pixel variants, though the default live setup is 256px. `--with-guides` and `--with-anime` add more packages and download size. Generated model directories and compiled Core ML caches are ignored by Git.
