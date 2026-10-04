# ComfyUI for Genereti

These example workflows use four small custom node packs:

- `integrations/comfyui_genereti`: calls the local Genereti Core ML server and reads its latest output frame.
- `integrations/genereti_comfy_inputs`: selects Comfy Painter, webcam, or shared window/screen input.
- `integrations/genereti_comfy_p5`: browser-based creative-code sources, including thirteen Livecode modes and local math rendering; see [language examples](../../docs/livecode-languages.md).
- `integrations/genereti_comfy_projector`: a click-to-open, screen-filling image output window.

Install the packs with `scripts/install_comfy.sh /path/to/ComfyUI`, restart ComfyUI, and open a `ꘇ *.json` workflow. `ꘇ p5 Source.json` and `ꘇ Input Sources.json` are source-only graphs that work without the Genereti server; the bridge workflows require the Mac generator. The p5 examples use **ꘇ livecode** in p5 mode so you can edit, evaluate and draw in the same node. `GeneretiP5Sketch` remains available as a compact standalone source node.

The Generate and Live Frame nodes call `http://127.0.0.1:8765`; they require Genereti running on the same Mac. The capture, p5, and projector nodes can also run in ComfyUI on PC.

The installer also copies the standalone [classic SD 1.5 bottle](<workflows/ꘇ Classic SD15 Bottle.json) and [fast direct-prompt Qwen 2.1](workflows/ꘇ Qwen 2.1 Fast.json>) teaching graphs. See [the model guide](../../docs/comfy-sd15-and-qwen21.md) for settings and speed tradeoffs.
