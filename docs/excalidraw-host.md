# Genereti inside Excalidraw

Branch `excalidraw-host` starts from main checkpoint `25173b9`. Launch with the existing `./run.sh` or Start-Genereti.command and open `http://localhost:8765/`. Models and downloads use the same Apple silicon setup as before. The editor and fonts remain bundled locally.

## Try the workspace

1. **Genereti** in the top-right opens or closes the native sidebar. Pin it for docked controls; unpin it to float. Generation continues when the sidebar is closed.
2. Draw editable shapes within the dashed 512px input square. Move, rotate, recolor and resize with the native tools. **Live edits** updates the guide during drags and strokes; turn it off to wait for release.
3. Set a prompt and pipeline in the sidebar, then **Start live**. The Generated frame on the canvas displays each new result. Drag its edge or frame to arrange it. **Fit workspace** fits the default input/output positions.
4. The sidebar includes the previous source choices, model settings, numeric overrides, presets, guide mixer, post-processing and export controls. Secondary controls collapse to leave room for drawing. Camera and screen capture still require your explicit button click and browser permission.
5. For an external source, its live preview occupies the input square. **View guide** adds the prepared model guide below the input; **View input** removes that preview. Switch back to Shapes to continue editing the same vector drawing.
6. **Capture & export** contains PNG/clipboard metadata, scene ZIP/scene board, recording and fullscreen workspace. The top-right arrow opens the clean output/projector page. p5.js, TouchDesigner and ComfyUI consume the same streams and APIs.

**S** opens stroke colors, **G** opens fill colors, and **Shift + Alt + D** changes the editor theme. Footer buttons provide these actions too. Prompt and numeric fields retain normal typing. **Space** pans Excalidraw; **Alt + Space** pauses/resumes generation when focus is outside form controls. Open/Save drawing uses `.excalidraw` files. Scene exports include the editable drawing corresponding to the generated result.

The classic interface is still available at `http://localhost:8765/lab.html`, including its embedded editor and output-in-canvas toggle. It uses the same backend and locally stored presets/drawing. Avoid simultaneous editing in both pages, since they share drawing autosave.

## Implementation

- `web/host-bootstrap.js` moves the existing controls into Excalidraw's native Sidebar, Footer and top-right UI. Moving the original DOM preserves IDs, presets, handlers and generator contracts. Closed panels park those nodes in a hidden container so generation and updates remain connected.
- `editor/index.jsx` mounts Excalidraw directly in the host document. The classic drawing page still uses the same bundle inside its iframe. `web/drawing-bridge.js` chooses the correct same-origin message target for each layout.
- Custom embeddables render live source, generated output and prepared guides without importing a new native image file on every frame. Their internal link identifiers do not fetch remote content.
- Preview elements are excluded from the rasterized input, drawing autosave and editable drawing exports. Moving the output over the input does not feed generated pixels into the model accidentally. The existing explicit model/post-processing feedback controls remain available.
- `web/host.css` follows the native Excalidraw light/dark theme and compact panel layout. Underscores informed the host structure; its project source was not copied.
- After changing editor code: `npm ci` if dependencies are absent, then `npm run build:editor`. Commit the rebuilt local bundle with source edits.

## Current limits

This is a desktop-first host milestone. Output position and guide-preview layout are session state; drawing geometry and presets persist locally. Input is still one fixed artboard, not arbitrary frame selection. Multiple independent generators, timeline/keyframes, shape interpolation and model-state animation are not implemented. The p5 stage remains a separate bridge/viewer. Camera and screen permissions were not exercised in this milestone's browser checks.
