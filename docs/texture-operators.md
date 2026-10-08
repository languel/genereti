# Live texture operators

Install with `scripts/install_comfy.sh`, restart ComfyUI, and refresh the page.
Open **Workflows → Genereti → ꘇ-Texture-Lab**. It contains a transparent
p5 moving brush → Feedback → Blur → Corner Pin → Composite → Image Preview.
No model download, Core ML server, camera permission or external service is needed.
`ꘇ-Texture-Queue.json` exercises all seven operators using ordinary Comfy
constant images, including batch broadcasting; choose Run to render it.

The first pack is `integrations/genereti_comfy_texture`. These are normal IMAGE
nodes in Comfy Queue, and browser GPU operators in Live mode. Their internal
IDs begin with `GeneretiTexture`.

| Operator | Behavior |
| --- | --- |
| `top.composite` | Alpha-aware over/under, add, multiply, screen, difference, crossfade. Image is A, background is B; opacity controls A (B for under). B scales to A. |
| `top.math` | RGB multiply/add/subtract/divide/difference/minimum/maximum. Optional operand IMAGE replaces scalar value. Preserves A alpha; results clamp to 0..1. |
| `top.filter` | Level gain, invert, monochrome, threshold, opacity, nine-tap blur, Laplacian edge. Amount is gain/blend/threshold/opacity or radius in pixels, as appropriate. |
| `top.transform` | Translation in fractions of image size, clockwise rotation in degrees, scale about center, X/Y flips. Output resolution stays the same; outside is transparent. |
| `top.crop` | Normalized source rectangle stretched over the existing resolution. Right/bottom must exceed left/top. |
| `top.cornerpin` | Projective mapping to four normalized destination corners, TL/TR/BR/BL. Outside is transparent. Degenerate quads report an error. Controls are numeric for now. |
| `top.feedback` | Current image blended with its transformed, alpha-decayed previous result. Screen (default) or add reveals history beneath opaque black; over uses source alpha. Two GPU textures alternate; the loop arrow resets history. Queue returns current input without history. |
| `top.feedbackref` | Previous frame of a selected live node/output. Optional image seeds the first frame; otherwise starts transparent at width/height. Supports downstream targets without a cyclic IMAGE wire. Queue returns seed/transparent image and does not follow browser references. |
| `top.bloom` | Brightness threshold, separable nine-tap Gaussian blur, additive glow. Radius in source pixels; strength controls glow. Four GPU passes with reusable intermediate textures. |
| `top.displace` | Source image displaced by map red/green minus center (default 0.5). X/Y amounts are fractions of source size. Outside is transparent. |
| `top.channels` | Extract/reorder/combine A and optional B channels, alpha or luminance; zero/one constants. RGB output forces opaque live alpha and returns three channels in Queue. RGBA routes alpha explicitly. B defaults to A. |

An opaque full-frame source covers history with **over** blending; choose screen
or add for bright marks on black, or provide transparent source frames. Decay is
per rendered frame, so changing frame rate changes trail duration.

## Reference-based feedback

Keep the convenience `top.feedback` for self-contained trails. Use `top.feedbackref`
when you want processors inside the loop:

```text
fresh source ───────────────────────────────→ composite → viewer
feedbackref → process / decay / displacement → background ↑
      ⋯ reference the final composite's previous frame ⋯
```

The picker stores a persistent node reference plus output slot. You can also type
`#12` for a node ID, `@persistent-reference`, or an unambiguous node title.
Convert the `reference` STRING field to an input using Comfy's context menu to
drive it from a PrimitiveString or DAT string output. This is a reference field,
not an IMAGE edge; only normal IMAGE cables participate in queued execution.
Missing/deleted references never fall back to an unrelated node with a reused ID.
Pick a live IMAGE source/output; queued-only Python effects are not live producers.

Reference frames are copied immediately into alternating GPU textures and latched
after the entire graph tick. Referencing the composite creates recursive history;
referencing the fresh source gives a one-frame delay. Clear delayed reference frame
resets to the seed. History is runtime state and is not saved in workflows.

Open **ꘇ-Feedback-Reference-Chain** for the basic loop and
**ꘇ-Class-Feedback-Bloom-Displace** for colored dots, bloomed history driving
displacement, independent old/fresh level controls, screen compositing and channel
routing. Both include clickable `dat.lesson` walkthroughs and appear in the lesson
library. They reproduce the functional chain rather than TD's exact effect presets.

## Color and channels

`top.expression` evaluates once per RGB component: `c=0` red, `c=1` green,
`c=2` blue. A formula without `c` produces the same value in each component.
For a simple colored generator try `0.5 + 0.5*sin(t + x*12 + c*2.094)`.
The class example separates a shared moving shape mask from channel-dependent color.
Expression preserves input alpha (or uses 1 without input); use `top.channels`
to construct alpha from A/B alpha or luminance, or to swap/combine streams.
For a grayscale extraction, route `luma` to all RGB outputs; for an alpha mask,
route `a` to all three. `br/bg/bb/ba/bluma` read B. CHOP sources already expose
channel counts and CHOP/DAT↔TOP conversion nodes bridge sampled numeric data.

