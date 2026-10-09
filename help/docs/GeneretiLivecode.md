# Livecode quick reference

Choose the language before editing: p5, GLSL, Three.js, Tixy, Play Core, Manim, HTML, Markdown, SVG, LaTeX, Orca or HyperFrames. Strudel uses an external runtime. Use the node’s Run button or **Cmd/Ctrl+Enter** to evaluate. Stop holds the last frame. The lightning glyph controls automatic evaluation while typing.

## p5

```javascript
function setup() {
  createCanvas(windowWidth, windowHeight);
}
function draw() {
  background(20);
  circle(width/2, height/2, 80);
}
```

**width/height** set the rendering resolution in Fixed texture mode. Follow output instead uses the latest active viewer. Preview fit changes display framing, not the rendered resolution.

## GLSL

```glsl
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
void main() {
  vec2 uv = gl_FragCoord.xy/u_resolution;
  gl_FragColor = vec4(uv, 0.5 + 0.5*sin(u_time), 1.0);
}
```

Connected IMAGE is available as `inputImage` / `__.image` in browser code and `u_image` in GLSL. Code-defined parameters appear as numeric controls when supported by the language parser.

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

## Delivery

Live sends browser frames without submitting Comfy jobs. Comfy Queue renders for an explicit queue request. Local output windows, overlays and backdrops are optional viewers. Camera, screen capture and browser audio require explicit user actions.

For arithmetic-only texture formulas, use **ꘇ top.expression** and its syntax reference instead.

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
