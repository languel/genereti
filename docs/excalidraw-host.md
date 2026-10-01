# Genereti inside Excalidraw

Branch `excalidraw-host` starts from main checkpoint `25173b9`. Launch with the existing `./run.sh` or Start-Genereti.command and open `http://localhost:8765/`. Models and downloads use the same Apple silicon setup as before. The editor and fonts remain bundled locally.

## Try the workspace

1. The **Genereti controls** icon in the bottom toolbar opens or closes the native sidebar. The panel stays open while drawing; close it explicitly with its close button or toolbar icon. Pin it for docked controls; unpin it to float. Generation continues when the sidebar is closed.
2. Draw editable shapes within the dashed 512px input square. Move, rotate, recolor and resize with the native tools. **Live edits** updates the guide during drags and strokes; turn it off to wait for release.
3. Set a prompt, apply it with **Cmd+Enter** (or Ctrl+Enter), choose a pipeline in the sidebar, then the **Start live generation** play icon. The Generated frame on the canvas displays each new result. Drag its edge or frame to arrange it. **Fit workspace** fits the default input/output positions.
4. The sidebar includes the previous source choices, model settings, numeric overrides, presets, guide mixer, post-processing and export controls. Secondary controls collapse to leave room for drawing. Camera and screen capture still require your explicit button click and browser permission.
5. For an external source, its live preview occupies the input square. **View guide** adds the prepared model guide below the input; **View input** removes that preview. Switch back to Shapes to continue editing the same vector drawing.
6. **Capture & export** contains PNG/clipboard metadata, scene ZIP/scene board, recording and fullscreen workspace. The monitor icon opens the clean output/projector page. p5.js, TouchDesigner and ComfyUI consume the same streams and APIs.

**S** opens stroke colors, **G** opens fill colors, and **Shift + Alt + D** changes the editor theme. Footer buttons provide these actions too. Prompt and numeric fields retain normal typing. **Space** pans Excalidraw; **Alt + Space** pauses/resumes generation when focus is outside form controls. Open/Save drawing uses `.excalidraw` files. Scene exports include the editable drawing corresponding to the generated result.

The classic interface is still available at `http://localhost:8765/lab.html`, including its embedded editor and output-in-canvas toggle. It uses the same backend and locally stored presets/drawing. Avoid simultaneous editing in both pages, since they share drawing autosave.

## Implementation

- `web/host-bootstrap.js` moves the existing controls into Excalidraw's native Sidebar and unified Footer toolbar. Moving the original DOM preserves IDs, presets, handlers and generator contracts. Closed panels park those nodes in a hidden container so generation and updates remain connected.
- `editor/index.jsx` mounts Excalidraw directly in the host document. The classic drawing page still uses the same bundle inside its iframe. `web/drawing-bridge.js` chooses the correct same-origin message target for each layout.
- Custom embeddables render live source, generated output and prepared guides without importing a new native image file on every frame. Their internal link identifiers do not fetch remote content.
- Preview elements are excluded from the rasterized input, drawing autosave and editable drawing exports. Moving the output over the input does not feed generated pixels into the model accidentally. The existing explicit model/post-processing feedback controls remain available.
- `web/host.css` follows the native Excalidraw light/dark theme and compact panel layout. Underscores informed the host structure; its project source was not copied.
- After changing editor code: `npm ci` if dependencies are absent, then `npm run build:editor`. Commit the rebuilt local bundle with source edits.

## Current limits

This is a desktop-first host milestone. Detached output position/size, overlay mode and frame-label visibility persist locally; guide-preview layout is session state; drawing geometry and presets persist locally. The default input uses a fixed artboard. Frame input can select native frames; rectangular frames are stretched to the square model input. Multiple independent generators, timeline/keyframes, shape interpolation and model-state animation are not implemented. The p5 stage remains a separate bridge/viewer. Camera and screen permissions were not exercised in this milestone's browser checks.

## Toolbar and themes

