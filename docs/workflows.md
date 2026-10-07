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

Examples are installed under **Workflows → Genereti** (`user/default/workflows/Genereti/`). The installer consolidates older root-level `Genereti-*.json` files into that folder. Existing customized files are preserved; independently edited root copies receive a ` (from root)` suffix. Redundant root copies and previous managed examples are backed up outside the workflow browser under `user/default/.genereti-workflow-backups/`. A small manifest lets later installs update unchanged examples while keeping your edits. Examples now use the **ꘇ-** filename prefix; the installer renames older Genereti-prefixed and glyph-space copies in place, including customized examples, and carries their managed checksums forward.

Then restart ComfyUI. `ꘇ-Live-Inputs.json` shows doodle, webcam, and window/screen sources connected to Genereti. `ꘇ-Input-Sources.json` previews and saves captured input without calling Genereti, so it also works on a PC; the source selector evaluates only its selected input. The graph passes that image to Genereti’s Core ML generate node. `ꘇ-Image-Bridge.json` is a basic image bridge, and `ꘇ-Output-Monitor.json` reads the latest published frame.

`ꘇ-p5-Source.json` and `ꘇ-p5-Realtime.json` use **ꘇ livecode** in p5 mode, making the editable code node the default p5.js demo. The source workflow previews and saves its canvas without a generator, so it also works on a PC. The starter draws random grayscale lines; mouse dragging adds circles sized by pointer movement. Evaluate with Run or Cmd/Ctrl+Enter, then queue to capture the current canvas as an IMAGE. **GeneretiP5Sketch** remains available as a compact alternative; its source-only sample is `ꘇ-p5-Send-Receive.json`.

The standalone p5 source node increments a hidden canvas revision after each mouse/touch gesture or key release. With ComfyUI's **Run (on change)** mode enabled, a completed interaction queues the latest canvas without queuing every animation frame. It remains available in the node library and in the p5 send/receive example. See [the classic SD 1.5 and Qwen 2.1 guide](comfy-sd15-and-qwen21.md) for the bottle demo and a smaller direct-prompt Qwen workflow.

The separate **Genereti Projector** node accepts an IMAGE and passes it through. Click **Open projector window** in the node, move the new window onto the projector display, then queue the graph to update the image. Use the projector window's own fullscreen button after moving it to the display you want.

The Genereti Generate node has a **resolution** selector (default **auto**). Auto retains the active size when that mode is installed there, otherwise selects a supported size. With the current model packages, SDXS text/sketch support 256 and 512px; SD-Turbo image/Canny/depth/pose run at 256px. Older servers use the same 256px Turbo default. Input image dimensions do not select the model size. An explicit unsupported size gives an actionable error. Size changes also affect other clients of the shared generator, so pause other producers first. Restart ComfyUI and refresh to expose the new selector; restart Genereti to enable server-side auto resolution for HTTP, WebSocket and MCP clients. Generate and Send examples now explicitly use auto; no Image Resize is required before either node. Server fitting uses a centered crop to the square model dimensions. Size selection and generation share one lock, and a failed model load preserves the previous engine and last output. Depth preprocessing uses the locally cached Depth Anything model; pose requires an already prepared pose guide (no automatic pose extraction).

The Genereti Generate node calls the local Core ML server, so this node requires Genereti running on the same Mac. The capture and p5 nodes can also serve as independent ComfyUI sources on a PC.

When upgrading from an older custom-node pack, restart ComfyUI so it loads the renamed Genereti node classes, then open the supplied `ꘇ-*.json` workflow. Tabs already open in ComfyUI retain their old labels and node classes in memory; save any unsaved edits before closing or replacing those tabs.

If ComfyUI reports a missing Genereti node, close stale workflow tabs, rerun `scripts/install_comfy.sh` for the active ComfyUI folder, restart ComfyUI, and reopen the current workflow from its Workflows menu. The installer links the node packs and installs examples in the Genereti subfolder; it does not install model weights. The bridge's Generate and Live Frame nodes also need the Genereti server running on the same Mac.

### Capture troubleshooting

