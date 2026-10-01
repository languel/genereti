# Genereti

**Live, controllable image generation for creative coding and performance.** Genereti is currently built for **macOS on Apple silicon** (M-series Macs). It uses Core ML models on-device and includes a browser app plus bridges for p5.js, TouchDesigner, and ComfyUI.

> A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition

Start with the [student quickstart](docs/student-quickstart.md). It covers setup, model downloads, launch, and the first live workflow. The [platform guide](docs/platform-support.md) explains exactly what runs on Apple silicon and what can also be used on PC.

## What you can do

- Generate live text-to-image and image-to-image frames in the local web app.
- Guide generation with sketches, camera or shared-window captures, and optional Canny, depth, and pose controls. The experimental composite runs SDXS sketch and SD-Turbo Canny as separate image branches, then blends them.
- Experiment with a separate Canny shape source, palette-reference transfer, emboss-first color/tone controls, recursive learned-upscaler feedback, sharpening, and output sizing.
- Use the output as a live image stream in p5.js or TouchDesigner.
- Build ComfyUI graphs with Genereti generation, live input capture, or an interactive p5.js sketch node.
- Send a queued ComfyUI image to a fullscreen projector window.
- Teach standard diffusion with an SD 1.5 bottle graph, then compare a fast direct-prompt Qwen Image 2.1 graph.
- Run the optional SD-Turbo, anime, and control model downloads when you want those modes.

Genereti is designed for responsive visuals, not full-resolution batch art. The 256px SDXS path has measured around 25–28 generated frames/s on one M-series Mac, with controls and other models running more slowly. Results vary by Mac, model warmup, and settings; this is not 30-fps video diffusion.

## Quick links

- [Student quickstart](docs/student-quickstart.md)
- [Apple silicon and PC support](docs/platform-support.md)
- [Web app, p5.js, TouchDesigner, and ComfyUI](docs/workflows.md)
- [Classic SD 1.5 and Qwen Image 2.1 in ComfyUI](docs/comfy-sd15-and-qwen21.md)
- [Ready-to-use prompts](docs/prompts.md)
- [Art workflows: composites, 512px, and post-processing](docs/experiments.md)
- [Model sources, setup, and licenses](docs/models.md)
- [Agent guide](AGENTS.md)

## Project contents

- `server.py`, `engine.py`, `guides.py`: local Core ML app and image processing.
- `web/`: live web app, output stream, p5 stage, and local pose worker.
- `integrations/comfyui_genereti/`: Genereti generate and output nodes, with example workflows.
- `integrations/genereti_comfy_inputs/`: doodle, webcam, and window/screen capture nodes.
- `integrations/genereti_comfy_p5/`: separate interactive p5.js sketch source node.
- `integrations/genereti_comfy_projector/`: click-to-open, screen-filling Comfy image output window.
- `integrations/touchdesigner/`: TouchDesigner component builder and instructions.
- `scripts/`: environment setup, model conversion/download, and Comfy install helpers.

Model weights, Core ML packages, compiled models, and generated outputs are not included in Git. The scripts download source weights and convert them locally. Read the model licenses before classroom or public use; see [models.md](docs/models.md).

## Contributing and licensing

Issues and improvements are welcome. The repository does not yet declare a project-wide code license; model licenses are separate and apply to their respective downloads. Contact the maintainer before redistributing code or bundling any model files.

The experimental **SDXS guide mixer** combines weighted guide residuals before one SDXS denoiser pass. It reuses the released sketch controller for image, edges, depth and explicit pose maps; it does not claim dedicated SDXS Canny/depth/pose weights. See [art experiments](docs/experiments.md#mix-guides-inside-sdxs) and the [model-size catalog](docs/models.md#resolution-and-model-size-catalog) for setup, supported resolutions and measured timings.

**Editable input:** choose **Shapes · Excalidraw** for locally bundled vector drawing, with a fixed guide artboard, an expanded editor, local autosave, `.excalidraw` save/load and editable source in scene exports. See [the drawing editor guide](docs/drawing-editor.md). Shape/model keyframe interpolation is a planned next layer, not yet implemented.
