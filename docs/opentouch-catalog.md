# OpenTouch operator catalog

TouchDesigner-inspired functionality with Genereti controls. Stable internal IDs retain saved workflow compatibility. [Report](opentouch-report.md) explains transport, conversion and device boundaries. [Lessons](opentouch-lessons.md) covers authoring and exports.

49 original OpenTouch TOP/CHOP/DAT operators, plus 14 modular audio/analysis
operators and four performance controllers/converters.

## TOP

| Operator | Inputs | Outputs | Stable node ID |
| --- | --- | --- | --- |
| `ꘇtop.bloom` | image: IMAGE, threshold: FLOAT, radius: FLOAT, strength: FLOAT | image: IMAGE | `GeneretiTextureBloom` |
| `ꘇtop.channels` | image: IMAGE, image_b: IMAGE (optional), red/green/blue/alpha: COMBO, channels: RGB/RGBA | image: IMAGE | `GeneretiTextureChannels` |
| `ꘇtop.composite` | image: IMAGE, background: IMAGE, operation: COMBO, opacity: FLOAT | image: IMAGE | `GeneretiTextureComposite` |
| `ꘇtop.cornerpin` | image: IMAGE, tl_x: FLOAT, tl_y: FLOAT, tr_x: FLOAT, tr_y: FLOAT, br_x: FLOAT, br_y: FLOAT, bl_x: FLOAT, bl_y: FLOAT | image: IMAGE | `GeneretiTextureCornerPin` |
| `ꘇtop.crop` | image: IMAGE, left: FLOAT, top: FLOAT, right: FLOAT, bottom: FLOAT | image: IMAGE | `GeneretiTextureCrop` |
| `ꘇtop.displace` | image: IMAGE, displacement: IMAGE, amount_x/amount_y/center: FLOAT | image: IMAGE | `GeneretiTextureDisplace` |
| `ꘇtop.expression` | expression: STRING, width: INT, height: INT, time: FLOAT, image: IMAGE | image: IMAGE | `GeneretiTextureExpression` |
| `ꘇtop.feedback` | image: IMAGE, decay: FLOAT, translate_x: FLOAT, translate_y: FLOAT, scale: FLOAT, rotate: FLOAT, blend: screen/add/over | image: IMAGE | `GeneretiTextureFeedback` |
| `ꘇtop.feedbackref` | image: IMAGE (optional seed), reference: STRING/picker, width/height: INT | image: IMAGE | `GeneretiTextureFeedbackRef` |
| `ꘇtop.filter` | image: IMAGE, operation: COMBO, amount: FLOAT | image: IMAGE | `GeneretiTextureFilter` |
| `ꘇtop.noise` | algorithm: Perlin/simplex/value, dimensions: 1–4, width/height, scale, seed, z, time, speed, octaves, lacunarity, gain, color | image: IMAGE | `GeneretiTextureNoise` |
| `ꘇtop.math` | image: IMAGE, operation: COMBO, value: FLOAT, operand: IMAGE | image: IMAGE | `GeneretiTextureMath` |
| `ꘇtop.tochop` | image: IMAGE, sample_width: INT, sample_height: INT, sample_rate: FLOAT, batch_index: INT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiConvertTopToChop` |
| `ꘇtop.todat` | image: IMAGE, sample_width: INT, sample_height: INT, sample_rate: FLOAT, batch_index: INT | table: GENERETI_DAT, text: STRING | `GeneretiConvertTopToDat` |
| `ꘇtop.transform` | image: IMAGE, translate_x: FLOAT, translate_y: FLOAT, scale: FLOAT, rotate: FLOAT, flip_x: BOOLEAN, flip_y: BOOLEAN | image: IMAGE | `GeneretiTextureTransform` |

## CHOP

| Operator | Inputs | Outputs | Stable node ID |
| --- | --- | --- | --- |
| `ꘇchop.arpeggiator` | notes: STRING, octaves: INT, mode: COMBO, bpm: FLOAT, division: INT, gate: FLOAT, velocity: FLOAT, samples: INT, sample_rate: FLOAT, time: FLOAT, input: GENERETI_CHOP | notes: GENERETI_CHOP, value: FLOAT | `GeneretiMusicArpeggiator` |
| `ꘇchop.constant` | value: FLOAT, channels: INT, samples: INT, sample_rate: FLOAT, time: FLOAT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopConstant` |
| `ꘇchop.drumkit` | input: GENERETI_CHOP, level: FLOAT, decay: FLOAT, tone: FLOAT | notes: GENERETI_CHOP, value: FLOAT | `GeneretiMusicDrumKit` |
| `ꘇchop.expression` | expression: STRING, channels: INT, samples: INT, sample_rate: FLOAT, time: FLOAT, input: GENERETI_CHOP | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopExpression` |
| `ꘇchop.lag` | input: GENERETI_CHOP, seconds: FLOAT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopLag` |
| `ꘇchop.logic` | input: GENERETI_CHOP, threshold: FLOAT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopLogic` |
| `ꘇchop.math` | input: GENERETI_CHOP, operation: COMBO, value: FLOAT, low: FLOAT, high: FLOAT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopMath` |
| `ꘇchop.merge` | input: GENERETI_CHOP, other: GENERETI_CHOP | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopMerge` |
| `ꘇchop.midiin` | device: STRING, channel: INT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopMidiIn` |
| `ꘇchop.midiout` | input: GENERETI_CHOP, device: STRING, message: COMBO, channel: INT, number: INT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopMidiOut` |
| `ꘇchop.noise` | seed: INT, amplitude: FLOAT, offset: FLOAT, channels: INT, samples: INT, sample_rate: FLOAT, time: FLOAT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopNoise` |
| `ꘇchop.note` | note: INT, gate: BOOLEAN, velocity: FLOAT, samples: INT, sample_rate: FLOAT, time: FLOAT | notes: GENERETI_CHOP, value: FLOAT | `GeneretiMusicNote` |
| `ꘇchop.oscillator` | wave: COMBO, frequency: FLOAT, amplitude: FLOAT, offset: FLOAT, phase: FLOAT, channels: INT, samples: INT, sample_rate: FLOAT, time: FLOAT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopOscillator` |
| `ꘇchop.oscin` | port: INT, address: STRING | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopOscIn` |
| `ꘇchop.oscout` | input: GENERETI_CHOP, port: INT, address: STRING | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopOscOut` |
| `ꘇchop.select` | input: GENERETI_CHOP, pattern: STRING | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopSelect` |
| `ꘇchop.sequencer` | notes: STRING, bpm: FLOAT, division: INT, gate: FLOAT, velocity: FLOAT, samples: INT, sample_rate: FLOAT, time: FLOAT | notes: GENERETI_CHOP, value: FLOAT | `GeneretiMusicSequencer` |
| `ꘇchop.slope` | input: GENERETI_CHOP | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopSlope` |
| `ꘇchop.speed` | input: GENERETI_CHOP | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopSpeed` |
| `ꘇchop.synth` | input: GENERETI_CHOP, voice: COMBO, level: FLOAT, attack: FLOAT, decay: FLOAT, sustain: FLOAT, release: FLOAT, cutoff: FLOAT, resonance: FLOAT, glide: FLOAT, vibrato: FLOAT, vibrato_rate: FLOAT | notes: GENERETI_CHOP, value: FLOAT | `GeneretiMusicSynth` |
| `ꘇchop.todat` | input: GENERETI_CHOP | table: GENERETI_DAT, text: STRING | `GeneretiDatFromChop` |
| `ꘇchop.totop` | input: GENERETI_CHOP, layout: COMBO, width: INT | image: IMAGE | `GeneretiConvertChopToTop` |

