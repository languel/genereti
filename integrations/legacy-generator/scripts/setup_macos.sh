#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "Genereti's Core ML generator requires macOS on Apple silicon (arm64)." >&2
  echo "See docs/platform-support.md for the ComfyUI nodes that can run independently on PC." >&2
  exit 1
fi
if ! command -v uv >/dev/null 2>&1; then
  echo "Install uv first: brew install uv" >&2
  exit 1
fi
if ! command -v python3.11 >/dev/null 2>&1; then
  echo "Install Python 3.11 first: brew install python@3.11" >&2
  exit 1
fi

uv venv --python "$(command -v python3.11)" .venv
uv pip install --python .venv/bin/python -r requirements-macos.txt
mkdir -p web/models
POSE_MODEL="web/models/pose_landmarker_lite.task"
if [[ ! -s "$POSE_MODEL" ]]; then
  curl --fail --location --retry 3 \
    https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task \
    --output "$POSE_MODEL"
fi

# npm is only needed to update/rebuild the vendored browser libraries.
if command -v npm >/dev/null 2>&1; then npm ci; fi
printf '\nSetup complete. Next: ./scripts/download_models.sh\n'