After updating capture nodes, restart ComfyUI and refresh its browser page. Select Webcam or Window / Screen on Genereti Input Source, then click the corresponding Start button before queueing. Capture widgets must serialize the uploaded `[temp]` frame path; an older frontend or backend can report a missing `capture` argument. Current nodes handle absent capture values with a start-source message, and unselected sources remain lazy. This is separate from a generator-busy error: pause other live producers before using Generate/Send, or use Live Frame/Receive to monitor them.

### Direct live preview in Comfy

Open **ꘇ-p5-SDXS.json** for p5 → SDXS sketch → live image preview. For drawing, use **ꘇ-Drawing-SDXS.json** or **ꘇ-Drawing-SD-Turbo.json**. Each native generator chooses its own model package path; no loader or pipeline socket is needed. Select Live and play, or Comfy Queue and Run. Native generators run in Comfy on macOS 14+ Apple silicon; model resolution and baked style follow the selected package. The external-server **ꘇ generator** remains available for comparison in **ꘇ-Drawing-Generator-Preview.json**. Connect any generator to **ꘇ live image preview** for viewing and projection.

This is a browser preview of the Genereti output, not continuous execution of the Comfy graph. Its standalone live projector mirrors the same frames without generating again; double-click its window for fullscreen. Queue on Live Preview reads the latest shared output without evaluating its lazy source; connected downstream Save/processing nodes run only when queued. Painter and arbitrary tensor-based IMAGE sources currently require Queue. Live preview disables AI upscaling and does not change server resolution. Restart Comfy and refresh its browser page after installing the extension.

Validation: V3 node schema imported against the installed Comfy API; live display, projector opening and Pause checked in a browser with controlled JPEG responses. Actual source-to-model FPS inside Comfy remains to be measured after restarting Comfy and refreshing the extension.

The p5 widget uses independent state for its DOM value accessors; assigning widget.value inside those accessors causes recursion in current Comfy frontends and can appear as a missing node. Verified the installed Comfy browser can create the p5 node, load Genereti-p5-Live-Preview with strength 0.65/fixed seed, and capture its running canvas after this fix. Refresh the browser and reopen the workflow to replace any saved UNKNOWN placeholders.

### Preview any IMAGE without files

**Genereti Live Image Preview** (Genereti / Streams) accepts any IMAGE output. Each execution sends an in-memory JPEG directly in the Comfy UI message, without temp/output PNGs or a Save Image node. It previews the first batch image at up to 512px by default; preview_size and jpeg_quality trade clarity against bandwidth. The output passes the complete original tensor/batch through unchanged. Run (instant) updates as upstream executes; this still uses Comfy scheduling and cannot independently stream arbitrary Python nodes. Open projector mirrors this preview.

Projectors use a same-origin BroadcastChannel, so they also work if a desktop browser opens a window without returning its handle. Each node exposes a projector URL and Copy projector link. Open that URL in another window in the same browser/profile and exact origin (localhost and 127.0.0.1 differ). Separate browsers/profiles use the local Comfy projector relay instead. Refresh Comfy after updating; restart it to load the new Live Image Preview node.

Validation for generic preview: the installed V3 API accepted the schema; a batch tensor was returned by identity while its first image was resized/encoded in memory. Browser preview and a manually opened same-origin projector link received a test JPEG without window.opener. Full queued workflow execution of this new node still requires a Comfy restart.


### Browser realtime clock

Open **ꘇ-p5-Realtime.json** for p5 Livecode → Live Image Preview. Evaluate the p5 sketch, then click **Start realtime** on the preview. Drawing and preview run independently of Comfy Queue. The node can also open its output window, in-Comfy overlay, or graph backdrop directly; no Genereti inference server is needed for this raw image preview.

The browser runtime transfers ImageBitmaps directly, with one outstanding source frame and bounded projector delivery. It avoids per-frame PNG uploads, tensor conversion, JPEG encoding and saved preview files. The preview reports delivered FPS and frame delivery time. A local 512px p5 + preview + projector test delivered about 41 fps over five seconds without queuing; this is a measured example, not a guaranteed rate.

