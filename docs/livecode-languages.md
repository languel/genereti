# Livecode languages

Choose a language in **ꘇ livecode**, edit its starter, and evaluate with
**Cmd/Ctrl+Enter**. Every visual mode can feed IMAGE, image preview, an output
window, the in-Comfy overlay, or the graph backdrop. Local preview freeze/minimize
keeps downstream frames running. Width and height remain native Comfy controls;
code parameters create typed sockets beside their local default widgets.

| Language | Code contract | Output |
| --- | --- | --- |
| `p5` | `setup()`, `draw()`, `inputImage`; `windowWidth/Height` follow render size | Interactive canvas |
| `glsl` | WebGL 1 or `#version 300 es`; `u_resolution`, `u_time`, `u_mouse`, `u_image`, `u_imageSize` | GPU fragment shader |
| `three` | `THREE`, `scene`, `camera`, `renderer`, `tick(seconds)`, `inputTexture` | Three.js canvas |
| `tixy` | Expression, function, or body over `(t,i,x,y,__)`; Math names such as `sin` are available | Positive/negative circles; transparent by default |
| `playcore` | Export `settings`, `main(coord,context,cursor,buffer,__)`; optional `boot`, `pre`, `post`, pointer callbacks | Canvas character grid |
| `strudel` | Native browser REPL, patterns and inline visual widgets | Browser sound and visual IMAGE; no Comfy AUDIO tensor |
| `manim` | JavaScript `manim-web`: `scene`, API classes, `__`, async animations and `cue(label)` | Transparent animated canvas |
| `markdown` | Markdown with inline/display math; sanitized HTML; `![Input](inputImage)` | Document snapshot |
| `latex` | A bare LaTeX formula, without `$` wrappers | Centered KaTeX formula on transparency |
| `html` | HTML/CSS/scripts in the isolated preview; automatic math delimiters | Document snapshot |
| `svg` | A complete `<svg>` document, with scripts removed | Transparent SVG snapshot |
| `orca` | Text grid and native operator clock; optional `bpm` parameter | Character grid; event data inside the preview |
| `hyperframes` | HTML with finite composition clock, CSS `--hf-time`/`--hf-progress` | Animated document snapshot |

Open **ꘇ-Livecode-Languages.json** for Tixy, Play Core, HTML, SVG, Orca,
and HyperFrames examples, or **ꘇ-Livecode-Math.json** for Markdown, LaTeX,
and Manim. These workflows require only the Livecode pack and stock Preview Image;
no inference model or Genereti server is needed. Queue captures the current frame.
Keep the workflow open in the browser client that queued it.

## Math and HTML

Markdown and HTML accept `$x^2$`, `$$...$$`, `\(...\)` and `\[...\]`.
Markdown fenced/inline code and escaped dollar signs remain literal. HTML skips
`pre`, `code`, scripts and `.genereti-no-math`; call
`renderMathInElement(element)` after inserting new HTML. The bundled `katex`
object is also available for explicit `katex.render(...)` calls. LaTeX mode accepts
only the formula itself. Invalid expressions show KaTeX's error text.

KaTeX and its fonts ship locally, including fonts in PNG/IMAGE captures. HTML
scripts execute only in the opaque-origin preview, not the Comfy page. SVG and
Markdown are sanitized. Authored remote media and tainted canvases can still
prevent capture. DOM modes refresh IMAGE at up to six snapshots per second;
canvas runtimes keep their own clocks. Queue capture completes even when nodes are
offscreen. A host clock maintains subscribed canvas output when its node preview
is hidden; fully backgrounded browser tabs can still be throttled. This is not an
inference FPS promise.

Use `{{params.name}}`, `{{render.width}}` and `{{inputSize.width}}` in Markdown,
SVG or formula source. HTML scripts access `__.params`, `__.render` and `__.image`,
and receive `genereti-parameters` and `genereti-image` events. Plain HTML
interpolation is evaluated when the source is run; use those events for live updates.

## Parameters and runtime details

```js
// @param speed = 1 (0..4)
// @param enabled = true
// @param color1 = "#89d7d2" (color)
```

HTML also accepts `<!-- @param duration = 8 (1..120) -->`. Native FLOAT, INT,
BOOLEAN and STRING sockets follow these declarations. Colors use STRING sockets.
The shared bridge is `__.params`, `__.image`, `__.inputSize` and `__.render`.
Tixy can use annotated names directly. Grid sizing uses `gridSize`, or
`gridWidth/gridHeight`; colors use `color1/color0/backgroundColor`.

Play Core's context includes frame, **time in milliseconds**, dimensions,
cols/rows and cell metrics. Its local compatibility modules support static imports
such as `import {clamp} from '/src/modules/num.js'`; unknown/dynamic imports report
an error. Parameters and input images update without recompiling; code must read
live values in its frame callback. Changing a Manim geometry parameter likewise
requires reevaluating a scene unless its authored code responds to live values.

