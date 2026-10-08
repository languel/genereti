# Livecode quick reference

Choose the language before editing: p5, GLSL, Three.js, Strudel, HTML or Markdown. Use the node’s Run button or **Cmd/Ctrl+Enter** to evaluate. Stop holds the last frame. The lightning glyph controls automatic evaluation while typing.

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

## Delivery

Live sends browser frames without submitting Comfy jobs. Comfy Queue renders for an explicit queue request. Local output windows, overlays and backdrops are optional viewers. Camera, screen capture and browser audio require explicit user actions.

For arithmetic-only texture formulas, use **ꘇ top.expression** and its syntax reference instead.
