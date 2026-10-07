# Livecode image pipelines and audio-reactive sketches

These three model-free workflows ship in
`integrations/comfyui_genereti/workflows/` and install into **Workflows → Genereti**.
They also open in separate tabs through **Settings → Genereti → Learning → Open lessons**.
Run the workflow's `dat.lesson`, or click an outline item to jump to that step.
**? Hint** explains the exercise; **▶ Do it** applies its saved parameter/wiring
actions. The audio-start step is manual. Export Markdown, HTML or Print / PDF
from the lesson node toolbar.

## ꘇ-Livecode-Shader-Buffers

Three Livecode GLSL passes show fresh RGB ink, transformed/faded history and a
final display grade. They use `mainImage`, `iTime`, `iResolution` and `iChannel0`
aliases. The lesson covers this graph:

```text
Fresh GLSL ──────────────────────────→ Composite (A) → Image GLSL → Preview
    └→ FeedbackRef seed → Warp GLSL → Composite (B)
           ↑ previous tick of Composite, selected by reference
```

`top.feedbackref.reference` picks **the composite**, which is the end of the
feedback loop. Its IMAGE input seeds the initial frame; it does not specify the
history target. The reference captures one graph tick behind and avoids a cyclic
Comfy IMAGE connection. Lower the warp pass's `decay` to shorten trails. Clear
the delayed reference frame when you want to restart the painting.

Each Livecode node currently has **one IMAGE input**. For GLSL it is `u_image`
or the `iChannel0` alias. These are connected external buffer passes; internal
Shadertoy Common/A–D/Sound tabs, `iChannel1..3`, and full Shadertoy project import
remain pending. Livecode images cross separate browser runtimes; add `dat.monitor`
to measure your graph. This example makes no GPU-sharing or frame-rate guarantee.

An annotated value becomes a uniform and a regular parameter/socket:

```glsl
float decay = 0.96; /* 0..0.99 step:0.01 */
```

The lesson distinguishes the additive composite from an opaque source-over
blend, which would hide the history's black background.

## ꘇ-Livecode-P5-Pipeline

An interactive p5 source paints colorful dots. Its IMAGE feeds a second p5
sketch, which tiles and mirrors `inputImage`. Each sketch has its own `setup`,
`draw`, `frameCount` and pointer; pixels travel through the wire, not JavaScript
variables or DOM elements. The processor guards `if (!inputImage) return` until
its first frame arrives.

Hold and move the pointer inside the source's **output**, then watch the larger
light spot appear in the tiled output. The lesson reconnects the image stream,
changes tile count, and adjusts animation speed. Open the source using **Alt+W**
or **Alt+O** if the editor is taking up space. Overlay click-through must be off
for pointer interaction.

```js
let tiles = 3; /* 1..6 */
// in draw(), after checking inputImage:
image(inputImage, 0, 0, width, height);
```

`tiles` is the friendly label; `controls.value0` is its stable socket ID.
Queue captures a frozen image from each runtime; it does not merge them.

## ꘇ-Livecode-Audio-Visual

A local `mod.transport` and note sequence feed an FM voice, gain/balance and
`mod.output`. Press **Start on mod.output** yourself to hear the quiet patch.
Neither opening the workflow nor guide playback activates sound. **Panic** stops
all outputs, and saving never retains a playing AudioContext.

The gain bus feeds waveform, spectrum, Lissajous and general analysis taps:

```text
mod.analyze.channels → chop.select (rms) → chop.math (×12)
                                          FLOAT → Livecode energy
```

The p5 `energy` parameter is clamped to 0..1. Rings grow with measured RMS, while
the mouse draws a light spot in the same output. Its unconnected `sensitivity`
parameter scales the visual response without changing sound. A connected value
overrides its local widget default. These are control-rate measurements, not an
audio-rate CHOP DSP engine.

Display gain changes the analysis drawing, not speaker volume. Larger FFT sizes
increase frequency detail and the measurement window. Panning a mono signal
tilts a Lissajous line; it does not create a phase loop. Panic returns measured
RMS/visual energy to zero.

## Rebuild the examples

With the packs loaded in Comfy, regenerate their workflow JSON, portable guide
JSON and catalog entries:

```sh
python scripts/build_livecode_lessons.py --server http://127.0.0.1:8001
```

This reads `/object_info` and writes the three supplied examples. It does not
alter open workflows or start sound/capture. Stable UUID references let Hint/
Do it resolve the correct instance when several Livecode nodes share a type.
