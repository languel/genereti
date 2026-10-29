# Modular browser audio

The `ꘇ mod.*` family is an independent live Web Audio patching layer. OpenTouch
CHOP signals can supply notes or converted scalar parameters. Audio cables carry
`GENERETI_AUDIO_BUS` routes between native browser AudioNodes; they never move
PCM blocks through Comfy's Python queue. The nodes live in the existing CHOP
installation pack, with separate schemas, runtime and discovery prefix.

Open **Workflows → Genereti → ꘇ-Modular-Audio**. Press **▷ on mod.output** to
start sound, then edit the melody and drum grids, shape the synth, and mix the
channels. The included `dat.lesson` runs a six-step walkthrough and exports its
notes as Markdown, standalone HTML or Print / Save as PDF. Saving or queueing a
workflow never authorizes playback. Stop toggles the output off; **■ Panic**
stops all modular outputs. Removing an output or leaving the page also stops it.

The **♫** control on `mod.transport` and on the timeline starts or stops all
`mod.output` nodes in the current graph. Its pressed state follows those outputs,
including changes made from an individual output or Panic. With multiple outputs,
stopping the shared control stops all of them; starting it starts all of them.
Alt+Shift+Home also starts all modular outputs. The separate transport play button controls the clock. Loading a workflow,
playing the clock or queueing still does not start audio.

| Operator | Purpose |
| --- | --- |
| `ꘇ mod.transport` | Shared BPM/swing clock, pause and reset |
| `ꘇ mod.sequence` | Editable MIDI pitches, `-` rests, division, gate and velocity |
| `ꘇ mod.drumsequence` | Editable kick/snare/hi-hat rows, division and velocity |
| `ꘇ mod.euclidean` | Up to eight circular Euclidean tracks, each with steps, hits, rotation, MIDI note and velocity |
| `ꘇ mod.circlesequence` | Up to eight circular tracks with manually toggled steps |
| `ꘇ mod.pianoroll` | Polyphonic notes with position, length and velocity on a clocked grid |
| `ꘇ mod.pattern` | Transform a text melody with shift, reverse, transpose or explicit scale quantization |
| `ꘇ mod.karplus` | Plucked-string delay-line voice |
| `ꘇ mod.granular` | Procedural pitched grain cloud; no sample import |
| `ꘇ mod.synth` | Polyphonic sine, subtractive, FM or square/reed-style voice; ADSR, filter, vibrato and audition keys |
| `ꘇ mod.drumsynth` | Eight synthesized drum voices with independent tone, noise, pitch sweep, decay and filter settings |
| `ꘇ mod.drumkit` | Procedural kick, noise snare and hi-hat; no samples/downloads |
| `ꘇ mod.gain` | Gain, stereo pan and mute |
| `ꘇ mod.filter` | Low/high/bandpass or notch BiquadFilter |
| `ꘇ mod.delay` | Wet/dry delay and bounded internal feedback |
| `ꘇ mod.reverb` | Procedural convolution reverb with decay and wet/dry mix |
| `ꘇ mod.distortion` | Waveshaping drive with wet/dry mix |
| `ꘇ mod.mixer` | Up to eight buses with gain, pan, mute, solo and master level; strips follow connected inputs |
| `ꘇ mod.output` | Explicit Start, output level/mute, compressor, peak meter and Panic |

`mod.drumsynth` maps the drum sequencer to eight voices: kick (36), snare (38), closed hat (42), open hat (46), low tom (41), high tom (45), clap (39), and bell (56). Select a pad to edit its oscillator and noise envelopes, pitch sweep and filter; pressing a pad also auditions it when the output is running. A few common General MIDI alternate notes map to the closest voice. Other notes are silent. The settings are stored in the node's `kit` widget.

The instrument preset menu includes factory patches for `mod.synth`, `mod.karplus`, `mod.granular`, `mod.drumkit` and `mod.drumsynth`. Choose a name to recall it. Use **✚** to save the current settings as a named preset in that node's workflow properties; saved presets travel with the workflow. The synth's FM voice has separate ratio and depth controls. To try a sound, connect a sequencer or the instrument's on-screen keys to a running `mod.output`; presets do not start audio.

