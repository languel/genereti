#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
python3 - <<'PY'
import json
from pathlib import Path
for path in Path('integrations/comfyui_genereti/workflows').glob('ꘇ *.json'):
    json.loads(path.read_text())
    print('valid workflow:', path.name)
PY
for f in integrations/comfyui_genereti/__init__.py integrations/genereti_comfy_inputs/__init__.py integrations/genereti_comfy_p5/__init__.py integrations/genereti_comfy_texture/__init__.py integrations/genereti_comfy_chop/__init__.py integrations/genereti_comfy_dat/__init__.py; do
  python3 -m py_compile "$f"
  echo "valid Python: $f"
done
if [[ -x .venv/bin/python ]]; then
  .venv/bin/python - <<'PY'
import fastapi, coremltools
print('Python runtime imports OK')
PY
else
  echo "Python environment missing; run ./scripts/setup_macos.sh" >&2
  exit 1
fi
if curl --silent --fail http://127.0.0.1:8765/api/status >/dev/null; then
  echo "Genereti server responds at http://127.0.0.1:8765"
else
  echo "Genereti server is not running (start it to check API status)."
fi
