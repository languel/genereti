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
| `strudel` | Legacy editable source; external runtime only | Embedded engine omitted from MIT distribution; see [external Strudel](strudel-external.md) |
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

## Parameters and annotations

A **parameter** is a value you can change from the node or drive through a connected socket. An **annotation** (sometimes called a decorator) tells Genereti to expose that value. These are comments, not JavaScript `@decorator` functions.

```javascript
// @param speed = 1 (0..4, step:0.01)
// @param count = 8 (int 1..64)
// @param enabled = true
// @param caption = "Hello" (string)
// @param ink = "#89d7d2" (color)
```

| Part | Meaning |
| --- | --- |
| `@param speed` | Parameter name; also its control/socket label |
| `= 1` | Default value when there is no saved override or connected value |
| `(0..4)` | Minimum and maximum; numeric values are clamped to this range |
| `step:0.01` | Numeric control increment; omitted steps are chosen from the range |
| `(int 1..64)` | Integer parameter: INT socket, rounded values, step of 1 |
| `true` / `false` | Boolean parameter: BOOLEAN socket; no range needed |
| `(string)` or `(text)` | Text parameter: STRING socket |
| `(color)` | Color text, such as a CSS hex color; still a STRING socket |

FLOAT is the default numeric type. A numeric annotation without a range is accepted, but an explicit range makes the control predictable. Put each annotation on its own line. Names are case-sensitive identifiers, such as `speed` or `paletteHue`; keep them unique. The parser exposes at most 64 parameters and ignores reserved names such as `__`, `width`, `height`, `inputImage` and `u_time`.

You can also annotate a numeric declaration with a range comment:

```javascript
let radius = 80; /* 10..200, step:1 */
const hue = 210; /* 0..360 */
```

For GLSL:

```glsl
float strength = 0.5; /* 0..1, step:0.01 */
int count = 8; /* 1..32 */
```

Genereti replaces these annotated declarations with live parameter access in JavaScript, or uniforms in GLSL. Read the parameter instead of assigning to it in your program. Unannotated variables remain ordinary local variables; `let radius = 80;` alone does not create a control.

HTML, SVG and document source can use comment annotations:

```html
<!-- @param caption = "Hello" (text) -->
<!-- @param duration = 8 (1..120) -->
```

### Reading and connecting parameters

Use `__.params.speed` in browser JavaScript. p5 and Three.js can also read annotated names directly, and Tixy expressions can use names such as `speed`. GLSL reads the generated uniform by name, such as `strength`; it has no JavaScript `__` object.

Local controls supply defaults; connected sockets supply the live values. Read parameters in `draw()`, `tick()` or another frame callback to respond continuously. Copying a parameter once into a local variable captures that value; geometry created once, such as a Manim circle, must be reevaluated or explicitly updated to reflect later changes.

```javascript
// @param radius = 80 (10..200, step:1)
// @param ink = "#89d7d2" (color)
function setup() {
  createCanvas(windowWidth, windowHeight);
}
function draw() {
  background(20);
  fill(__.params.ink);
  circle(width / 2, height / 2, __.params.radius * 2);
}
```

For Markdown, SVG, LaTeX and HTML interpolation, use `{{params.caption}}`, `{{render.width}}` or `{{inputSize.width}}`. These are value substitutions, not arbitrary JavaScript expressions. Plain HTML substitutes them when the source runs; use the runtime events below for continuous changes.

## The `__` runtime bridge

`__` is two underscores. Genereti provides this object inside the Livecode preview; you do **not** declare `const __` yourself. Declare your controls with `@param`, then read them through `__.params`. A name written in an annotation is not automatically a new property on `__` itself.

| Declaration / access | What it gives you |
| --- | --- |
| `__.params.radius` | Current value of your declared `radius` parameter |
| `__.image` | Incoming IMAGE as a browser canvas; updated without recompiling |
| `__.inputSize.width`, `.height` | Incoming image dimensions; zero before an image arrives |
| `__.render.width`, `.height` | Current rendering dimensions; distinct from input dimensions and preview fit |
| `__.time` | Performance transport time in seconds |
| `__.transport` | Current transport snapshot, including timing and playback state |
| `__.beat`, `__.bar` | Beat position and zero-based bar index; beats follow the time-signature denominator |
| `__.bpm`, `__.ticks`, `__.phase` | Tempo, integer ticks at 480 per quarter note, and quarter-note phase |
| `__.playing`, `__.rate` | Transport playback state and rate |
| `__.music`, `__.root`, `__.tuning` | Performance music settings, root and tuning frequency |

Transport values come from the performance system. In Free time mode, a runtime’s local animation clock can differ from the transport fields. In p5, `inputImage` is the p5 image adapter; Three.js provides `inputTexture`. GLSL uses `u_image`, `u_imageSize`, `u_resolution`, `u_time` and `u_mouse` instead of `__`.

The bridge also provides these helpers:

```javascript
__.data.get("palette");                // read a named performance value
__.data.set("palette", "blue");        // send a performance data command
__.commands.play();
__.commands.pause();
__.commands.seek(2);                   // seek in seconds
__.timeValue.parse("2s");              // parse a supported time value
__.timeValue.resolve("2s");            // resolve using current tempo/signature
__.timeValue.format(2);                // format seconds as bars/beats/units
__.musicTools.quantizeNote(61);        // apply current music settings
__.musicTools.frequency(69);           // note frequency using current tuning
```

