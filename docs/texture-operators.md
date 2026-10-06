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
