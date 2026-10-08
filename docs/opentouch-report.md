# OpenTouch: a creative stage inside ComfyUI

OpenTouch is our working name for a TouchDesigner-inspired operator library inside Genereti. It combines Comfy's graph and model ecosystem with the interactive programming surfaces from Underscores and Artist–Model Studio. Familiar operator names describe functionality; the interface follows our compact Livecode controls.

## Three interfaces, one creative graph

- **TOP** carries images and textures. Composite, feedback, arithmetic, transforms and filters run in our browser WebGPU renderer.
- **CHOP** carries named sampled channels. Oscillators, noise, expressions and processors drive ordinary FLOAT input sockets, including declared Livecode parameters.
- **DAT** carries string tables and documents. CodeMirror provides the editing surface; CSV, JSON, selection and expressions turn documents into usable data.
- **Three.js** remains the 3D renderer inside Livecode. TOP can process its IMAGE output, CHOP can control declared parameters, and DAT can supply text and numbers. There is no new SOP/POP/MAT engine in this milestone.

The node families are interfaces to the existing creative tools, rather than three separate applications. A Three.js sketch can take a texture as `inputTexture`, read `__.params.speed`, and emit IMAGE to a TOP chain. The same image can reach an overlay, graph backdrop, or a generator.

## Try the connected lesson

Open **ꘇ-OpenTouch-Operators-and-Lessons** under Workflows → Genereti. It is model-free and includes:

1. A `top.expression` texture, with familiar compact CodeMirror editing.
2. A CHOP oscillator, smoothing, and a FLOAT wire controlling texture arithmetic.
3. CSV → DAT cell → FLOAT controlling the texture chain.
4. Crop, corner pin, feedback and compositing, finishing in Image Preview.
5. A Three.js Livecode source and document/report nodes.
6. User-started MIDI and OSC nodes. They are disconnected from devices until you press Connect.

Open **Settings → Genereti → Learning → Interactive lessons**, or search **ꘇ OpenTouch lessons** in the command palette. A `dat.lesson` node holds editable guide JSON in CodeMirror. Its toolbar runs/stops the learner dialogue and exports the authored lesson; the dialogue itself only navigates/checks steps. The guides highlight actual tools and check learner actions. They never queue inference or open device permissions. “Open lesson workflow” creates a separate temporary Comfy workflow tab.

## Arithmetic expressions

TOP, CHOP and DAT expressions share a small arithmetic language, rather than arbitrary JavaScript or Python. It accepts numbers, `+ - * / % ^`, parentheses, `pi`, `tau`, and `sin`, `cos`, `tan`, `abs`, `sqrt`, `floor`, `ceil`, `exp`, `log`, `fract`, `min`, `max`, `pow`, `clamp`, `mix`, `step`.

```text
0.5 + 0.5*sin(t + x*12)*cos(y*12)
```

For TOP, `x` and `y` are normalized pixel centers, `i` is the pixel index, `c` is the RGB channel, `v`/`a` is its source value, and `w`/`h` are texture dimensions. Alpha is preserved; absent IMAGE generates an opaque texture. Live time is graph time plus the time control; Queue uses the explicit time control.

```text
sin(t*tau) * 0.5 + 0.5
```

For CHOP, `t` is sample time in seconds, `i` is sample index, `x` is normalized sample position, `c` is channel index, `v`/`a` is the input sample, `w` is sample count and `h` is channel count. `y` and `b` are zero. Without an input, the expression generates channels.

DAT expressions use row/column indices for `y`/`x`, column index for `c`, numeric cell content for `v`/`a`, and row/column counts for `h`/`w`. Non-numeric cells become zero. Device access, property access, loops and global execution are excluded.

## Connections and useful glue

Every CHOP has a named-channel output and a normal FLOAT output: the last sample of its first channel. Connect that FLOAT to a converted Comfy numeric input or a declared Livecode FLOAT parameter. Use `chop.select` first to choose a named channel.

DAT → CHOP conversion treats columns as channels and rows as samples, with an optional header row. `dat.cell` exposes one cell as STRING and FLOAT. `chop.todat` exposes sampled channels as a table. The six conversion directions are explicit: `dat.tochop`, `chop.todat`, `top.tochop`, `top.todat`, `chop.totop` and `dat.totop`.