Browser p5, started webcam/screen capture and the Genereti Live Preview output can feed this path. Input Source selection and known preview/projector passthrough links are followed, but arbitrary Python processing nodes are never bypassed: their IMAGE outputs still update when Comfy executes them. Queue can sample a p5 snapshot while its browser clock remains live. Pause realtime or remove the viewer to release its source subscription; changing sketch code restarts the sketch and resumes active subscriptions. Refresh the Comfy page to load the frontend update.

Projector windows in separate browsers/profiles fall back to a local in-memory JPEG relay (up to 30 sends/sec, one in flight, latest frame only). Encoding activates only when a relay viewer requests frames; same-profile windows continue using direct ImageBitmaps. Restart Comfy once after installing the relay backend, refresh the Comfy page, and reopen the current node’s projector link. Old links belong to old node instances. No preview files are saved.

### General livecode source

See [Livecode languages](livecode-languages.md) for all thirteen modes, code contracts, math syntax and example workflows.

**Genereti Livecode** (Interactive Sources) is a separate CodeMirror 6 node; **Genereti p5.js Sketch** remains available. Open **ꘇ-Livecode-Realtime.json**, evaluate with ▶ or Ctrl+Enter (Cmd+Enter also works), then start realtime on Live Image Preview. The p5 starter draws random grayscale lines; dragging the mouse paints circles sized by pointer movement. It follows the node’s width and height. The IMAGE output can also feed Send Frame, model Live Preview, and Projector. Queue renders with that run’s connected IMAGE and parameter values; editing and Genereti browser frame delivery do not require Queue.

Visual edits compile a hidden candidate and promote it only after it renders its first frame, following Underscores' prepare/render/swap design. Failed syntax, setup, or first-frame rendering keeps the previous running runtime and reports the error beside the editor. Auto-update debounces visual edits by 400ms; turn it off to keep a draft until evaluation. Strudel defaults to manual evaluation and keeps its previous pattern on compile errors. Drafts and the last accepted source are saved separately, so reopening a workflow can run the accepted source even if the draft is broken. Ctrl+. stops/pauses the active runtime and holds the last canvas. These shortcuts also work with preview focus and in the original p5 node. This is not a guarantee against an infinite loop or arbitrary JavaScript side effects.

- **p5:** classic `setup`, `draw`, and `keyPressed`; mouse drawing remains interactive. Use `createCanvas` in setup.
- **GLSL:** WebGL fragment shader with `u_resolution`, `u_time` (seconds), and `u_mouse` (pixel coordinates); output `gl_FragColor`.
- **Three.js:** setup receives `THREE`, `scene`, `camera`, `renderer`, and `tick(callback)`; the callback receives elapsed seconds.
- **Strudel:** native REPL evaluation supports named/anonymous `$:` patterns, `all`/`each`, mini notation, sliders, inline `_pianoroll`, `_scope`, and other native visual widgets. The preview includes a second editable CodeMirror REPL with active-event marks and raw `markcss` CSS. Failed evaluations retain the accepted pattern and visuals. Built-in synths work locally; click Enable audio if the browser suspends audio. External samples still require `samples(...)` and network availability. IMAGE captures the rendered REPL, including inline canvas widgets and CSS marks; it does not carry audio. Comfy AUDIO output is not provided.
- **HTML:** isolated iframe rendering with authored styles, animation and scripts. Scripts stay inside the opaque-origin sandbox, away from Comfy's page. Input IMAGE is a rasterized snapshot of the preview.
- **Markdown:** headings, lists, tables, fenced code and KaTeX math, with HTML sanitized by DOMPurify. Markdown does not execute scripts.
- **Tixy / Play Core / Manim:** browser canvas runtimes, sharing IMAGE, parameter sockets and output controls. Manim uses JavaScript and supports stepped cues.
- **LaTeX / SVG / Orca / HyperFrames:** formula, vector, operator-grid and finite HTML-clock modes; see the language guide for their scope.

