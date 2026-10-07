# Performance time and timeline

Genereti has its own workflow-scoped browser transport. It runs while the timeline
is hidden and is independent of Comfy's queue. This first implementation reuses
Underscores' time-value parser, ruler, zoom, loop and clip interactions; the shared
clock and Comfy adapters live in `integrations/genereti_comfy_performance/`.

Restart Comfy after installing with `scripts/install_comfy.sh`, then refresh the
browser. Open **Workflows → Genereti → ꘇ-Performance-Timeline**, or use
**Settings → Genereti → Learning → Open lessons → Open performance timeline workflow**.
Its six-step `dat.lesson` covers shared time, expressions, explicit audio start,
parameter recording and seeking. The example needs no models or capture devices.

## Controllers and clock outputs

**Alt+Shift+T** toggles the native bottom panel. **Alt+Space** plays/pauses project
time outside text editors. These are editable in Comfy's native Keybinding panel.
`ꘇmod.timeline` opens the same dock or a draggable, resizable floating view.

The dock includes play/pause/stop, tempo, meter, loop handles, seconds/BBU/frame
rulers, zoom/follow, numeric automation tracks, clip editing, global scale/tuning
and JSON import/export. Time is derived from a monotonic anchor, so a stalled
redraw does not discard elapsed time. Musical position retains tempo segments
when BPM changes. There are **480 ticks per quarter note**. `beat` counts meter
beats, `bar` is the zero-based elapsed bar index, and `phase` is the quarter-note
fraction. In 6/8, one bar contains six eighth-note beats and three quarter notes.

`ꘇmod.transport` keeps its CLOCK output at socket **0**, and adds named control
channels **1**, seconds **2**, meter beats **3**, and JSON **4**. Set `clock_name`
to **project** to control the dock's clock. **local** preserves independent,
initially running sequence clocks in older patches. Local clocks with the same
label remain independent per node; named shared clock registries are future work.

`ꘇchop.time` accepts an optional CLOCK input and otherwise reads project time.
Its selectable FLOAT includes seconds, quarter notes, beats, bar index, ticks,
phase, BPM, playing, loop iteration or Unix wall-clock seconds. Other sockets
provide a named CHOP block, JSON and the CLOCK reference. Wall time is separate
from pausable score time. The CHOP is a control snapshot at 25 Hz, not audio PCM.
Connect the CLOCK or JSON to `ꘇdat.inspect` to see its values.

Time expressions accept `250 ms`, `2 seconds`, `beat`, `2 bars`, `4n`, `8nt`
(triplet), `8n.` (dotted), `480 ticks`, frames and samples. Musical launch cues
use the **strict next** boundary. Seek, pause and loop changes cancel pending
cues. The cue button dispatches `genereti-performance-cue`; this pass does not
launch media or source-code clips.

## Shared variables in code

JavaScript-based Livecode runtimes and the legacy p5 node expose a node-local
`__` facade. The host retains its own namespace at `window.generetiPerformance`;
an unrelated host `window.__` is not replaced.

| Value | Meaning |
| --- | --- |
| `__.time` | Project score seconds, held while paused |
| `__.beat`, `__.bar` | Meter beats and zero-based bar index |
| `__.bpm`, `__.ticks`, `__.phase` | Tempo, 480-PPQ position, quarter-note fraction |
| `__.playing`, `__.rate` | Project playback state and rate |
| `__.root`, `__.tuning`, `__.music` | Root pitch class, A4 reference Hz and musical context |
| `__.transport` | Clock snapshot including epoch and loop iteration |

Livecode also provides `__.timeValue.parse/resolve/format`,
`__.musicTools.quantizeNote/frequency`, `__.data.get(name)/set(name,value)` and
`__.commands.play/pause/seek`. Shared data is workflow JSON, with a 64 KB limit
per value. Code's existing `__.params`, image and render helpers remain available.
Legacy p5 currently reads snapshots/music/data; use Livecode for commands and
shared-data writes. Exported standalone HTML does not include the host timeline
engine; project fields require the running Comfy host. Server-side Manim Python is not a JavaScript runtime.

TOP, CHOP and DAT expressions support the numeric fields in this table except
`music`/`transport`, with `__.playing` represented as 0 or 1. They use the bounded
arithmetic parser, not arbitrary JavaScript or object access. For example:

