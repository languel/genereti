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