Use **Settings** for Dark/Light/Midnight/Paper themes plus Underscores-inspired Mono dark/light and Transparent dark/light presets, fonts, font size, line height, wrapping, syntax/text/background colors and preview CSS. Expand **Colors** to customize selection, active line, brackets, word/search matches, and completion/hover panel colors; highlight colors also support alpha. Completion panels follow the theme by default, with a readable translucent surface for transparent themes. Disable **Autocomplete** to turn off automatic and manual suggestions, or disable **Hover docs** separately. Each color has a checkerboard swatch, opacity slider and CSS color entry (including `#RRGGBBAA` and `rgba()`). **Split**, **Overlay**, **Code** and **Output** views are saved with the workflow. Drag the divider in Split view to resize the code/output split; arrow keys adjust it and double-click restores 40% code. The split is saved with the workflow. Code and Overlay fill the available node height when resized. Overlay backgrounds can be transparent, behind text only, or solid, with a separate backdrop opacity. The outer editor overlay is not included in rendered IMAGE/PNG output. Changing a preset resets color overrides; Reset colors restores that theme. Enter a name and **Save theme** to save your palette, alpha, typography, wrapping and overlay settings. Custom themes are kept in this browser and embedded in the workflow for portability; saving the same name updates it. Escape dismisses Settings and color submenus and returns focus to the editor; clicking outside also dismisses them. PNG exports the active rendered surface; HTML exports a standalone page with bundled runtime, accepted source and appearance (including animated Strudel). Built-in synths and libraries are local; authored remote media/samples remain remote. Browser audio may need a click after opening an exported page.

The preview toolbar keeps minimize and freeze beside the output controls. **Open output window**, **Open output overlay**, and **Open output backdrop** respectively show the rendered sketch in a separate output surface, a floating in-Comfy window, or behind the Comfy graph. These local views subscribe to the running sketch and continue updating while the node preview is frozen or minimized. Closing the node closes its local views. Output transparency is preserved by the overlay and backdrop paths.

**Width** and **height** are ordinary Comfy widgets, convertible to input sockets, bounded to 64–4096. **Contain**, **Cover**, **Stretch** and **Native pixels** only control preview fitting, including output windows and the backdrop. Fullscreen expands the displayed preview without changing render resolution. Changing width/height recreates the runtime and retains the previous surface until the replacement renders.

For p5, `createCanvas(windowWidth, windowHeight)` uses the selected render dimensions at pixel density 1. Explicit `createCanvas(300, 600)` remains authoritative and updates the preview aspect. All other Livecode runtimes use the configured dimensions. A hardcoded p5 size will not change when changing width/height.

The **Format document** button and **Cmd/Ctrl+Shift+F** use locally bundled Prettier for JavaScript, HTML and Markdown; GLSL uses CodeMirror indentation. **Minify** supports JavaScript modes and preserves public function names. Formatting/minifying is undoable with Cmd/Ctrl+Z, without undoing the Comfy graph. **Ctrl+Space** opens completion. P5 and Three.js use a lazy-loaded, browser-local TypeScript language service worker with pinned p5/Three definitions: global functions/constants, inferred object members, local variables, hover documentation and completion signatures. GLSL completion uses its language tokens and declarations to offer uniforms, variables/functions, struct fields, vector swizzles and builtins. HTML/Markdown retain CodeMirror language support; Strudel adds its common pattern vocabulary. The GLSL helper is not a full semantic compiler. No external language server is required, and editor code/type queries never leave the browser.

DOM-based Strudel/HTML/Markdown IMAGE refreshes asynchronously at up to 6 captures per second, reusing the latest good snapshot between captures. This keeps audio/UI rendering independent of the more expensive DOM rasterization. Canvas modes continue using direct ImageBitmap transport. DOM capture uses system fonts and locally embedded KaTeX fonts; cross-origin/tainted media may prevent PNG capture. Export errors are reported beside the editor.

Restart Comfy to register the new backend node, then refresh the page. Runtime/editor libraries are locally bundled with pinned dependencies; rebuild with `npm run build:livecode`. Bundled Strudel is AGPL-3.0-or-later; its license ships alongside the runtime. CodeMirror, Three.js and their type definitions are MIT; TypeScript is Apache-2.0. Source/build files are in `integrations/genereti_comfy_p5/livecode` and `scripts/build_livecode.mjs`.

Older Send Frame starter workflows omitted Comfy's automatic seed-control widget, shifting `options_json` into `control_scale`. The corrected starter and frontend migration restore the values when loading older shifted workflows. Reload an older saved workflow after refreshing; control_scale should be numeric (normally 1), and options_json should be `{}`.

