#!/bin/sh
set -eu
GEN_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
exec uv run "$GEN_ROOT/scripts/genereti_mcp.py"