The generic routing nodes work without choosing a signal type. Name a `ꘇ.send` and `ꘇ.receive` alike for a workflow-local live connection; each name has one sender and can have several receivers. `ꘇ.merge` grows inputs as you connect them: it sums audio buses or numeric values, and combines CHOP channels, adding underscores when names collide. `ꘇ.select` grows inputs and chooses one by zero-based `index`; `ꘇ.route` sends its input to one numbered outlet and exposes an editable `outlets` count. Up to 64 sockets are supported. Reducing outlets preserves any connected outlets. Use a downstream gain or mixer to control summed audio levels.

Named routing works live in the browser. Queue cannot infer hidden dependencies, so a queued receive has no value; use ordinary cables for queued work. Single-source image streams can pass through send, receive, select and route; multi-image live merge is not implemented. Queue merge supports numeric values, CHOPs, and compatible tensor batches.

Hover a modular node and press **Alt+W** for an interactive overlay, **Alt+Shift+W** for an interactive output window, or **Alt+O** for the minimal node view. The window controls also provide these options. Opening a view does not start audio.

Transport provides local/project clock selection and the shared global musical root and scale. Optional live waveform traces for modular audio cables can be enabled under **Settings → Genereti → Audio → Audio cable waveforms**. They use the actual audio signal, apply to spline-style audio-bus cables, and add analyser and canvas work only while enabled. They are also disabled with Performance indicators.

Clock and note activity lights, sequencer playheads, triggered pads and keys, and meters are enabled by default. To reduce UI work, turn off **Settings → Genereti → Audio → Performance indicators**. Analysis nodes continue to produce their connected signals.

Shift-drag an existing note or drum hit vertically to change its velocity; the drawn mark changes size. Shift-drag an empty melody cell still draws a straight line; Shift on an empty drum cell paints an accent. The drill control repeats active steps. The Euclidean and circle sequencers expose independent rings with their own lengths, notes and velocity; add up to eight tracks and Shift-drag a hit to adjust its velocity. The piano roll accepts overlapping notes: drag empty space to draw and set length, drag a note to move it, drag its right edge to resize, Shift-drag for velocity, right-click to delete and wheel to scroll pitch. Its pattern and multitrack rings are saved in versioned JSON widgets. `chop.curve` maps a normalized numeric input through editable points. Its FLOAT output can feed supported numeric sockets. Named curve values are visible in Livecode as `__.curves[name].value`; recorded `chop.gesture` XY data is published as `__.curves["gesture_NODEID"]`. Curves currently use linear segments; importing Poliplan curves is not implemented.

Search `mod` or `genereti mod`. Stable internal IDs are `GeneretiAudio…`; saved
workflows keep these regardless of labels. The older `chop.synth` and
`chop.drumkit` remain independent speaker endpoints for compatibility. Their
CHOP output is control data, so it does not connect to a modular audio bus.

## OpenTouch interoperability

Connect CHOP `note`, `gate`, `velocity` channels to an instrument's `notes` socket.
Pitch is raw MIDI (0–127, including fractional pitches); velocity is 0–1 and gate
is on above 0.5. Named MIDI channels such as `ch1.note60` permit simultaneous
held notes. Connect `chop.midiin` explicitly to receive hardware input. CHOP
arpeggiators, generators and DAT-to-CHOP conversions can use the same input.
Glide applies to held plain-note pitch changes; the built-in sequencer schedules
separate notes. Custom native parameter sockets accept OpenTouch scalar values
when their widgets are converted to inputs. All parameters remain ordinary
Comfy controls; mixer faders mirror the same saved values.

With the performance pack installed, `clock_name=project` links transport to
the dock; `local` preserves an independent running clock for older patches.
CLOCK remains output 0; channels, seconds, meter beat and JSON are outputs 1–4.
See [performance time](performance-time.md) for global `__`, scale and recording.
The anchored transport maps musical deadlines onto the AudioContext timeline. Built-in sequences schedule up to
120 ms ahead on a 25 ms timer, rather than using graph redraws as note timing.
Transport/pattern changes cancel pending instrument voices; seek/reset and loop discontinuities
cancel pending notes, while pattern edits keep current musical position. Pausing stops
instrument voices, although delay tails may still decay. After a stalled browser
we skip missed steps rather than playing a backlog. CHOP-derived notes still
arrive at their control update rate. Sequence CHOP output reports the currently
playing step only while an instrument consumes it through a running output.

