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
link_node genereti_comfy_drawing "$ROOT/integrations/genereti_comfy_drawing"
link_node genereti_comfy_agent "$ROOT/integrations/genereti_comfy_agent"
link_node genereti_comfy_stream "$ROOT/integrations/genereti_comfy_stream"
link_node genereti_comfy_inputs "$ROOT/integrations/genereti_comfy_inputs"
link_node genereti_comfy_p5 "$ROOT/integrations/genereti_comfy_p5"
link_node genereti_comfy_texture "$ROOT/integrations/genereti_comfy_texture"
link_node genereti_comfy_chop "$ROOT/integrations/genereti_comfy_chop"
link_node genereti_comfy_dat "$ROOT/integrations/genereti_comfy_dat"
link_node genereti_comfy_projector "$ROOT/integrations/genereti_comfy_projector"
link_node genereti_comfy_performance "$ROOT/integrations/genereti_comfy_performance"
WORKFLOWS="$COMFY/user/default/workflows"
python3 "$ROOT/scripts/install_comfy_workflows.py" \
  "$ROOT/integrations/comfyui_genereti/workflows" "$WORKFLOWS"
cat <<MSG

ComfyUI install complete. Restart ComfyUI, refresh its page, then open a
workflow from Workflows → Genereti. The install also adds the
Genereti Projector image output node and Genereti assistant sidebar. Open the
assistant sidebar to configure a model or connect an external workspace agent.
The realtime tools require no separate Genereti app or model server.
MSG