TOP → CHOP samples RGBA into named row-major channels. TOP → DAT samples x/y/RGBA into rows. Both resize on the GPU before a bounded readback (1..64 pixels per axis, configurable rate, one in-flight read). Queue selects one IMAGE batch frame. CHOP → TOP packs channel rows as grayscale, or four channels as RGBA pixels using a configurable width. DAT → TOP maps numeric columns/rows to a grayscale matrix, with optional header skipping. These are data conversion boundaries, not lossless arbitrary document/image round trips; values clamp to 0..1, invalid numeric cells become zero. The lesson samples 8×8 at 2 Hz so conversions do not slow the full-rate stage.

Arbitrary Python nodes still run through Comfy Queue. They do not become realtime merely because their sockets connect to a live operator. Livecode supports changing numeric/string parameter sockets; connecting a DAT document to the Livecode source-code socket does not automatically compile that document in Live mode.

## Rendering and performance boundaries

A page shares one WebGPU device for TOP operators. Intermediate images use reusable GPU textures; no PNG/JPEG, HTTP upload or CPU readback occurs between TOPs. Expressions parse and compile once per source revision. Source canvas/bitmap ingress is uploaded once per dispatch. Existing Livecode and model inputs remain compatibility boundaries, with their own copies or encoding. TOP-to-data converters deliberately perform bounded readback; data-to-TOP converters upload a canvas and update at up to 10 Hz.

CHOP processing uses Float32Array blocks in the browser. Sample rate describes the signal timeline, not graph redraw FPS. Live scheduling is limited by browser animation frames: a one-sample 240 Hz configuration cannot deliver 240 updates on a 60 Hz display. Use a larger sample block for high-rate signal generation; MIDI/OSC outputs send the latest control values, not sample-accurate audio. Lag, Speed and Slope retain state across live blocks; their queued equivalents process one explicit block without persistent history.

Signal traces paint at up to 10 Hz while samples and downstream controls keep flowing. Freeze/minimize affect only the local view. TOP/Livecode scalar changes are coalesced to animation frames; ordinary Primitive controls also have a low-rate fallback poll. DAT recalculates changed tables at up to 10 Hz. Keep DAT documents out of per-pixel paths.

This is shared browser GPU resources and typed arrays. It is not OS shared memory, SharedArrayBuffer transport, a native shared Metal texture, or an end-to-end zero-copy Core ML pipeline. WebGPU requires a capable secure-context host. Queue uses installed Python/PyTorch/NumPy. Full Core ML generation remains macOS 14+ on Apple silicon.

## MIDI and OSC

MIDI uses user-started Web MIDI without SysEx. An empty device name selects the first available port; a device ID or exact name selects a particular one. Input channels are named `ch1.cc7`, `ch1.note60`, `ch1.pitch`, etc. Values normalize to 0..1. Output supports CC, note velocity/gate and pitch bend, with changed-value suppression and note-off on disconnect. Channel 0 on MIDI In means any channel. Browser/desktop Web MIDI availability varies; a browser without Web MIDI reports that limitation.

OSC uses a small Comfy Python UDP bridge bound to **127.0.0.1**. Input listens only after Connect, leases expire after 90 seconds without renewal, and the last disconnect closes its port. Outputs also require Connect. Numeric/boolean OSC messages and immediate bundles are supported; scheduled timetags, strings, blobs and remote-network destinations are outside this first pass. Receive events coalesce to 60 Hz; output sends latest values at up to 30 Hz with one request in flight. A reusable UDP sender avoids creating a socket per update.

Opening or queuing a workflow never performs MIDI or OSC I/O. Queued input device nodes return a zero placeholder; output device nodes pass their input through without sending. Physical MIDI hardware needs a separate device test; the browser protocol has been exercised with virtual ports. OSC has been exercised over real loopback UDP.

## Lessons and document export

A guide is a local `genereti-guide` JSON document with semantic node targets, narration, and allowlisted learner checks. It cannot supply arbitrary DOM selectors or execute code. Guides can be imported, registered through `window.generetiGuides`, or authored in the bundled catalog. Local playback keeps learner edits and restores the initial viewport when it ends. It does not capture the full graph for undo/recovery, record teacher actions, synchronize classrooms or upload learner activity.

