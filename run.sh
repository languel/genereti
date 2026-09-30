#!/bin/zsh
set -eu
cd "${0:A:h}"
export HF_HUB_OFFLINE=1
export HF_HUB_DISABLE_TELEMETRY=1
export TOKENIZERS_PARALLELISM=false
export GENERETI_SIZE="${GENERETI_SIZE:-256}"
exec .venv/bin/python -m uvicorn server:app --host 127.0.0.1 --port "${GENERETI_PORT:-8765}" --ws-max-size 3000000 --ws-max-queue 1