Audio modules and cables are reused across ticks; parameter changes use short
ramps. Delay feedback is capped at 0.85; arbitrary cable cycles are rejected.
Disconnected modules and stopped voices release their native resources. Multiple
outputs can share upstream modules and the AudioContext. Meter painting and
custom grid updates are bounded; there is no per-frame audio serialization.

## Sound analysis and visuals

Open **Workflows → Genereti → ꘇ-Sound-Analysis** for a six-step lesson and a
working audio-driven visual control. Restart Comfy once to register the new node
schemas, then reload the browser. These four nodes pass their incoming audio bus
through unchanged; use them inline or as parallel taps on an active patch.
They never start an unrelated instrument. Start a connected `mod.output` first.

| Operator | Channels output | Visual |
| --- | --- | --- |
| `ꘇ mod.scope` | `left`, `right` waveform blocks | Stereo oscilloscope |
| `ꘇ mod.spectrum` | `magnitude` (linear amplitude), `frequency` (Hz) | -90 to 0 dB on a linear frequency axis |
| `ꘇ mod.lissajous` | `left`, `right` waveform blocks | Left vs right XY trace |
| `ꘇ mod.analyze` | `rms`, `peak`, `correlation`, `low`, `mid`, `high` | Level/band bars |

Every tap also exposes `rms` and `peak` FLOAT sockets and an IMAGE drawing. Use
Alt+W/Alt+O or its viewing toolbar for an overlay/output-only scope; its IMAGE
can feed TOPs or Livecode. `display_gain` changes only the drawing, never the
sound or reported measurements. Waveform channels use the AudioContext sample
rate. Spectrum channels are frequency bins, **not sequential time samples**;
bin spacing is `sampleRate / fft_size`. The spectrum averages left/right power.

`mod.analyze` reports one control sample at up to 40 Hz. Low/mid/high are RMS
spectral amplitudes over 20–250, 250–2000 and 2000–20000 Hz (clipped at Nyquist),
not calibrated loudness or musical onset detectors. Correlation is +1 for the
same signal, -1 for inverse phase, and 0 for silence. Mono sources are upmixed to
stereo for analysis. FFT smoothing affects spectral bins, not waveform or RMS.

The example wires `mod.analyze → chop.select (rms) → chop.math (×12) →
top.filter (amount)` to animate opacity from sound. Connect a direct RMS/peak
FLOAT for simpler controls; use named CHOP channels to select bands or phase.
Analysis buffers and AudioNodes are reused; drawings and CHOP snapshots update
on the control timer. This is a visual/control bridge, not an audio-rate CHOP
processing engine. Stop/Panic clears all measurements; queued execution returns
silent channels/scalars and a placeholder IMAGE without reading live sound.

## Scope and verification

This is a first modular milestone, not a BespokeSynth port, DAW or VST host.
There is no sampler, microphone input, sample-rate
CHOP audio bridge, MIDI clock sync, MPE-complete instrument, or AudioWorklet DSP
module yet. The square/reed-style voice is a simple oscillator approximation.
Buses are live browser resources, not Comfy `AUDIO` tensors; queued execution
returns route descriptions or silent note data. Synth/effect processing runs in
Web Audio's engine, while event lookahead can still be affected by background
browser throttling. This layer is browser-portable and independent of the macOS
Core ML generator.

Analysis verification: 142 JavaScript tests passed, including RMS/phase, FFT bin
units, side-tap activation and buffer reuse; Python checks confirm the four
schemas and silent queue outputs. A separate browser test on port 8001 verified
all views, nonzero FFT/RMS, the CHOP → TOP control path, Panic returning controls
to zero, and lesson Hint / Do it changing the real pan parameter. The user
workflow on 8000 was left untouched.

