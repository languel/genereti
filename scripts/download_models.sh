#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
SIZE="${GENERETI_SIZE:-256}"
GUIDES=0
ANIME=0
UPSCALER=0
SDXS_MIXER=0
while (($#)); do
  case "$1" in
    --size) SIZE="${2:?--size needs 256, 384, or 512}"; shift 2 ;;
    --with-guides) GUIDES=1; shift ;;
    --with-anime) ANIME=1; shift ;;
    --with-sdxs-mixer) SDXS_MIXER=1; shift ;;
    --with-upscaler) UPSCALER=1; shift ;;
    -h|--help)
      echo "Usage: scripts/download_models.sh [--size 256|384|512] [--with-guides] [--with-anime] [--with-upscaler] [--with-sdxs-mixer]"
      exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done
case "$SIZE" in 256|384|512) ;; *) echo "Size must be 256, 384, or 512." >&2; exit 2 ;; esac
[[ -x .venv/bin/python ]] || { echo "Run ./scripts/setup_macos.sh first." >&2; exit 1; }
[[ "$(uname -s)" == Darwin && "$(uname -m)" == arm64 ]] || { echo "Core ML conversion requires Apple silicon macOS." >&2; exit 1; }
export HF_HUB_DISABLE_TELEMETRY=1 TOKENIZERS_PARALLELISM=false
export GENERETI_SIZE="$SIZE"
echo "Downloading source weights and converting Genereti's ${SIZE}px Core ML models. No weights are added to Git."
.venv/bin/python scripts/convert.py --size "$SIZE"
.venv/bin/python scripts/convert.py --size "$SIZE" --control
.venv/bin/python scripts/convert_turbo.py --size "$SIZE"
if ((GUIDES)); then
  .venv/bin/python scripts/convert_controls.py --size "$SIZE" --guides canny depth pose
  .venv/bin/python scripts/prepare_depth.py
fi
if ((ANIME)); then .venv/bin/python scripts/convert_anime.py --size "$SIZE"; fi
if ((SDXS_MIXER)); then
  .venv/bin/python scripts/convert_sdxs_mixer.py --size "$SIZE"
  if ((ANIME)); then .venv/bin/python scripts/convert_sdxs_mixer.py --size "$SIZE" --with-anime; fi
  .venv/bin/python scripts/prepare_depth.py
fi
if ((UPSCALER)); then ./scripts/download_upscaler.sh; fi
echo "Models ready under models/$SIZE. Run ./Start-Genereti.command"