```js
0.5 + 0.5*sin(__.beat*0.5 + x*8 + c*2 + simplex(x*3,y*3,__.time*0.1))
```

Here `c` selects each output channel; a different phase per channel makes color.
Local `t` remains the node's time domain. The **Free time / Project time** control
is separate from Live / Comfy Queue delivery. Project binding changes the time
fed into time-based TOP/CHOP generators and Livecode render callbacks. Reading
`__.time` explicitly always reads the project clock, even in Free time mode.
P5's built-in `millis()` and `frameCount` remain p5's own values.

GLSL reads the same project fields through float uniforms:
`u_generetiTime`, `u_generetiBeat`, `u_generetiBar`, `u_generetiBpm`,
`u_generetiTicks`, `u_generetiPhase`, `u_generetiRoot`, `u_generetiTuning`,
`u_generetiPlaying`, `u_generetiRate`. Referenced uniforms are declared
automatically unless already declared. `iTime` / `u_time` use the chosen local
render time. `sin(u_generetiBeat)` therefore follows project music even when
`iTime` is free-running.

## Domain offset ports

`ꘇtop.noise`, `ꘇtop.expression`, `ꘇchop.noise` and `ꘇchop.expression` have
optional FLOAT input ports `offset_x`, `offset_y`, `offset_z`, `offset_t`.
Unconnected ports equal zero. Connect `chop.time`, an oscillator, a constant or
another scalar source; these stay visible as sockets instead of a parameter tab.

For TOPs, X/Y shift normalized coordinates before scale/frequency; Z shifts the
third coordinate, and T adds seconds to local time before noise speed is applied.
TOP expression's `z` starts at `offset_z`. For CHOP expressions, X shifts the
normalized sample coordinate, Y/Z supply extra domain coordinates, and T shifts
sample time. CHOP white noise uses XYZ as deterministic hash-domain offsets;
use the expression's `perlin`/`simplex`/`value` functions for coherent noise.
`ꘇchop.oscillator` has only `offset_t`, because its domain is one-dimensional.
These offsets do not alter the global project clock or amplitude/DC offset.

## Numeric automation and takes

Select a node, choose a numeric parameter in the dock, then **＋** to create a
clip or **●** to record changes while playing. Press **●** again to finish the
take. Recording uses unwrapped monotonic elapsed time across score loops; the
final held value is retained to the stop time. This pass records one selected
numeric parameter per take. Text, graph construction and pointer demonstrations
still belong to the existing lesson recorder.

Select a clip to edit key times/values and linear/step interpolation. **◇** adds
the current authored widget value at the playhead. Drag clips to move, trim their
edges, or Alt-drag an edge to stretch; double-click toggles source looping.
Tracks support mute/solo and ordering. Overlapping clips on a track resolve to
the latest start. Runtime automation is a transient override: authored widget
values remain intact, and a connected input wire takes precedence with a conflict
message. Automated Livecode numeric parameters use their existing parameter slots.

The workflow saves a versioned performance document at
`extra.generetiPerformance`. The dock exports/imports that document as JSON;
normal Comfy saving retains both the patch and its score. Timeline edits have
bounded undo/redo separate from Comfy's graph history.

## First-pass seek and scheduling policy

Seeking pauses project playback, increments its discontinuity epoch, resets
linked TOP feedback/history and cancels scheduled modular notes. A loop wrap
also resets linked history. This prevents stale feedback and burst playback of
missed notes. Sequence deadlines are scheduled on Web Audio about 120 ms ahead
by a 25 ms timer; late steps are skipped. Hiding the dock does not stop playback.
Audio still requires explicit **Start on mod.output**; opening, importing,
seeking or queueing never starts it.

Comfy Queue captures one frozen project-time and automation snapshot per prompt.
Linked TOP/CHOP time parameters and expression globals use that snapshot; free
Queue time remains the authored numeric time. Livecode queued rendering receives
the snapshot too. Queue is a render checkpoint, not a real-time tick source.

Scrubbing does not reconstruct arbitrary stateful p5/Three.js simulations or
historical feedback images, and has no audio audition. The musical ruler uses
current BPM; accurate tempo-map ruler editing, shared Strudel/Orca phase, media
and action clips, multi-parameter takes, audio recording, MIDI clock sync and
Ableton/TouchDesigner/Bespoke interchange remain subsequent work.