Unit tests cover shared-route reuse, mixer mute/solo, voice limits, cleanup,
pattern validation, rests, simultaneous drum events, swing and MIDI channel
conversion. Browser checks exercise the real demo and OfflineAudioContext
rendering, including mixer silence. Hardware MIDI and subjective speaker/audio
latency are separate checks and have not been certified.

[BespokeSynth](https://github.com/BespokeSynth/BespokeSynth) informs the live
patch-cable model. Our Underscores `src/expressiveSynth.js` informs per-voice
oscillator/filter/envelope structure. This implementation adds no Bespoke C++
code or third-party audio engine dependency. `~/dev/expressivesynth` was not a
separate checkout on this machine.

The `ꘇ live recorder` accepts the `audio` output of a running `mod.output`
and an optional live IMAGE. It can save audio, video, or both together; the
output itself is never started by recording. See [Neuron Dance](neuron-dance.md)
for manual and project-loop capture, format and timing details.

Double-click a dial or its displayed value to type a numeric value. Enter applies, Escape cancels, and clicking away applies a valid entry. Empty or invalid entries preserve the current value. A focused dial also opens value editing with Enter.

The parameter-input gear lives in the top window/view toolbar of graphical modular audio nodes. It expands the native controls on the graph node and is omitted from detached window mirrors and Alt–O surfaces.

Drum synths expose optional `voice_1_…` through `voice_8_…` inputs for tone level, noise level, tone/noise decay, pitch start/end/decay, cutoff, waveform, MIDI note and gate. Drum kits expose per-pad level, decay, tone and gate inputs (`kick_…`, `snare_…`, and the other pad names). Unconnected ports preserve saved graphical settings. Connected controls override the corresponding voice; positive gate transitions trigger hits only while a connected audio output is running. Gates are sampled at the control tick rate, so use the notes bus for tightly scheduled rhythms.

Analysis textures now have linkable width and height controls (64–2048), and use the shared output-settings popover for resolution presets and aspect ratio. Lissajous has visible X/Y selectors: left, right, mid (L+R)/2, side (L−R)/2, sample deltas, one-sample delays, normalized time and zero. Its parameter inputs include independent X/Y gain, rotation, trail retention and line width. The main display gain multiplies both axes. Delta is a sample-to-sample difference, without sample-rate normalization. Split view swaps L/R between two panes while retaining the selected axes.

`mod.notevisualizer` takes a notes/MIDI/control CHOP and publishes an IMAGE texture and unchanged channels. Bars scroll across pitch rows; circles and diamonds scale with velocity and fade after release. The graphical controls set shape, size, fade time and history span. Native parameters set pitch range and control-meter visibility. This node opens no devices and starts no audio. Connect an explicitly enabled MIDI input or a sequencer notes output. Generic control channels appear as named meters below the roll.

Settings → Genereti → Audio → Audio cable waveform scale changes cable displacement from 0 to 5 times normal size (default 1). It has no effect on sound or analysis display gain.

Optional audio-cable waveforms follow Comfy’s spline, straight and linear link modes. Straight/linear traces retain native socket stubs and bends, with waveform displacement anchored at each corner. Native cable colors and stopped/silent rendering are preserved in every mode; the global waveform scale applies to all three.

Sequencer visual outputs (step melody, drum grid, Euclidean/circle rings and piano roll) are the sequence canvas, without surrounding controls. Use D over the node or with it selected for a solo graph backdrop; Shift+D adds it to the background grid. The IMAGE socket is appended after the existing notes socket, preserving saved note connections. Settings → Genereti → Views → Sequencer view resolution sets the longest texture edge to 256, 512 (default), 1024 or 2048, preserving the canvas aspect ratio. Live edits and playhead highlights are published to connected image consumers and background views.

Drum-pad buttons use monochrome instrument glyphs with readable hover tips and accessible labels. The drum sequencer's add-row menu retains its choices while open; option updates occur only when the set of existing rows changes.

Backdrop visibility and solo/grid mode are saved in workflow node properties and restored when the workflow opens.