DAT documents/tables and the `dat.lesson` authoring toolbar export Markdown/source and standalone static HTML. Lesson JSON can also be exported and re-imported for editing. Learner dialogues and the lesson chooser contain no document-export controls. Livecode's export menu now includes static Document HTML and Print / Save as PDF for Markdown, HTML and LaTeX, alongside its existing runtime HTML and source-script exports. KaTeX fonts are local and embedded in static HTML. Authored external image links remain links; they are not silently downloaded or embedded.

PDF opens the printable static document and uses the host's print dialog: choose Save as PDF. This preserves selectable text, tables and math instead of a screenshot. It is distinct from exporting the interactive graph itself. In hosts without printing, export HTML and print it from a regular browser.

## Barebones modular music

`chop.note`, `chop.sequencer` and `chop.arpeggiator` produce named `note`, `gate`, `velocity` and `step` controls. Pitch is raw MIDI 0..127, velocity/gate are 0..1. Sequence text accepts numeric pitches and `-` / `.` rests. BPM, division, gate fraction and velocity are regular Comfy controls. Arpeggiator supports up/down/updown and octave expansion; optional MIDI In uses held `chN.noteNN` channels. Without held input it uses its authored fallback notes.

Route a musical CHOP to `chop.midiout` in note mode, or to `chop.synth` / `chop.drumkit`. MIDI Out uses named note/gate/velocity channels when present and turns off the previous note on pitch changes, pause or disconnect. Synth and drums are user-started browser Web Audio endpoints. They pass CHOP through for further control routing, rather than introducing an audio-buffer wire type. Queue passes their data without playing sound. Each endpoint has its own level; voices release/clean up on stop/removal. One shared AudioContext runs all active endpoints.

Synth provides sine, subtractive, FM and reed voices with ADSR, cutoff/resonance, glide and vibrato. Drum kit procedurally generates kick (35/36), snare (38/40), closed hat (42/default) and open hat (46), without samples or downloads. Patterns and gates run on the browser control clock; this is not sample-accurate sequencing, a DAW, a VST host, a full Expressive Synth port, or a complete modular DSP/audio graph. Browser background throttling can affect rhythm. Three.js remains our 3D surface.

[BespokeSynth](https://github.com/BespokeSynth/BespokeSynth) informs the live-patchable control/module idea. The oscillator/filter/ADSR/expression structure draws on our Underscores Expressive Synth; this implementation is a small browser adapter, not copied Bespoke C++ or a new synth engine dependency.

A simple feedback relationship for the visual lesson is:

$$C_t = S_t + (1-\alpha_t)\,d\,T(C_{t-1})$$

The report and lesson exports use our local KaTeX renderer for these formulas.

## Next useful work

Prioritize a transport/clock interface, channel resampling/interpolation controls, trigger/envelope/event processors, and parameter mapping presets. A future DAT language bridge should explicitly distinguish editable source, data and evaluated code. A future shader node can expose multiple IMAGE inputs and familiar uniforms while remaining in our render system.

Keep geometry creation, cameras, lights and materials in Three.js for now. Defer NDI, OAK, Syphon/Spout and other device integrations. Before claiming performance improvements, measure the exact connected chain, its source rate, view costs, model round trip, and delivery FPS separately.

## Focused lesson and presentation examples

`ꘇ-Tutorial-Authoring.json` teaches making, testing and exporting a guide from
`dat.lesson`. `ꘇ-Interactive-Output-Views.json` demonstrates native document
scrolling, p5 pointer callbacks, active drawing, output-only nodes and floating
overlays. Both are model-free and available from the lesson chooser. Display
stacking and opacity leave the renderer and downstream texture unchanged.

## Independent modular audio follow-up

The ten `ꘇ mod.*` operators now provide a browser audio-bus graph, shared transport, editable sequencers, polyphonic synth, procedural drums, gain/pan, filter, delay, mixer and explicit output. They interoperate with CHOP notes/scalars while retaining separate Web Audio timing and resources. Legacy `chop.synth` endpoints described above remain unchanged. See [modular audio](modular-audio.md) and **ꘇ-Modular-Audio** for the first routed milestone and its limits.