## DAT

| Operator | Inputs | Outputs | Stable node ID |
| --- | --- | --- | --- |
| `ꘇdat.cell` | input: GENERETI_DAT, row: INT, column: INT | text: STRING, value: FLOAT | `GeneretiDatCell` |
| `ꘇdat.expression` | input: GENERETI_DAT, expression: STRING | table: GENERETI_DAT, text: STRING | `GeneretiDatExpression` |
| `ꘇdat.inspect` | Any input, JSON/text format, preview limit | text: STRING | `GeneretiDatInspect` |
| `ꘇdat.json` | text: STRING | table: GENERETI_DAT, text: STRING | `GeneretiDatJSON` |
| `ꘇdat.lesson` | guide: STRING | document: GENERETI_DAT, markdown: STRING | `GeneretiDatLesson` |
| `ꘇdat.merge` | input: GENERETI_DAT, other: GENERETI_DAT | table: GENERETI_DAT, text: STRING | `GeneretiDatMerge` |
| `ꘇdat.replace` | input: GENERETI_DAT, find: STRING, replace: STRING | table: GENERETI_DAT, text: STRING | `GeneretiDatReplace` |
| `ꘇdat.select` | input: GENERETI_DAT, start: INT, count: INT, columns: STRING | table: GENERETI_DAT, text: STRING | `GeneretiDatSelect` |
| `ꘇdat.table` | text: STRING, delimiter: COMBO | table: GENERETI_DAT, text: STRING | `GeneretiDatTable` |
| `ꘇdat.text` | text: STRING | table: GENERETI_DAT, text: STRING | `GeneretiDatText` |
| `ꘇdat.tochop` | input: GENERETI_DAT, sample_rate: FLOAT, header: BOOLEAN | channels: GENERETI_CHOP, value: FLOAT | `GeneretiDatToChop` |
| `ꘇdat.totop` | input: GENERETI_DAT, header: BOOLEAN | image: IMAGE | `GeneretiConvertDatToTop` |
| `ꘇdat.transpose` | input: GENERETI_DAT | table: GENERETI_DAT, text: STRING | `GeneretiDatTranspose` |