In HTML scripts, listen for updates rather than capturing the initial state:

```html
<!-- @param caption = "Hello" (text) -->
<p id="caption"></p>
<script>
function update() {
  document.getElementById("caption").textContent = __.params.caption;
}
window.addEventListener("genereti-parameters", update);
update();
// "genereti-image" fires when the incoming image changes.
</script>
```

Some languages add their own bridge fields: Tixy supplies `__.pointer`; Orca supplies `__.orca.frame` and `__.orca.events`. HyperFrames exposes its composition clock separately as `window.__hyperframes`. These are runtime-provided fields, not extra parameter decorators.

## Language-specific runtime details

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

## GLSL compatibility checkpoint · 2026-10-06

The current runtime accepts complete WebGL 1 fragment shaders and WebGL 2
`#version 300 es` shaders. `gl_FragCoord` is the normal GLSL built-in.
Shadertoy-style `mainImage(out vec4 color, in vec2 coord)` gets a generated
`main()` entry point. Supported bridge names are `iTime`, `iResolution`,
`iMouse`, and `iChannel0`, alongside the Genereti `u_*` names in the table above.
`iChannel0` samples the single connected IMAGE. Mouse coordinates are pixels;
`iMouse.zw` currently remain zero, so mouse-down/origin behavior is incomplete.

Minifying a complete valid GLSL shader works; minification does not provide a
dialect adapter. Body-only Twigl snippets (`o`, `FC`, `r`, `t`, etc.) are not yet
wrapped. There is no dedicated fragment.xyz import/adapter. Shadertoy Buffer
A–D, Common/Sound passes, four channel routing, channel metadata, `iFrame`,
`iTimeDelta`, `iDate`, GPU-generated sound, cube-map/keyboard channel sources
and full project import are not implemented. Do not describe current Livecode
as a complete Shadertoy player. Existing `top.feedbackref` is an independent
OpenTouch temporal operator, not a Shadertoy buffer implementation.

The [multi-pass design](livecode-multipass.md) records the requested next phase:
editable tabs and interoperable graph nodes, named multi-input channels,
explicit feedback timing and GPU sound with user-started Web Audio output.
Current supported behavior remains unchanged at this checkpoint.

## Shader variables and shorthand

**GLSL mode** is a full pixel shader language. TOP/CHOP Expression is a smaller arithmetic language; the shader names below belong to GLSL mode.

| Name | GLSL type | Meaning |
| --- | --- | --- |
| `u_time` / `iTime` | `float` | Current render time, in seconds |
| `u_resolution` | `vec2` | Output size in pixels: `.x` width, `.y` height |
| `iResolution` | `vec3` | Same size, with `.z` set to `1.0` |
| `u_mouse` | `vec2` | Pointer position in output pixels, with origin at bottom left |
| `iMouse` | `vec4` | Same pointer position in `.xy`; `.zw` are zero, not click coordinates |
| `u_image` / `iChannel0` | `sampler2D` | Connected input image, not the previous rendered frame |
| `u_imageSize` | `vec2` | Connected input image size in pixels |
| `gl_FragCoord` | `vec4` | Current pixel position; use `.xy` for the two coordinates |
| `gl_FragColor` | `vec4` | Output RGBA color in WebGL 1 |

`iTime`, `iResolution`, `iMouse`, and `iChannel0` are Shadertoy-style aliases. Genereti supplies their declarations when they are used. Ordinary `u_time`, `u_resolution`, and `u_mouse` uniforms should be declared when used directly. Input uniforms and used `u_genereti…` uniforms are supplied automatically. `vec2`, `vec3`, and `vec4` mean two, three, and four numbers; `.xy` selects coordinates and `.rgb` selects color channels.

For a Shadertoy-style entry point:

```glsl
void mainImage(out vec4 color, in vec2 pixel) {
  vec2 uv = pixel / iResolution.xy;
  float wave = 0.5 + 0.5*sin(iTime + uv.x*12.0);
  color = vec4(vec3(wave), 1.0);
}
```

Genereti wraps `mainImage` with `main`. For WebGL 2, start with `#version 300 es`, declare an `out vec4` color for a normal `main`, and sample images with `texture`; WebGL 1 uses `gl_FragColor` and `texture2D`.

Performance uniforms are floats: `u_generetiTime`, `u_generetiBeat`, `u_generetiBar`, `u_generetiBpm`, `u_generetiTicks`, `u_generetiPhase`, `u_generetiRoot`, `u_generetiTuning`, `u_generetiPlaying`, and `u_generetiRate`. They correspond to the shared `__` performance values described above. Shader `iTime`/`u_time` is render time; `u_generetiTime` is the shared performance clock.

[Twigl](https://github.com/doxas/twigl#regulation) uses GLSL too, with compact aliases such as `t` (time), `r` (resolution), `m` (mouse), `f` (frame), `b` (backbuffer), `FC` (pixel coordinates), and `o` (WebGL 2 output). Those aliases and Twigl's helper snippets are not currently provided by Genereti. Genereti does not currently expose Shadertoy `iFrame`, `iTimeDelta`, `iDate`, `iChannel1`–`iChannel3`, or previous-frame feedback in Livecode GLSL. Start with the supported names in this table when adapting a shader.