Numeric controls use Comfy’s usual convert-to-input sockets. Built-in Primitive
values update Live mode too; arbitrary Python scalar computations update on Queue.

The first input defines output resolution. Width/height remain properties of the
source texture. Most operators preserve RGBA alpha; Channels can route/replace it,
and bloom expands it around transparent glow. Interpolation uses
premultiplied color to avoid transparent-edge halos. Queued operations handle full
batches; a single B image broadcasts across A's batch, otherwise batch sizes must
match. Queued work uses PyTorch on the input tensor's device.

## GPU path and its boundaries

One WebGPU device is shared by this pack within each Comfy browser page. Sources
enter through the existing ImageBitmap/canvas live bus. Each producer dispatch is
uploaded once, including branched chains. Intermediate operators share borrowed
GPUTexture handles, with reusable RGBA8 targets and uniform buffers. The scheduler
coalesces updates into one render per operator per animation frame and evaluates
dirty dependencies before their consumers. There is no PNG/JPEG encoding, HTTP
round trip, or CPU readback between these operators.

Visible node previews add GPU presentation passes. Freeze takes a one-shot PNG
snapshot because WebGPU canvas swap buffers may expire after presentation; this
readback happens only when Freeze is pressed. Freeze/minimize controls affect
only the local view; downstream frames keep flowing. Output window, in-Comfy
overlay and graph backdrop reuse the existing controls and shortcuts (D, Alt+W,
Alt+F). Image Preview and existing generator inputs receive a drawable canvas
only when they subscribe: this is the compatibility boundary. Existing model
inputs still encode/upload frames as their implementation requires. Livecode
input is also a compatibility boundary, rather than a shared WebGPU texture.

This is **browser GPU sharing**, not OS shared memory, native Metal texture
sharing, worker SharedArrayBuffer transport, or a zero-copy end-to-end Core ML
pipeline. Those require further work. RGBA8 is deliberately bounded to 0..1;
HDR/float texture formats and color-management controls are future extensions.
No NDI, Syphon/Spout, OAK or other device integrations are included.

Live mode requires WebGPU in a secure context (loopback qualifies). Unsupported
hosts show an error and can use Comfy Queue; there is no silent CPU live fallback.
Maximum live texture dimension is 4096 or the device limit, whichever is smaller.
Device loss reports an error; reload to recreate the device. Pure Python nodes
between live operators do not run automatically: use Queue for those paths.

## Verification and measurement

```sh
node --test tests/test_texture_gpu.mjs
# With Comfy already running on loopback port 8000:
python3 scripts/check_texture_queue.py
# Use the same Python environment as ComfyUI, with torch installed:
/path/to/comfy/.venv/bin/python -m unittest discover -s tests -p test_texture_ops.py
# Serve the repository, then open the browser validation page:
python3 -m http.server 8002 --bind 127.0.0.1
# http://127.0.0.1:8002/tests/texture-browser.html
```

The browser check compiles WGSL, validates transparent compositing and projective
identity pixels, exercises all operator families, and measures 240 offscreen
frames through a 512×512 composite/blur/transform chain. Its throughput number
excludes source rendering, display refresh, model inference and compatibility
conversion. Use delivered FPS below each preview to measure the live graph;
it is distinct from Comfy's corner graph-redraw FPS.

`top.expression` generates or processes pixels with our bounded arithmetic language. `top.tochop` and `top.todat` are explicit CPU readback boundaries with sampling size/rate controls. `chop.totop` and `dat.totop` upload signal/table data. Native scalar sockets can be driven by CHOP FLOAT or DAT cell outputs. See the [complete catalog](opentouch-catalog.md) and [performance report](opentouch-report.md).

## Coherent noise