IMAGE uses normal Comfy image sockets; named blocks use `GENERETI_CHOP` and string tables use `GENERETI_DAT`. Conversion operators bridge all six directions. FLOAT/STRING scalar outputs connect to regular parameter sockets. Audio endpoints are silent until their own Start button; MIDI/OSC endpoints require Connect.

3D remains in Livecode Three.js. No SOP/POP/MAT family is introduced.

## MOD · independent Web Audio

See [modular audio](modular-audio.md) for routing, timing and queue boundaries.

| Operator | Inputs | Output | Stable node ID |
| --- | --- | --- | --- |
| `ꘇmod.transport` | BPM, swing | GENERETI_AUDIO_CLOCK | `GeneretiAudioTransport` |
| `ꘇmod.sequence` | Clock, pattern, division, gate, velocity | GENERETI_CHOP | `GeneretiAudioSequence` |
| `ꘇmod.drumsequence` | Clock, drum rows, division, velocity | GENERETI_CHOP | `GeneretiAudioDrumSequence` |
| `ꘇmod.synth` | CHOP notes, voice, ADSR, filter, glide, vibrato, polyphony | GENERETI_AUDIO_BUS | `GeneretiAudioSynth` |
| `ꘇmod.drumkit` | CHOP notes, level, decay, tone | GENERETI_AUDIO_BUS | `GeneretiAudioDrumKit` |
| `ꘇmod.gain` | Audio bus, level, pan, mute | GENERETI_AUDIO_BUS | `GeneretiAudioGain` |
| `ꘇmod.filter` | Audio bus, mode, cutoff, resonance | GENERETI_AUDIO_BUS | `GeneretiAudioFilter` |
| `ꘇmod.delay` | Audio bus, seconds, feedback, mix | GENERETI_AUDIO_BUS | `GeneretiAudioDelay` |
| `ꘇmod.mixer` | Four optional buses, channel gain/pan/mute/solo, master | GENERETI_AUDIO_BUS | `GeneretiAudioMixer` |
| `ꘇmod.output` | Audio bus, level, mute; explicit browser Start | GENERETI_AUDIO_BUS | `GeneretiAudioOutput` |
| `ꘇmod.scope` | Audio bus, FFT size, smoothing, display gain | Audio bus, stereo CHOP, RMS/peak FLOAT, IMAGE | `GeneretiAudioScope` |
| `ꘇmod.spectrum` | Audio bus, FFT size, smoothing, display gain | Audio bus, frequency/magnitude CHOP, RMS/peak FLOAT, IMAGE | `GeneretiAudioSpectrum` |
| `ꘇmod.lissajous` | Audio bus, FFT size, smoothing, display gain | Audio bus, stereo CHOP, RMS/peak FLOAT, IMAGE | `GeneretiAudioLissajous` |
| `ꘇmod.analyze` | Audio bus, FFT size, smoothing, display gain | Audio bus, level/band CHOP, RMS/peak FLOAT, IMAGE | `GeneretiAudioAnalyze` |

