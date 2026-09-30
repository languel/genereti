# Student quickstart

## Platform

The complete Genereti image generator requires a **Mac with Apple silicon** (M1/M2/M3/M4/M5) and macOS 14 or later. Intel Macs and Windows/Linux PCs cannot run its Core ML generator. You can still use the ComfyUI p5 sketch and browser capture nodes on a PC; see [platform support](platform-support.md).

For an Apple silicon Mac, install Xcode Command Line Tools, Python 3.11, and `uv` (a Python environment manager). Node.js/npm is optional for the runtime because the browser libraries are included in the repository.

```sh
xcode-select --install
brew install python@3.11 uv
```

Clone the project and create the local Python environment:

```sh
git clone https://github.com/languel/genereti.git
cd genereti
./scripts/setup_macos.sh
```

## Download models and launch

The starter download creates 256px SDXS text/sketch models and the SD-Turbo image remix model. It downloads several GB, then converts the models to Core ML locally. Keep the Mac plugged in and allow the conversion to finish; first conversion can take a while.

```sh
./scripts/download_models.sh
./Start-Genereti.command
```

Or launch from Terminal with `./run.sh`. Open [http://127.0.0.1:8765](http://127.0.0.1:8765). The default server listens only on this Mac. For optional Canny/depth/pose models and the depth preprocessor, run:

```sh
./scripts/download_models.sh --with-guides
```

For the optional anime style:

```sh
./scripts/download_models.sh --with-anime
```

Check [models and licenses](models.md) before enabling or sharing any download. We keep weights out of the repository because they are large and have separate terms.

## Try a live input

In the Genereti page, start the camera or select a doodle/image, enter the sample prompt below, select a mode, then start live generation. Browser camera and window-share permissions are requested by the browser when you explicitly start those inputs.

> A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition

Press **Stop live** when switching to ComfyUI or playing a prepared video so two producers do not compete for the shared output.

## Install the ComfyUI nodes

With ComfyUI installed locally, stop it and run:

```sh
./scripts/install_comfy.sh "$HOME/Documents/ComfyUI"
```

Start ComfyUI again and open **Genereti-Live-Inputs.json** from the workflows menu. The doodle source works with Painter; webcam and window capture need the browser UI open and their respective **Start** buttons clicked. The p5.js example is a separate workflow, **Genereti-p5-Sketch.json**: edit the sketch, click Run, draw with the mouse, use the keyboard controls shown in its code, then queue to capture the canvas. In **Run (on change)** mode, each finished drawing gesture or key release can queue a new frame. For a plain diffusion lesson, open **Genereti-Classic-SD15-Bottle.json**; for a smaller Qwen 2.1 speed preset, use **Genereti-Qwen-2.1-Fast.json**.

To send a queued image to a projector, add a **Genereti Projector** node after any IMAGE-producing source, click **Open projector window**, move the new window to the projector display, and click **Enter fullscreen** there.

See [workflows.md](workflows.md) for details, including p5, TouchDesigner, and the web output URLs.

## Troubleshooting

- Visit `http://127.0.0.1:8765/api/status` to see model loading or errors.
- If the page loads but models are missing, rerun `./scripts/download_models.sh`.
- After installing Comfy nodes, fully restart ComfyUI and refresh the browser page.
- On macOS, allow camera and screen sharing in the browser’s site permission prompt and System Settings if prompted.
- Run `./scripts/verify_install.sh` for a quick local check.