### Local output windows

The monitor glyph (**Open output window**) in Projector, Live Image Preview and Live Preview opens a clean local canvas. Start the source and **Start realtime** (or **Start live preview**) first. Move the output window to your display; **F** or double-click toggles fullscreen in ordinary browser windows. The second glyph opens a floating, always-on-top window where Document Picture-in-Picture is supported. Floating windows may require the OS maximize control instead of browser fullscreen.

Live sources draw borrowed ImageBitmaps directly into this window at their native resolution. There is no JPEG encoding, server relay, Comfy queue, or additional bitmap clone in this display path. The title reports delivered FPS and dimensions. A browser test delivered approximately 60 fps at 512 × 512 with exact RGB values; this is display throughput, not inference throughput. Queued IMAGE results still update only when their graph executes, and HTML/Markdown raster output retains its existing snapshot rate. This is a live display of the source, not an independent rerun of its sketch or a separate Three.js scene renderer. Keep the editor/source active; browser background throttling can still reduce its rate.

Output fit controls offer Contain, Cover, Stretch and Native pixels in both the node and output window; pointer movement near the bottom reveals the window control. Contain preserves the source aspect and may show letterboxing. Desktop hosts may redirect ordinary popups into a separate browser. The local output tries Document Picture-in-Picture when available; if the desktop host rejects it, a draggable, resizable in-app output panel keeps the direct canvas path working. For a separate OS window in hosts without floating-window support, open Comfy's server URL in Chrome. This fallback was browser-tested with a simulated desktop rejection; native Electron behavior still needs testing in the desktop app. This direct mode never silently switches to JPEG. **Open projector** and **Copy projector link** remain available separately for external browsers/profiles, using the existing compressed relay when needed. Refresh Comfy to load these frontend controls; no backend restart is needed for the output window itself.

Livecode uses a borderless icon toolbar. Auto-update is the lightning toggle immediately after Stop (hover for its label); its value remains in the workflow. Export opens PNG (rendered output), HTML (standalone accepted runtime), JSON (draft code, language, auto-update and node properties), or Source script (`.js`, `.frag`, `.html`, or `.md`). JSON is a portable Livecode object, not a complete Comfy graph. The node-pack pill remains at the bottom of Livecode.

The Livecode display label is **ꘇ livecode**; its internal `GeneretiLivecode` ID and Genereti search alias remain unchanged. Cmd/Ctrl+Shift+Plus/Minus adjusts only the focused code editor’s font (9–36px), saved with its appearance. Shift + two-finger scrolling over the editor scrolls code vertically without moving or zooming the Comfy graph.

