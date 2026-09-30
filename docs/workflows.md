# Workflows

## Web app

Run `./Start-Genereti.command` or `./run.sh`, then visit `http://127.0.0.1:8765`. `/` is the control surface, `/output` is a browser-consumable live image stream, `/stream.mjpg` is an MJPEG stream, and `/p5` is a p5.js stage. The lightweight client module is `web/genereti-client.js`.

The server processes one generation at a time. Pause live generation before using another producer or playing a video into the shared output.

## p5.js

Open `/p5` for the stage. For a custom sketch, use the browser bridge in `web/genereti-client.js` or connect to the local WebSocket/API documented in that file. Draw your procedural graphics in p5 and send frames as an image guide or display the generated stream as a texture.

## TouchDesigner

Run Genereti, then create a Web Render TOP pointing to `http://127.0.0.1:8765/output`. Set a custom resolution (512 × 512), disable **Only Update when Loaded**, and enable **Cook Always**. You can generate a starter component from TouchDesigner’s Textport:

```python
exec(open('/path/to/genereti/integrations/touchdesigner/create_genereti.py').read())
```

Replace `/path/to/genereti` with the folder where you cloned this project. The script creates a uniquely named component and saves `Genereti.tox` in your home folder. It does not overwrite existing operators.

To send a TouchDesigner image into Genereti, use the browser’s camera/window input or call `/api/generate` from a background worker. Do not block TouchDesigner’s render thread while generation is running.

## ComfyUI

Install the Genereti node packs and example workflows:

```sh
./scripts/install_comfy.sh "$HOME/Documents/ComfyUI"
```

Then restart ComfyUI. `Genereti-Live-Inputs.json` shows doodle, webcam, and window/screen sources connected to Genereti. `Genereti-Input-Sources.json` previews and saves captured input without calling Genereti, so it also works on a PC; the source selector evaluates only its selected input. The graph passes that image to Genereti’s Core ML generate node. `Genereti-Image-Bridge.json` is a basic image bridge, and `Genereti-Output-Monitor.json` reads the latest published frame.

`Genereti-p5-Sketch.json` is an interactive-source graph that sends its canvas to the Genereti generator. `Genereti-p5-Source.json` previews and saves the p5 canvas without a generator, so it also works on a PC. Type or paste p5.js code into the node, click Run, draw in its canvas, and queue the workflow to capture the canvas as an IMAGE. Mouse drawing and keyboard input are supported while the sketch canvas has focus. Its output can feed Genereti or any other ComfyUI image graph.

The p5 source node also increments a hidden canvas revision after each mouse/touch gesture or key release. With ComfyUI's **Run (on change)** mode enabled, a completed interaction queues the latest canvas without queuing every animation frame. See [the classic SD 1.5 and Qwen 2.1 guide](comfy-sd15-and-qwen21.md) for the bottle demo and a smaller direct-prompt Qwen workflow.

The separate **Genereti Projector** node accepts an IMAGE and passes it through. Click **Open projector window** in the node, move the new window onto the projector display, then queue the graph to update the image. Use the projector window's own fullscreen button after moving it to the display you want.

The Genereti Generate node calls the local Core ML server, so this node requires Genereti running on the same Mac. The capture and p5 nodes can also serve as independent ComfyUI sources on a PC.

When upgrading from an older custom-node pack, restart ComfyUI so it loads the renamed Genereti node classes, then open the supplied `Genereti-*.json` workflow. Tabs already open in ComfyUI retain their old labels and node classes in memory; save any unsaved edits before closing or replacing those tabs.

If ComfyUI reports a missing Genereti node, close stale workflow tabs, rerun `scripts/install_comfy.sh` for the active ComfyUI folder, restart ComfyUI, and reopen the current workflow from its Workflows menu. The installer links all four node packs and copies the current example workflows; it does not install model weights. The bridge's Generate and Live Frame nodes also need the Genereti server running on the same Mac.