Manim is the same **JavaScript browser approach** used by Underscores, not a
Python Manim server. Use `await equation.waitForRender()` before animating a
`MathTex` object. `// @param stepThrough = true` makes `await cue('Next')` wait;
the Next cue button or **Alt+Shift+Right** in the focused editor/preview advances
it. Stop disposes the scene and keeps the last captured frame. Queue captures the
current animation frame, without waiting for the whole scene or a performance cue.

The HyperFrames mode implements a capturable HTML clock, not the full external
HyperFrames Player/export/speech integration. `window.__hyperframes` exposes
`play()`, `pause()`, `seek(seconds)`, time, duration, runtime data, and a
`hyperframes-time` DOM event. `duration` and `loop` parameters control playback.
Orca emits `genereti-orca-events` in its preview and exposes `__.orca`; hardware
MIDI/OSC routing and Comfy audio output are separate integrations.

Format uses Prettier for JavaScript, HTML, SVG and Markdown. LaTeX, Tixy and Orca
keep authored formatting; GLSL uses editor indentation. PNG, standalone bundled
HTML, JSON and language-specific source exports work across these modes. Manim's
larger dependency bundle loads only when a Manim node is evaluated. Rebuild assets
with `npm run build:livecode`; dependency pins and license notices accompany them.

## Live performance

Live generation samples the current canvas immediately; it does not wait for two
browser animation frames as a queued input/render handshake does. PNG alpha is
preserved, and inference composites transparent input over white. Queued IMAGE
follows the existing RGB tensor contract; use live output or PNG export to retain
alpha. Live input bitmaps acknowledge their copy immediately instead of waiting
for animation frames. Tixy binds Math
functions once when compiling, rather than once per cell per frame.

A subscribed output uses the iframe's animation clock when visible and a host
fallback at 30 fps when its iframe clock stalls. Hiding/freezing the local preview
keeps downstream animation running. A p5 sketch using `noLoop()` remains still.
The fallback can advance p5, Tixy, GLSL, Three, Play Core and Orca; Manim's scene
and authored HTML animation can also have their own browser clocks. Browser/OS
power policies still apply when the whole client is backgrounded.

The native generator reports **input**, **model** and **total** milliseconds.
FPS measures the interval between delivered outputs, so it includes busy waits.
One Comfy backend shares one native inference engine across desktop and browser
clients. Pause other live generators when measuring one path. Concurrent model
resolutions can also rebuild the engine; separate tabs do not provide separate
model capacity.

An October 2026 local check with 512px Tixy → 512px SDXS measured about 33 ms
for the old visible capture wait versus 2 ms for immediate capture, visible or
hidden. Tixy delivered about 60 fps visible and 30 fps hidden with changing pixels.
With other clients stopped, three 4.5-second samples after warm-up measured:

| 512px Tixy → 512px SDXS | Delivered FPS | Median interval | 95th percentile |
| --- | ---: | ---: | ---: |
| Previous two-frame wait, visible | 12.0 | 83.4 ms | 86.2 ms |
| Immediate sampling, visible | 23.9 | 41.8 ms | 45.5 ms |
| Immediate sampling, hidden | 23.9 | 41.7 ms | 44.9 ms |

These are short local samples, not a throughput guarantee or a benchmark of all
model sizes. Concurrent clients caused busy gaps in the earlier comparison.

`npm run build:livecode` versions its large bundles by content hash so updates do
not retain a running Comfy server's older compressed editor/runtime response.
Refresh the Comfy page after rebuilding; restart Comfy when the Python schema changes.

## Render sizing and output surfaces

**Fixed texture** uses the width/height Comfy controls (default 512×512).
**Follow output** uses the most recently opened browser output window, in-Comfy
output overlay, or graph backdrop. Closing that viewer returns control to the next
open viewer; with none open, width/height provide the fallback. The choice is saved
in the workflow. Render sizing is separate from Contain/Cover/Stretch/Native pixels,
which only control display fit. Responsive browser sizes use CSS pixels, bounded
to 64–4096 per side. All downstream consumers share the resulting resolution;
choose Fixed texture when a generator needs stable texture dimensions.

In p5, `windowWidth`/`windowHeight` track the render surface. Resizing keeps the same
sketch instance and clock. A declared `windowResized()` callback handles the resize;
otherwise Genereti resizes the canvas and fits its existing pixels uniformly to preserve
accumulated drawing without stretching. Newly uncovered regions are transparent.
Opening an overlay in Follow output starts at the current render aspect ratio,
while keeping its remembered size. Alt+W places it at the cursor; the node glyph retains its saved position. Subsequent resizing sets the render size. Other languages currently rebuild on a resolution change.
Standalone HTML exports default to Follow output and use the browser viewport.

The macOS native output companion currently does not report its viewport dimensions;
use the in-Comfy overlay/backdrop or browser window for Follow output. The native
window continues to display the shared render using the selected fit.

Freezing the node preview preserves its frame aspect and current fit; live output
resizing and downstream delivery continue. Unfreezing adopts the current render
aspect. Native pixels, Contain, Cover and Stretch also apply to the frozen view.
