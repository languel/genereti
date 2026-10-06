# Livecode multi-pass and GPU sound design

Checkpoint: **2026-10-06**. This is the next implementation brief, not a list of
shipped features. The working baseline is `a454de1`: painterly reference-feedback
lessons, pointer-path recording and the expression-language reference. See
[livecode languages](livecode-languages.md#glsl-compatibility-checkpoint--2026-10-06)
for the current single-pass compatibility limits.

## Authoring and graph composition

Support both a multi-tab project and independent connected Livecode nodes.
A Shadertoy project naturally groups Common, Buffer A–D, Image and Sound source
in one authoring surface. p5/JavaScript projects need named source/helper tabs
with explicit execution order and one entry sketch. Tabs describe project source;
they should not silently create a new audio context or clock per editor.

Separate nodes remain useful for teaching and patching: a source, processing pass
or output may live on another node and feed a named channel. Use the same runtime
and channel-binding model for internal project passes and graph-node references.
Tab labels, pass titles and persistent node/output references must survive save,
copy/paste, replay and export. Preserve existing single-source workflows without
rewriting their code, IDs or behavior. Keep dialect selection explicit when
automatic detection would be ambiguous.

## Render graph and feedback contract

A visual pass has source, dialect, resolution/format and channel bindings.
Channels specify source kind, pass or persistent node/output reference, frame
choice, filtering and wrap mode. Expose four GLSL samplers (`iChannel0`–`3`) and
channel size/time metadata; p5 and other adapters receive named image/texture
inputs through their own language-appropriate bridge.

Current-frame dependencies are evaluated in a defined topological order.
Self-reference and intentional feedback sample the previous completed frame
using alternating textures. Do not infer ambiguous cross-pass cycles from node
placement, tab order or a reused graph ID. Reset clears histories and frame state
in one operation. Pause/resume, resizing, source replacement and compilation
failure need explicit, tested rules. Keep the last good program while reporting
compile errors in the correct tab. Avoid an IMAGE readback/reupload between
passes in the same GPU context; document conversion boundaries across existing
isolated Livecode contexts and the OpenTouch WebGPU bus instead of claiming
zero-copy sharing between incompatible contexts.

## Shader formats

Implement standard GLSL and `mainImage`, plus an explicit compact/Twigl body
wrapper with `FC`, `o`, `r`, `t`, mouse/frame and texture aliases. Borrow the
normalization and tested examples from Underscores
(`src/shaderLivecode.js`, `src/shaderLivecode.test.js`) where licensing permits.
Its adapter supplies short aliases and some feedback facilities; it is not an
existing complete Shadertoy project/sound engine. Inspect Artist–Model Studio's
board, source and reference conventions for transferable integration patterns.

Full Shadertoy compatibility is an acceptance target: Common, A–D, Image,
Sound; supported built-ins including frame/delta/date/sample rate and channel
metadata; accurate mouse-down/origin state; 2D/cube texture and keyboard/media
channel semantics; sampler modes; buffer precision; and saved/imported pass
routing. Check actual fragcoord/fragment.xyz and Twigl examples against their
source contracts rather than treating all short GLSL as one dialect. Remote
project import must retain asset/license metadata and report unavailable assets;
opening a tutorial must not silently fetch media or request device access.

## GPU-generated sound

Compile Shadertoy `mainSound(int sampleIndex, float time)` into a GPU sample
renderer returning stereo audio. Schedule sample blocks at the AudioContext's
sample rate, independently of the display frame rate. Feed a bounded Web Audio
queue/AudioWorklet, with controlled lookahead, underrun reporting and cleanup.
Measure render/readback cost; GPU rendering alone does not make playback latency
or scheduling reliable. Verify float render-target availability and any packed
fallback rather than assuming it on every browser.

Sound starts only through an explicit user Start control. Provide gain/mute,
Stop/Panic and graph disposal, and interoperate with the independent `mod.*`
audio bus. Loading a workflow, playing a lesson, compiling or queuing Comfy
must not start audio. Clarify Sound-pass visualization, audio-derived channel
textures and whether offline/exported sound uses the same sample clock.

## Implementation and acceptance order

1. Define and version project/pass/channel data; preserve legacy single-code nodes.
2. Share the dialect compiler; demonstrate standard, mainImage and compact shaders.
3. Add four-channel binding, pass scheduling and ping-pong feedback. Demonstrate
   an A/B simulation rendered by Image, both internal and across nodes.
4. Add reusable themed source tabs and compile diagnostics, p5 helper tabs and
   save/reload/export handling. Keep output-only and interactive overlays working.
5. Add GPU Sound rendering and explicit Web Audio routing. Compare known stereo
   samples, verify scheduling/underruns, Stop/Panic and silence before Start.
6. Audit remaining Shadertoy built-ins/channel types, teach the model in mini
   lessons, and test representative class shaders before claiming full support.

Required browser checks include old workflow loading, source edit during playback,
missing inputs, recursive versus one-frame-delay behavior, same-frame dependency
order, independent pass sizes, resize/reset, failed compilation, persistence,
standalone export and output interaction. Test audio sample values and scheduling;
hardware listening and latency are separate verification claims.
