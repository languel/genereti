# OpenTouch operator catalog

TouchDesigner-inspired functionality with Genereti controls. Stable internal IDs retain saved workflow compatibility. [Report](opentouch-report.md) explains transport, conversion and device boundaries. [Lessons](opentouch-lessons.md) covers authoring and exports.

44 registered operators in this checkpoint.

## TOP

| Operator | Inputs | Outputs | Stable node ID |
| --- | --- | --- | --- |
| `top.composite` | image: IMAGE, background: IMAGE, operation: COMBO, opacity: FLOAT | image: IMAGE | `GeneretiTextureComposite` |
| `top.cornerpin` | image: IMAGE, tl_x: FLOAT, tl_y: FLOAT, tr_x: FLOAT, tr_y: FLOAT, br_x: FLOAT, br_y: FLOAT, bl_x: FLOAT, bl_y: FLOAT | image: IMAGE | `GeneretiTextureCornerPin` |
| `top.crop` | image: IMAGE, left: FLOAT, top: FLOAT, right: FLOAT, bottom: FLOAT | image: IMAGE | `GeneretiTextureCrop` |
| `top.expression` | expression: STRING, width: INT, height: INT, time: FLOAT, image: IMAGE | image: IMAGE | `GeneretiTextureExpression` |
| `top.feedback` | image: IMAGE, decay: FLOAT, translate_x: FLOAT, translate_y: FLOAT, scale: FLOAT, rotate: FLOAT | image: IMAGE | `GeneretiTextureFeedback` |
| `top.filter` | image: IMAGE, operation: COMBO, amount: FLOAT | image: IMAGE | `GeneretiTextureFilter` |
| `top.math` | image: IMAGE, operation: COMBO, value: FLOAT, operand: IMAGE | image: IMAGE | `GeneretiTextureMath` |
| `top.tochop` | image: IMAGE, sample_width: INT, sample_height: INT, sample_rate: FLOAT, batch_index: INT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiConvertTopToChop` |
| `top.todat` | image: IMAGE, sample_width: INT, sample_height: INT, sample_rate: FLOAT, batch_index: INT | table: GENERETI_DAT, text: STRING | `GeneretiConvertTopToDat` |
| `top.transform` | image: IMAGE, translate_x: FLOAT, translate_y: FLOAT, scale: FLOAT, rotate: FLOAT, flip_x: BOOLEAN, flip_y: BOOLEAN | image: IMAGE | `GeneretiTextureTransform` |

## CHOP

| Operator | Inputs | Outputs | Stable node ID |
| --- | --- | --- | --- |
| `chop.arpeggiator` | notes: STRING, octaves: INT, mode: COMBO, bpm: FLOAT, division: INT, gate: FLOAT, velocity: FLOAT, samples: INT, sample_rate: FLOAT, time: FLOAT, input: GENERETI_CHOP | notes: GENERETI_CHOP, value: FLOAT | `GeneretiMusicArpeggiator` |
| `chop.constant` | value: FLOAT, channels: INT, samples: INT, sample_rate: FLOAT, time: FLOAT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopConstant` |
| `chop.drumkit` | input: GENERETI_CHOP, level: FLOAT, decay: FLOAT, tone: FLOAT | notes: GENERETI_CHOP, value: FLOAT | `GeneretiMusicDrumKit` |
| `chop.expression` | expression: STRING, channels: INT, samples: INT, sample_rate: FLOAT, time: FLOAT, input: GENERETI_CHOP | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopExpression` |
| `chop.lag` | input: GENERETI_CHOP, seconds: FLOAT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopLag` |
| `chop.logic` | input: GENERETI_CHOP, threshold: FLOAT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopLogic` |
| `chop.math` | input: GENERETI_CHOP, operation: COMBO, value: FLOAT, low: FLOAT, high: FLOAT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopMath` |
| `chop.merge` | input: GENERETI_CHOP, other: GENERETI_CHOP | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopMerge` |
| `chop.midiin` | device: STRING, channel: INT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopMidiIn` |
| `chop.midiout` | input: GENERETI_CHOP, device: STRING, message: COMBO, channel: INT, number: INT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopMidiOut` |
| `chop.noise` | seed: INT, amplitude: FLOAT, offset: FLOAT, channels: INT, samples: INT, sample_rate: FLOAT, time: FLOAT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopNoise` |
| `chop.note` | note: INT, gate: BOOLEAN, velocity: FLOAT, samples: INT, sample_rate: FLOAT, time: FLOAT | notes: GENERETI_CHOP, value: FLOAT | `GeneretiMusicNote` |
| `chop.oscillator` | wave: COMBO, frequency: FLOAT, amplitude: FLOAT, offset: FLOAT, phase: FLOAT, channels: INT, samples: INT, sample_rate: FLOAT, time: FLOAT | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopOscillator` |
| `chop.oscin` | port: INT, address: STRING | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopOscIn` |
| `chop.oscout` | input: GENERETI_CHOP, port: INT, address: STRING | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopOscOut` |
| `chop.select` | input: GENERETI_CHOP, pattern: STRING | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopSelect` |
| `chop.sequencer` | notes: STRING, bpm: FLOAT, division: INT, gate: FLOAT, velocity: FLOAT, samples: INT, sample_rate: FLOAT, time: FLOAT | notes: GENERETI_CHOP, value: FLOAT | `GeneretiMusicSequencer` |
| `chop.slope` | input: GENERETI_CHOP | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopSlope` |
| `chop.speed` | input: GENERETI_CHOP | channels: GENERETI_CHOP, value: FLOAT | `GeneretiChopSpeed` |
| `chop.synth` | input: GENERETI_CHOP, voice: COMBO, level: FLOAT, attack: FLOAT, decay: FLOAT, sustain: FLOAT, release: FLOAT, cutoff: FLOAT, resonance: FLOAT, glide: FLOAT, vibrato: FLOAT, vibrato_rate: FLOAT | notes: GENERETI_CHOP, value: FLOAT | `GeneretiMusicSynth` |
| `chop.todat` | input: GENERETI_CHOP | table: GENERETI_DAT, text: STRING | `GeneretiDatFromChop` |
| `chop.totop` | input: GENERETI_CHOP, layout: COMBO, width: INT | image: IMAGE | `GeneretiConvertChopToTop` |

## DAT

| Operator | Inputs | Outputs | Stable node ID |
| --- | --- | --- | --- |
| `dat.cell` | input: GENERETI_DAT, row: INT, column: INT | text: STRING, value: FLOAT | `GeneretiDatCell` |
| `dat.expression` | input: GENERETI_DAT, expression: STRING | table: GENERETI_DAT, text: STRING | `GeneretiDatExpression` |
| `dat.json` | text: STRING | table: GENERETI_DAT, text: STRING | `GeneretiDatJSON` |
| `dat.lesson` | guide: STRING | document: GENERETI_DAT, markdown: STRING | `GeneretiDatLesson` |
| `dat.merge` | input: GENERETI_DAT, other: GENERETI_DAT | table: GENERETI_DAT, text: STRING | `GeneretiDatMerge` |
| `dat.replace` | input: GENERETI_DAT, find: STRING, replace: STRING | table: GENERETI_DAT, text: STRING | `GeneretiDatReplace` |
| `dat.select` | input: GENERETI_DAT, start: INT, count: INT, columns: STRING | table: GENERETI_DAT, text: STRING | `GeneretiDatSelect` |
| `dat.table` | text: STRING, delimiter: COMBO | table: GENERETI_DAT, text: STRING | `GeneretiDatTable` |
| `dat.text` | text: STRING | table: GENERETI_DAT, text: STRING | `GeneretiDatText` |
| `dat.tochop` | input: GENERETI_DAT, sample_rate: FLOAT, header: BOOLEAN | channels: GENERETI_CHOP, value: FLOAT | `GeneretiDatToChop` |
| `dat.totop` | input: GENERETI_DAT, header: BOOLEAN | image: IMAGE | `GeneretiConvertDatToTop` |
| `dat.transpose` | input: GENERETI_DAT | table: GENERETI_DAT, text: STRING | `GeneretiDatTranspose` |

IMAGE uses normal Comfy image sockets; named blocks use `GENERETI_CHOP` and string tables use `GENERETI_DAT`. Conversion operators bridge all six directions. FLOAT/STRING scalar outputs connect to regular parameter sockets. Audio endpoints are silent until their own Start button; MIDI/OSC endpoints require Connect.

3D remains in Livecode Three.js. No SOP/POP/MAT family is introduced.
