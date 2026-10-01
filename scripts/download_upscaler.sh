#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/models/upscalers"
MODEL_SET="${1:-all}"

if [[ "$(uname -s)" != Darwin || "$(uname -m)" != arm64 ]]; then
  echo "Core ML upscalers require Apple silicon macOS." >&2
  exit 1
fi
case "$MODEL_SET" in
  all) MODELS=(animevideo general) ;;
  animevideo|general) MODELS=("$MODEL_SET") ;;
  *) echo "Usage: scripts/download_upscaler.sh [all|animevideo|general]" >&2; exit 2 ;;
esac

mkdir -p "$DEST"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
base_url="https://github.com/hanxiao/real-esrgan-coreml/releases/download/v1.0.0"

for model in "${MODELS[@]}"; do
  archive="RealESRGAN_${model}_522_fp16.zip"
  package="RealESRGAN_${model}_522_fp16.mlpackage"
  if [[ -d "$DEST/$package" ]]; then
    echo "$model Core ML upscaler is already installed."
    continue
  fi
  case "$model" in
    animevideo) expected="0e83446f03b4c0a60c970da02d70d10af14949c169714f9ad8e8ea3e479b145b" ;;
    general) expected="41368af9dcbcc300c0fe0442202acbf98d30dc07c28d49bf656883f7fef3656a" ;;
  esac
  echo "Downloading Real-ESRGAN $model Core ML package..."
  curl --fail --location --retry 2 "$base_url/$archive" -o "$tmp_dir/$archive"
  echo "$expected  $tmp_dir/$archive" | shasum -a 256 --check --status || {
    echo "Checksum mismatch for $archive" >&2
    exit 1
  }
  unzip -q "$tmp_dir/$archive" -d "$DEST"
  [[ -d "$DEST/$package" ]] || { echo "Expected package $package was not found in the archive." >&2; exit 1; }
  echo "Installed $DEST/$package"
done