Drawing and generation actions share one icon strip in the native Footer. Hover tips and accessible labels describe each action; play/pause and the live-edit lightning toggle show state. Theme colors come from shared low-chroma tokens that also override native Excalidraw selections, panels, focus and hover accents. Light mode uses slate gray; dark mode uses a lighter slate. This changes UI chrome only, not drawing colors or generated pixels.

## Draw over the result

In **Output view**, enable **Draw over output**, or use the overlapping-rectangles toolbar icon, to snap the generated view to the input region and lock it. The native output frame is temporarily removed so new strokes do not become children of a generated frame. **Input above output** shows editable marks over the live result. **Input below output** hides marks beneath the result while retaining drawing hit testing and model guidance. Selection handles are hidden in this painting mode; switch back to above to edit with visible handles. Light mode uses multiply and dark mode uses screen for display compositing; this lets native paper act as neutral while ink remains visible. This is a display treatment only: generated pixels never enter the model guide or drawing exports.

Disable the switch to restore the output's previous position, size, rotation and lock state. Placement and the switch persist locally. **Frame labels** is off by default and can reveal the native titles. Fit workspace adapts to the overlay. Overlay placement and input order persist locally. Saved setups include frame-input and overlay choices; detached output placement and frame labels remain local workspace preferences.

## General frame input

Enable **Frame input** in **Output view**, then choose an existing native Excalidraw frame. If none exists, an Input frame is created. Shapes and imported images intersecting that frame are cropped into the model input. Move or resize the frame to change the crop; an overlaid output follows it. Generated output and guide previews are excluded.

With camera, video, screen capture or the demo selected, the source fills that frame and editable marks are composited on top before generation. Capture still requires the normal explicit start button and permissions. The transparent drawing raster updates on edits; the media-plus-drawing composite updates each generation request. Turn Frame input off for the original source-only path. Scene exports include the composited source, editable scene, selected crop and settings.

Browser verification covered drawing beneath live output, sidebar persistence and explicit close/reopen, and frame input with the animated demo. Camera/screen permission dialogs were not retested.

## Performance monitoring

Open **Performance** in the sidebar. It shows mean/P95 stage timings, output and drawing-export rates since Reset samples, browser long tasks, server-busy retries and errors. Samples are bounded to the latest 120 per stage; rates and counters cover time since reset, including pauses. Timings overlap: model, UNet, ControlNet and post-processing are parts of server total, not extra durations to add. Browser frame interval is display cadence, not AI FPS. Reset after loading a model and before comparing settings.

The browser API is `window.genereti.performance.snapshot()` and `.reset()`. Snapshot contains numeric timings/counters only, no captured images. Long-task counts use browser support when available. The table refreshes only while open, twice a second.

The optimization pass keeps preview updates outside the React/Excalidraw root, reuses encoded input until the editable guide changes, exports drawings at no more than the request rate (capped at 24/s), skips drawing exports for external source-only mode, requests/decodes prepared guides only when their preview is open, and removes duplicate live-source preview encoding. It also avoids rewriting unchanged theme controls and artboard geometry.

A local Chromium check with SDXS sketch at 256 px and no AI upscaler measured about 59 ms end-to-end before, 28–35 ms after, and 20 generated FPS with a 24/s request limit. Drawing export on a small test scene was about 4 ms. These are local samples, not guarantees for 512px, complex imported scenes, guide mixing or recursive upscaling. A later concurrent-client check produced server-busy retries: only one producer should run for a clean comparison; output viewers do not generate. Camera/screen performance was not retested.

## Prompt submission

Prompts A and B are drafts until **Cmd+Enter** (Mac) / **Ctrl+Enter** or the apply icon is pressed. Live generation continues with the applied prompts while you type. **Live prompt** applies each edit immediately; it defaults off and remembers the preference locally. Preset selection and the public setPrompt API apply explicitly. Generated-image metadata records the applied prompts, not unsent draft text.
