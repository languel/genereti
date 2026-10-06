# Modular browser audio

The `ꘇmod.*` family is an independent live Web Audio patching layer. OpenTouch
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

| Operator | Purpose |
| --- | --- |
| `ꘇmod.transport` | Shared BPM/swing clock, pause and reset |
| `ꘇmod.sequence` | Editable MIDI pitches, `-` rests, division, gate and velocity |
| `ꘇmod.drumsequence` | Editable kick/snare/hi-hat rows, division and velocity |
| `ꘇmod.synth` | Polyphonic sine, subtractive, FM or square/reed-style voice; ADSR, filter, vibrato and audition keys |
| `ꘇmod.drumkit` | Procedural kick, noise snare and hi-hat; no samples/downloads |
| `ꘇmod.gain` | Gain, stereo pan and mute |
| `ꘇmod.filter` | Low/high/bandpass or notch BiquadFilter |
| `ꘇmod.delay` | Wet/dry delay and bounded internal feedback |
| `ꘇmod.mixer` | Four buses with gain, pan, mute, solo and master level |
| `ꘇmod.output` | Explicit Start, output level/mute, compressor, peak meter and Panic |

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

Transport uses an AudioContext timeline. Built-in sequences schedule up to
120 ms ahead on a 25 ms timer, rather than using graph redraws as note timing.
Transport/pattern changes cancel pending instrument voices; transport changes
reset the shared phase, while pattern edits keep its current phase. Pausing stops
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
| `ꘇmod.scope` | `left`, `right` waveform blocks | Stereo oscilloscope |
| `ꘇmod.spectrum` | `magnitude` (linear amplitude), `frequency` (Hz) | -90 to 0 dB on a linear frequency axis |
| `ꘇmod.lissajous` | `left`, `right` waveform blocks | Left vs right XY trace |
| `ꘇmod.analyze` | `rms`, `peak`, `correlation`, `low`, `mid`, `high` | Level/band bars |

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
There is no sampler, microphone input, audio-file recording/export, sample-rate
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