**ꘇ-Sound-Analysis** teaches all four views and wires RMS into a TOP opacity control. See [sound analysis](modular-audio.md#sound-analysis-and-visuals).

Recorded patch-building examples: **ꘇ-Feedback-AV-Build-Tutorial** starts with only the author node; **ꘇ-Feedback-AV-Recorded-Patch** opens the completed feedback/sequence/synth/delay/mixer graph. The lesson playlist supports sequential replay and pauses for explicit audio activation. See [recording and playback](opentouch-lessons.md#record-and-replay-a-patch-building-session).

Painterly example: **ꘇ-Painterly-Feedback-Tutorial** teaches fresh pigment → crossfade and delayed reference → displacement → blur → crossfade, with the final crossfade as the reference target. The completed companion is **ꘇ-Painterly-Feedback-Patch**. See the [texture guide](texture-operators.md#painterly-reference-feedback-tutorial), including the complete `top.expression` syntax reference.


### Inspect current values

Use `ꘇdat.inspect` (search `inspect`, `debug`, or `genereti dat`) to view numbers,
strings, objects, DAT tables and named CHOP samples in a read-only CodeMirror
display. Connect any output to its input. OpenTouch live values update at 10 Hz;
other Comfy values appear after Queue. Tensor/image data shows shape and dtype
without copying pixels. Arrays/objects show up to `limit` entries per level.
`json` formats structured data; `text` displays strings without JSON quotes.
Freeze pauses only the display. Text can be selected/copied or exported from
the toolbar; global editor appearance and per-node font shortcuts apply.
The display is runtime state, not saved data or a history log.

**ꘇ-Inspect-Values** demonstrates a live oscillator and a JSON DAT feeding two
inspectors. Restart Comfy and reload once to discover the new schema.

## Performance controllers and conversion

| Operator | Inputs | Outputs | Stable node ID |
| --- | --- | --- | --- |
| `ꘇchop.time` | unit, optional CLOCK | FLOAT, CHOP, JSON, CLOCK | `GeneretiPerformanceTime` |
| `ꘇmod.timeline` | dock/floating controls | description STRING | `GeneretiPerformanceTimeline` |
| `ꘇmod.scale` | root, scale, tuning | music JSON | `GeneretiPerformanceScale` |
| `ꘇchop.quantize` | CHOP, optional music JSON | quantized CHOP, first-channel FLOAT | `GeneretiPerformanceQuantize` |

`mod.transport` retains CLOCK output 0 and adds channels, seconds, beat and JSON.
TOP noise/expression and CHOP noise/expression have optional XYZ/T offset ports;
CHOP oscillator has T only. Code nodes share project `__` variables, with
`u_genereti*` uniforms in GLSL. See [performance time](performance-time.md) for
precise domains, frozen Queue behavior and the first automation timeline.