Livecode image inputs, typed code parameter sockets and native width/height controls are documented in the [browser source guide](../integrations/genereti_comfy_p5/README.md#images-and-code-parameters). The IMAGE/Float/GLSL example is **ꘇ-Livecode-Image-Parameters.json**. Restart Comfy and refresh its frontend after this schema change.

## GPU Texture Lab

**ꘇ-Feedback-Reference-Chain.json** teaches a delayed node reference → decay →
transform → composite loop. **ꘇ-Class-Feedback-Bloom-Displace.json** expands it
with a colored expression source, bloom-driven displacement, independent fresh
and history levels, and RGB/RGBA channel routing. Each includes a clickable lesson.
Restart ComfyUI after installing these new Python node schemas, then reload the
browser. Settings → Genereti → Learning → Open lessons also offers both workflows.

Open **ꘇ-Creative-Stage-Showcase.json** under **Workflows → Genereti** for
the combined demo. Its top lane connects a transparent p5 brush through all seven
texture operators: Math, Crop, Transform, Feedback, Filter, Corner Pin and
Composite. Press the brush editor's Run triangle if needed, then draw in the
annotation node to composite ink over the moving trails. This lane requires
WebGPU but no Core ML models.

The second lane demonstrates Tixy parameters, Markdown formulas, and a GLSL
shader receiving the brush IMAGE plus a wired Comfy Float parameter. The third
lane offers drawing/camera/screen selection and optional SDXS generation. Camera
and screen capture start only on your explicit action. SDXS starts in **Comfy
Queue**; install its models on macOS 14+ with Apple silicon before queuing the
whole graph, or switch that node to Live and press Play when ready.

Select **final stage** and press **D** for a backdrop, **Alt+W** for its overlay,
or **Alt+F** to fill the current Comfy viewport. **Alt+P** hides the graph for
presentation. The workflow includes notes for these controls, preview
freeze/minimize, feedback reset, and interactive drawing overlays. For every
language's starter code, use the separate Livecode Languages and Livecode Math
examples alongside the showcase.

Open `ꘇ-Texture-Lab.json` for transparent livecode feedback, blur, projective
corner pin and compositing. Install the new texture pack and restart ComfyUI. See
the [texture operator guide](texture-operators.md) for GPU boundaries, queued
semantics and performance checks. No Core ML models are required.

## OpenTouch operators and authored lessons

**ꘇ-OpenTouch-Operators-and-Lessons.json** is a model-free connected lab covering TOP, CHOP, DAT, all family conversions, Three.js, document exports, tutorial authoring and basic music. Its MIDI/OSC ports and browser audio stay stopped until explicitly started. The DAT report and `dat.lesson` author toolbar export Markdown, standalone HTML and Print / Save as PDF. See the [catalog](opentouch-catalog.md) and [authoring guide](opentouch-lessons.md).

## Small model-free learning demos

- **ꘇ-Tutorial-Authoring.json**: one editable `dat.lesson`, a real texture exercise, an image preview and exportable author notes. Open Settings → Genereti → Learning → Interactive lessons, then **Open authoring workflow** to open it in a separate tab and start the tutorial about making tutorials.
- **ꘇ-Interactive-Output-Views.json**: clickable p5, a scrollable Markdown/math document, active drawing and an authored mini guide. Try Alt+O or Shift-click on the overlay glyph for output-only node chrome; use a regular click or Alt+W for a floating overlay. Both views share opacity, click-through and stacking controls.

Demo filenames use `ꘇ-…`. Stable node IDs and the **Genereti** folder remain unchanged. The installer preserves customized examples and archives redundant or retired unchanged managed copies outside the workflow browser.

## Modular audio demo

**ꘇ-Modular-Audio.json** connects shared transport, melody/drum grids, polyphonic synth and procedural drums through gain/pan, filter, delay and a four-bus mixer into an explicitly started output. Its `dat.lesson` provides a walkthrough. These are independent `mod.*` nodes that accept OpenTouch CHOP notes and scalar controls. No models or hardware are required. See [modular audio](modular-audio.md).

## Painterly noise feedback

**ꘇ-Painterly-Feedback-Tutorial** is a lesson-only starter with six Hint / Do it steps that create and wire the patch. **ꘇ-Painterly-Feedback-Patch** opens the completed pigment/noise/displacement loop with the same lesson. See [reference feedback and expression syntax](texture-operators.md#painterly-reference-feedback-tutorial). Both run without models or media permissions.

## Performance timeline

Open **ꘇ-Performance-Timeline** in the Genereti workflow folder. Its six-step
lesson connects a project transport, readable time, global expression color,
noise automation, scale context, `dat.monitor` frame timing and an explicitly
started modular synth.
**Alt+Shift+T** opens the dock. See [performance time](performance-time.md) for
recording parameter takes, offsets, `__` variables and seek limitations.

## Guided Livecode pipelines

- **ꘇ-Livecode-Shader-Buffers.json**: three connected GLSL passes, fresh/history composite and a delayed composite reference. These are external buffer nodes with one image input per pass, not full Shadertoy A–D tabs.
- **ꘇ-Livecode-P5-Pipeline.json**: interactive source sketch → mirrored tile sketch → viewer, using `inputImage`.
- **ꘇ-Livecode-Audio-Visual.json**: explicitly started FM synth, scope/spectrum/Lissajous, RMS → CHOP → annotated p5 parameter and pointer interaction.

Each includes a clickable `dat.lesson` playlist with Hint/Do it actions. Open
these workflows through the Learning lesson chooser or the Genereti workflow
folder. The [step-by-step guide](livecode-tutorials.md) explains routing, controls
and current multibuffer limits. All three ship in the student Comfy package.
