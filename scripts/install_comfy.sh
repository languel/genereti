#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMFY="${1:-${COMFYUI_ROOT:-$HOME/Documents/ComfyUI}}"
if [[ ! -d "$COMFY/custom_nodes" ]]; then
  echo "Could not find ComfyUI custom_nodes at: $COMFY/custom_nodes" >&2
  echo "Usage: scripts/install_comfy.sh /path/to/ComfyUI" >&2
  exit 1
fi
NODES="$COMFY/custom_nodes"
link_node() {
  local name="$1"
  local source="$2"
  local target="$NODES/$name"
  if [[ -e "$target" && ! -L "$target" ]]; then
    echo "Refusing to replace existing folder: $target" >&2
    echo "Move it aside manually, then rerun." >&2
    exit 1
  fi
  ln -sfn "$source" "$target"
  echo "Linked $name"
}
link_node genereti_comfy_bridge "$ROOT/integrations/comfyui_genereti"
link_node genereti_comfy_inputs "$ROOT/integrations/genereti_comfy_inputs"
link_node genereti_comfy_p5 "$ROOT/integrations/genereti_comfy_p5"
WORKFLOWS="$COMFY/user/default/workflows"
mkdir -p "$WORKFLOWS"
for workflow in "$ROOT"/integrations/comfyui_genereti/workflows/Genereti-*.json; do
  [[ -f "$workflow" ]] || continue
  cp "$workflow" "$WORKFLOWS/"
  echo "Copied $(basename "$workflow")"
done
cat <<MSG

ComfyUI install complete. Restart ComfyUI, refresh its page, then open a
Genereti-*.json workflow from the Workflows menu. Keep the Genereti Mac app
running for its Core ML Generate and Live Frame nodes.
MSG
