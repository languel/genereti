# Browser creative sources

**Genereti Livecode** is the recommended editable p5.js source and adds CodeMirror 6 with p5, GLSL, Three.js, Tixy, Play Core, Strudel, Manim, Markdown with math, LaTeX, HTML, SVG, Orca and a HyperFrames-compatible HTML clock. Its p5 starter is shared with the **Genereti p5.js Sketch** node, which remains available as a compact standalone source. See [language contracts and examples](../../docs/livecode-languages.md) and the [workflow guide](../../docs/workflows.md#general-livecode-source).

Evaluate with Ctrl+Enter (Cmd+Enter also works); stop with Ctrl+. Both work from the editor and preview. Auto-update debounces visual edits; Strudel defaults to manual. Visual runtimes render a candidate before swapping it into view, so compile/setup failures leave the old runtime alive; later asynchronous runtime failures are reported beside the editor. Strudel evaluates a candidate pattern before replacing its scheduler pattern. Draft code and the last accepted source are saved separately; reopening a workflow starts the accepted source while keeping the draft in the editor; stop keeps the last canvas.

Live Image Preview / Projector use the browser frame bus. Queue renders the current code with this run’s IMAGE and connected parameter values before returning IMAGE. Keep the workflow open in its browser client; headless API rendering is not supported. For an IMAGE batch, the first image is used. Strudel plays browser audio; IMAGE captures the REPL CodeMirror event highlights, CSS animation and inline visual widgets, not sound. Click Enable audio in the preview when required. This node does not produce Comfy AUDIO tensors.

Settings controls themes, fonts, size, syntax/text/background and selection/highlight/popup colors with alpha, wrapping, preview CSS and transparent/text-only/solid overlay backdrops. Completion and hover panels follow the theme; Autocomplete and Hover docs can be disabled independently. Drag the divider in Split view to resize the code/output split (arrows adjust, double-click resets); the split is saved in the workflow. Code and Overlay fill the node height. Width and height are regular Comfy parameters, with convert-to-input support. The fit dropdown only changes display scaling. Escape closes the panel and color pickers. Use `createCanvas(windowWidth, windowHeight)` to follow render dimensions; a hardcoded p5 size remains authoritative. Format with Cmd/Ctrl+Shift+F; Ctrl+Space opens language-aware completion: a local TypeScript worker provides p5/Three.js members, signatures and hover docs; GLSL offers declarations, structs and swizzles. Mono and transparent light/dark presets follow Underscores. Save theme stores your custom appearance in the browser and workflow. Minify supports JavaScript modes; undo restores formatted/minified text without changing the graph. PNG captures the rendered output; HTML exports a standalone bundled page. HTML runs in the preview sandbox; Markdown and SVG are sanitized. KaTeX and its fonts are bundled locally, including IMAGE captures. DOM captures refresh at up to 6fps while native render/audio keep their own clocks.

Install with `scripts/install_comfy.sh` and restart Comfy once to register the node. Libraries ship locally; no CDN loading is needed. Rebuild with `npm run build:livecode`. The runtime artifact is `.txt` because Comfy auto-imports extension `.js` files: runtime code must execute only inside its sandboxed iframe.

The prepare/render/swap design follows Underscores' `P5Frame.jsx`, `ThreeFrame.jsx`, `ShaderLivecodeFrame.jsx`, and `strudelRuntime.js`; this adapter does not import or change that checkout. The native REPL visual/capture wiring also follows `UnderscoresCodeEditor.jsx` and `livecodeCapture.js`. CodeMirror/Three and type definitions are MIT; TypeScript is Apache-2.0; Strudel is AGPL-3.0-or-later. Licenses accompany the bundle; source, dependency pins and build instructions remain in this repository.

**Comfy default workflow:** Settings → Genereti → Workflow → Default workflow chooses Blank canvas or the Comfy default. Refresh once after installing the frontend extension. This changes the fallback and Load Default Workflow command; restored tabs and saved workflows are preserved. It uses Comfy’s shared default graph compatibility export, so future frontend changes may require updating this adapter.

Livecode uses a borderless icon toolbar. Auto-update is the circular-arrow toggle immediately after Stop (hover for its label); its value remains in the workflow. Export opens PNG (rendered output), HTML (standalone accepted runtime), JSON (draft code, language, auto-update and node properties), or Source script (`.js`, `.frag`, `.html`, `.md`, `.tex`, `.svg`, or `.orca`). JSON is a portable Livecode object, not a complete Comfy graph. The node-pack badge is hidden for Livecode.

The Livecode display label is **ꘇ livecode**; its internal `GeneretiLivecode` ID and Genereti search alias remain unchanged. Cmd/Ctrl+Shift+Plus/Minus adjusts only the focused code editor’s font (9–36px), saved with its appearance. Shift + two-finger scrolling over the editor scrolls code vertically without moving or zooming the Comfy graph.


### Images and code parameters

Livecode accepts a regular optional **IMAGE** socket. In Live mode it also subscribes to connected Genereti browser sources; it never skips an arbitrary Python effect in a live path. Other Comfy nodes supply images when queued. Input bitmaps transfer into a persistent canvas/texture without recompiling the sketch. Local preview freeze/minimize leaves this path running.

| Runtime | Connected image | Parameters and dimensions |
| --- | --- | --- |
| p5 | `inputImage` (p5.Image, or null before an image arrives) | `__.params`, annotated names; `windowWidth`, `windowHeight` |
| GLSL | `u_image` sampler, `u_imageSize` vec2 | annotated uniforms; `u_resolution` |
| Three.js | `inputTexture` (CanvasTexture), `__.image` | `__.params`, annotated names; `__.render.width/height` |
| HTML | `__.image` canvas; `genereti-image` DOM event | `__.params`; `genereti-parameters` event; `__.render` |
| Markdown | `![Input](inputImage)` | live `{{params.name}}` and `{{render.width}}` interpolation |
| Strudel | `__.image` / `inputImage` canvas | `__.params`, `__.render`; reevaluate top-level pattern values after changing parameters |

Use a declaration on its own line:

```js
let influence = 0.5; /* 0..1 */
// @param enabled = true
// @param title = "Hello" (string)
```

GLSL uses `float influence = 0.5; /* 0..1 */` or `int count = 8; /* 2..40 */`. Numeric comments may include `step:0.01`; `// @param influence = 0.5 (0..1, step:0.01)` works across languages (HTML also accepts `<!-- @param ... -->`). JavaScript references `influence` or `__.params.influence`; GLSL declarations become uniforms.

Each declaration creates a typed **FLOAT / INT / BOOLEAN / STRING** Comfy input socket and a local default widget. Sockets sit beside their default widgets, following Comfy’s normal parameter layout. Connect a scalar output directly; the local widget is disabled while wired. Wires override defaults on Queue. Built-in Primitive values also update visual runtimes live; arbitrary Python computations update when queued. Values are bounded by the declared range. Socket identities follow parameter names across reordering and save/reload. Removing a declaration removes its socket and wire. Maximum 64 parameters per node. Width/height changes recreate the runtime; parameter and image changes reuse it. Queue also reuses an unchanged visual runtime, preserving accumulated p5 drawing state. A syntax error keeps the last accepted parameter sockets and output until a replacement compiles successfully.

Open **ꘇ Livecode Image Parameters.json** for a wired IMAGE + Float + GLSL example. The standard p5 starter uses the requested random-line/mouse-circle sketch and follows the node’s width and height.

## Keyboard shortcuts

See the [shortcut reference](../../docs/shortcuts.md) or **Comfy Settings → Genereti → Shortcuts**.
Use Alt+F for Fill window, Alt+P for presentation visibility, Alt+Shift+Z for Satori,
and Alt+Shift+I for independent canvas diagnostics. Alt is Option on macOS.
