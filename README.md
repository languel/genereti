# Genereti

**Realtime creative coding and performance tools for ComfyUI**, plus an optional local image generator. The Comfy package includes Livecode, drawing, OpenTouch operators, Web Audio, lessons and timeline automation. The separate Core ML generator requires **macOS 14+ on Apple silicon** (M-series Macs).

**Super alpha · early classroom test release (0.1.1).** Expect bugs, incomplete
features and changing interfaces. Back up your workflows before updating, try
the package in a separate ComfyUI installation first, and report issues with
your OS, browser, ComfyUI version and a small reproducing workflow. This release
is intended for experimentation and student feedback; it is not production-ready.

## Student getting started

Use an existing ComfyUI installation. The realtime classroom tools need no model
downloads, npm or separate Genereti server.

1. Stop ComfyUI. From your **ComfyUI directory**, install the package:

   ```sh
   git clone https://github.com/languel/genereti.git custom_nodes/genereti
   ```

2. Install `custom_nodes/genereti/requirements.txt` using **ComfyUI's Python**.
   For a macOS/Linux checkout with a `.venv`:

   ```sh
   ./.venv/bin/python -m pip install -r custom_nodes/genereti/requirements.txt
   ```

   See the [installation guide](docs/comfy-distribution.md#git-install-now) for
   Windows, Portable, Desktop and existing split-pack installs.
3. Restart ComfyUI and refresh the browser.
4. Demos are installed automatically under **Workflows → Genereti** on startup.
   Open **ꘇ-Performance-Timeline** there, or choose it in **Templates → genereti**. Run its `dat.lesson`
   guide; **Alt+Shift+T** opens the timeline. Sound starts explicitly on `mod.output`.

Next, try the [shader, p5 and audiovisual tutorials](docs/livecode-tutorials.md),
[workflow examples](docs/workflows.md) and [node catalog](docs/opentouch-catalog.md).
The [student quickstart](docs/student-quickstart.md) covers the optional Mac
generator; see [platform support](docs/platform-support.md) before setting it up.

> A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition

## Other app interfaces

Open [the standalone p5 canvas lab](http://localhost:8765/p5-lab.html) for side-by-side drawing input and processed AI output, independent of Excalidraw. Defaults: SDXS sketch at 512px, `ink wash 水墨画`. Separate Comfy Send/Receive nodes and a headless MCP bridge use the same server. See [external interface setup and API contracts](docs/external-interfaces.md).

## Comfy assistant

**ꘇ assistant** is a docked sidebar for local or hosted models, node/asset/workflow/template references, reviewed graph/code edits and an external workspace MCP bridge. Optional typed decision-model connections support future performance automation. See the [assistant setup guide](docs/comfy-assistant.md) and [Comfy themes / transparent overlay](docs/comfy-themes.md).

## Comfy livecoding

**ꘇ livecode** retains the internal `GeneretiLivecode` ID and search aliases. It keeps the last working sketch running when a new draft fails. Its borderless toolbar includes Run, Stop, Auto-update, Settings, Split/Overlay/Code/Output views, and an Export menu for PNG, standalone HTML, a JSON node object, or source script. Editor settings include themes, custom themes, alpha colors, fonts, completion and rendering dimensions/fit.

Use **Cmd/Ctrl+Enter** to run, **Ctrl+.** to pause, **Cmd/Ctrl+Shift +/-** to resize the focused editor font, and **Shift + two-finger scrolling** to scroll code without zooming the graph. Settings → Genereti → Workflow → Default workflow selects Blank canvas or Comfy default for the next default load; restored tabs stay intact. Try the [guided shader, p5 and audiovisual tutorials](docs/livecode-tutorials.md). See the [Livecode guide](integrations/genereti_comfy_p5/README.md) and [workflow examples](docs/workflows.md#general-livecode-source).

## Comfy drawing

**ꘇ drawing** is an always-interactive Excalidraw source with protected Image and
Mask frames and connection-driven IMAGE, MASK, SVG and JSON outputs. Choose Live
or Comfy Queue above the editor. Transparent paper, output sizing, auto masks and
Satori shortcuts are covered in the [drawing guide](integrations/genereti_comfy_drawing/README.md).
**ꘇ performance** adds a shared project clock, bottom-panel timeline, numeric
automation/recording, global scale and `__` time in code/expression nodes.
Use **Alt+Shift+T** for the dock and open **ꘇ-Performance-Timeline** for its guide.
See [performance time](docs/performance-time.md) for domains and first-pass seek behavior.

Use the [single-folder package install](docs/comfy-distribution.md), restart
ComfyUI and refresh the browser. `scripts/install_comfy.sh` remains the alternative
split-pack development installer; install only one layout at a time.

**OpenTouch operators** add `top.*` WebGPU textures, `chop.*` sampled signals/MIDI/OSC/music, and `dat.*` documents/tables/lessons. All six family conversions are explicit. Open **ꘇ-OpenTouch-Operators-and-Lessons** under Workflows → Genereti. The `dat.lesson` toolbar authors/runs/exports lessons; Settings → Genereti → Learning opens mini guides. Browser synth/drum audio is explicitly started. The independent `mod.*` Web Audio layer adds routed instruments, sequencers, effects and a mixer; open **ꘇ-Modular-Audio** and press Start on `mod.output`. See the [audio guide](docs/modular-audio.md), [catalog](docs/opentouch-catalog.md), [report](docs/opentouch-report.md) and [lesson/export guide](docs/opentouch-lessons.md).
Open [ꘇ-Drawing-Source.json](<integrations/comfyui_genereti/workflows/ꘇ-Drawing-Source.json>)
for a drawing → **ꘇ live image preview** example without a model server. Custom
node controls follow the [node UI design rules](docs/node-ui-design.md).

## Excalidraw workspace

The local app opens directly into a full-screen Excalidraw workspace. **Genereti** opens the native dockable sidebar containing input sources, model controls, presets, post-processing and exports. Generated output renders on the drawing canvas. The classic interface remains at `/lab.html`. See [the workspace guide](docs/excalidraw-host.md). The icon toolbar supports drawing over generated output, with input above or below the result. Optional **Frame input** combines editable shapes/images with live media. The sidebar stays open while drawing and includes a **Performance** monitor. Prompt edits apply with **Cmd+Enter** (or Ctrl+Enter); enable **Live prompt** for updates as you type. Keyframe animation is not implemented yet.

## What you can do

- Generate live text-to-image and image-to-image frames in the local web app.
- Guide generation with sketches, camera or shared-window captures, and optional Canny, depth, and pose controls. The experimental composite runs SDXS sketch and SD-Turbo Canny as separate image branches, then blends them.
- Experiment with a separate Canny shape source, palette-reference transfer, emboss-first color/tone controls, recursive learned-upscaler feedback, sharpening, and output sizing.
- Use the output as a live image stream in p5.js or TouchDesigner.
- Build ComfyUI graphs with Genereti generation, live input capture, the existing p5.js sketch node, or **ꘇ livecode** with p5, GLSL, Three.js, HTML and Markdown.
- Preview browser sources independently of Comfy’s queue and open a direct canvas output window; queued IMAGE results can also feed the projector.
- Teach standard diffusion with an SD 1.5 bottle graph, then compare a fast direct-prompt Qwen Image 2.1 graph.
- Run the optional SD-Turbo, anime, and control model downloads when you want those modes.

Genereti is designed for responsive visuals, not full-resolution batch art. The 256px SDXS path has measured around 25–28 generated frames/s on one M-series Mac, with controls and other models running more slowly. Results vary by Mac, model warmup, and settings; this is not 30-fps video diffusion.

## Quick links

- [Student quickstart](docs/student-quickstart.md)
- [Comfy package install, student releases and registry preparation](docs/comfy-distribution.md)
- [Apple silicon and PC support](docs/platform-support.md)
- [Web app, p5.js, TouchDesigner, and ComfyUI](docs/workflows.md)
- [Classic SD 1.5 and Qwen Image 2.1 in ComfyUI](docs/comfy-sd15-and-qwen21.md)
- [Ready-to-use prompts](docs/prompts.md)
- [Art workflows: composites, 512px, and post-processing](docs/experiments.md)
- [Live GPU texture operators](docs/texture-operators.md)
- [Comfy challenge checkpoint](docs/comfy-challenge.md)
- [Model sources, setup, and licenses](docs/models.md)
- [Comfy assistant and workspace MCP](docs/comfy-assistant.md)
- [Comfy themes and transparent overlay](docs/comfy-themes.md)
- [Session handoff and next steps](handoff.md)
- [Agent guide](AGENTS.md)

## Project contents

- `server.py`, `engine.py`, `guides.py`: local Core ML app and image processing.
- `web/`: live web app, output stream, p5 stage, and local pose worker.
- `integrations/comfyui_genereti/`: Genereti generate and output nodes, with example workflows.
- `integrations/genereti_comfy_inputs/`: doodle, webcam, and window/screen capture nodes.
- `integrations/genereti_comfy_agent/`: docked assistant, local provider transports and visible-workspace MCP bridge.
- `integrations/genereti_comfy_p5/`: p5.js and CodeMirror Livecode sources, local runtimes and editor libraries.
- `integrations/genereti_comfy_projector/`: click-to-open, screen-filling Comfy image output window.
- `integrations/touchdesigner/`: TouchDesigner component builder and instructions.
- `scripts/`: environment setup, model conversion/download, and Comfy install helpers.

Model weights, Core ML packages, compiled models, and generated outputs are not included in Git. The scripts download source weights and convert them locally. Read the model licenses before classroom or public use; see [models.md](docs/models.md).

## Contributing and licensing

Issues and improvements are welcome. Genereti-authored code is MIT licensed. Third-party code and model downloads retain their own licenses; see [licensing](licensing/README.md) and [model notes](docs/models.md) before redistribution.

The experimental **SDXS guide mixer** combines weighted guide residuals before one SDXS denoiser pass. It reuses the released sketch controller for image, edges, depth and explicit pose maps; it does not claim dedicated SDXS Canny/depth/pose weights. See [art experiments](docs/experiments.md#mix-guides-inside-sdxs) and the [model-size catalog](docs/models.md#resolution-and-model-size-catalog) for setup, supported resolutions and measured timings.

**Editable input:** choose **Shapes · Excalidraw** for locally bundled vector drawing, with a fixed guide artboard, an expanded editor, local autosave, `.excalidraw` save/load and editable source in scene exports. See [the drawing editor guide](docs/drawing-editor.md). Shape/model keyframe interpolation is a planned next layer, not yet implemented.

**Alt+Shift+R** toggles the right properties sidebar independently, including a temporary reveal in Satori. Satori hides that sidebar and its resize gutter without changing the saved open/closed preference. Escape hides temporarily revealed panels.

## License

Genereti-authored code is MIT. Third-party components retain their licenses;
p5.js LGPL source/build materials ship alongside the runtime. Embedded Strudel
is omitted from the public build. See [licensing](licensing/README.md).
