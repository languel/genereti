# ComfyUI for Genereti

These example workflows use three small custom node packs:

- `integrations/comfyui_genereti`: calls the local Genereti Core ML server and reads its latest output frame.
- `integrations/genereti_comfy_inputs`: selects Comfy Painter, webcam, or shared window/screen input.
- `integrations/genereti_comfy_p5`: an independent interactive p5.js sketch source node.

Install the packs with `scripts/install_comfy.sh /path/to/ComfyUI`, restart ComfyUI, and open a `Genereti-*.json` workflow. `Genereti-p5-Source.json` and `Genereti-Input-Sources.json` are source-only graphs that work without the Genereti server; the bridge workflows require the Mac generator. The live input graph demonstrates the Genereti web app sources. The separate p5 graph lets students edit and run a sketch, draw with mouse/keyboard, and queue the current canvas as an IMAGE.

The Generate and Live Frame nodes call `http://127.0.0.1:8765`; they require Genereti running on the same Mac. The capture and p5 nodes can also run as source nodes in ComfyUI on PC.