`ꘇ top.noise` provides Perlin gradient, simplex and interpolated value noise in
1–4 dimensions. A shared deterministic integer hash keeps browser scalar,
WebGPU and queued NumPy results consistent (GPU output has floating-point and
8-bit texture rounding). Perlin uses quintic interpolation, following the
[improved-noise approach](https://cs.nyu.edu/~perlin/noise/); this implementation
uses its own gradients and hash, so it does not reproduce p5 or TD seed tables.
1D simplex uses the 1D gradient-noise equivalent.

Choose scale, seed, grayscale/RGB, and up to six normalized octaves; lacunarity
controls the frequency multiplier and gain the amplitude multiplier. Seed offsets
the domain. 1D/2D animation translates x; 3D moves through z; 4D keeps a separate
z slice and time coordinate. Speed zero holds the field. Live time follows the
graph clock; Queue samples the explicit time value. Noise stays in the shared GPU
texture chain with no per-frame CPU readback. More octaves and dimensions cost
more work per pixel; start with one octave for a performance baseline.

TOP and CHOP expressions accept `noise(...)` (alias for `perlin`), `perlin(...)`,
`simplex(...)`, and `value(...)`, each with 1–4 scalar coordinates. Results are
signed, approximately -1..1; map them to display range explicitly:

- `0.5+0.5*noise(x*8,y*8)` — 2D Perlin.
- `0.5+0.5*simplex(x*8,y*8,t*0.2)` — evolving 3D simplex.
- `0.5+0.5*perlin(x*8,y*8,0.5,t*0.2+c*2)` — 4D colored noise.
- `noise(t*0.5+c*2)` — a 1D CHOP control signal.

Open **ꘇ-Noise-Dimensions** for the four-step mini-demo. The class feedback demo
now includes Hint and Do it on all seven steps. Do it restores the selected
step's existing-node parameters and wires; the final step opens the output
overlay. Hints suggest manual experiments before restoring the demonstrated
recipe. Reload the page and reopen the saved workflow to replace an older
embedded lesson. Adding `top.noise` requires a Comfy restart to register its schema.

## Painterly reference-feedback tutorial

Open **ꘇ-Painterly-Feedback-Tutorial** for a lesson-only starter, or
**ꘇ-Painterly-Feedback-Patch** for the completed graph. The lesson library also
has **Open painterly feedback tutorial**. Each of its six steps includes Hint
and Do it; Play remaining builds the whole graph. The source is procedural, so
this example needs no image asset, model, camera or external service.

```text
broad noise → pigment palette ──→ fresh pigment (+ fine grain) ────→ cross → viewer
                                   ↓ seed                          ↑ A     ⋮
                               feedbackref → displace → blur ──────┘ B     ⋮
                                   ↑             ↑                         ⋮
                                   └── reference cross, previous frame ─────┘
                                            RGB flow noise → displacement
```

The feedbackref IMAGE input seeds history; it is not a live second texture to
blend. The reference picker selects **painted result / REF TARGET**, the final
crossfade, so next frame receives the previous completed result. Referencing
fresh pigment instead merely delays that source. A feedbackref with no connected
output cannot influence the viewed result. Its reset arrow clears accumulated
history. Queue returns the seed only: this recursive effect runs in Live mode.

Crossfade opacity weights **image A**, here fresh pigment: `0.06` gives 6% fresh
and 94% processed history. Larger values refresh faster; smaller values keep
older brush marks. Displacement uses flow-map R/G for X/Y, centered at 0.5;
amounts are fractions of image size. The blur is 0.7 source pixels. These are
per-frame effects, so frame rate changes their apparent strength and memory.

## Expression language reference

Write one arithmetic expression, without an assignment, `return`, or semicolon.
It is parsed once and compiled to WGSL in Live; Queue evaluates it with NumPy.
This is a bounded math language, not JavaScript. Expressions are limited to 2048
characters. Parentheses, decimal/scientific literals, unary `+`/`-`, and binary
`+ - * / % ^` are supported; `^` means power, not XOR. Use parentheses for clarity.

| Name | Meaning in TOP |
| --- | --- |
| `x`, `y` | Normalized pixel-center coordinates, 0..1 |
| `i` | Linear pixel index (`row * width + column`) |
| `c` | RGB component index: 0 red, 1 green, 2 blue |
| `v`, `a` | Input value of the current RGB component; 0 without an image |
| `b` | Reserved second operand, currently 0 |
| `t` | Live graph seconds plus time offset; explicit time in Queue |
| `w`, `h` | Output dimensions; input IMAGE overrides width/height |
| `pi`, `tau` | π and 2π constants |

Functions and argument counts:

- One argument: `sin`, `cos`, `tan`, `abs`, `sqrt`, `floor`, `ceil`, `exp`, `log`, `fract`.
- Two arguments: `min(a,b)`, `max(a,b)`, `pow(a,b)`, `step(edge,x)`.
- Three arguments: `clamp(x,low,high)`, `mix(a,b,weight)`.
- One to four coordinates: `noise(...)`, `perlin(...)`, `simplex(...)`, `value(...)`.
  Noise functions return signed values; `noise` aliases Perlin. Map to 0..1 when displaying.

`step(edge,x)` returns 0 below the edge and 1 otherwise. `mix` linearly blends
its first two arguments. Each RGB result clamps to 0..1; input alpha is preserved,
or opaque without input. There are no statements, loops, comparisons, ternaries,
vector constructors, property access or arbitrary functions. Route alpha with
`top.channels`. Keep function domains valid (for example positive `log` inputs).

Try `0.5+0.5*sin(t+x*12+c*tau/3)` for colored waves,
`0.5+0.5*simplex(x*5,y*5,t*0.1+c*2)` for colored noise, or
`step(0.5,v)` to threshold an input image. A formula without `c` or varying input
RGB values appears monochrome.
