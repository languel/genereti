# Performance time, transport and timeline plan

Reviewed **2026-10-06**. This is a source review and implementation plan, not a
claim that the proposed timeline or shared clock has shipped.

Genereti's working baseline is **4780395**, pushed to `origin/main`, with the
annotated tag **checkpoint/pre-timeline-2026-10-06**. The checkout was clean at
the checkpoint. Underscores (`__` below) was reviewed at **fb8b23b plus its
current working tree**; that checkout contains unrelated work in progress and
was read without modifying it. The user's Comfy instance on port 8000 was not
restarted or changed.

## Direction

Build a workflow-scoped performance engine of our own. Comfy remains the graph,
schema, persistence and queued-generation host. Browser visuals, modular audio,
musical scheduling, composition and automation use our engine. Reuse __'s time
values, clip evaluation, timeline interactions, command/event conventions and
lifecycle adapters, adapting their canvas-object bindings to Comfy nodes.

The engine must operate with its UI closed. A docked timeline, a floating window
and `ꘇmod.transport` are views/controllers of the same selected transport, not
three independently advancing clocks. Existing independent `mod.*` audio routes
and TOP/CHOP/DAT interoperability remain supported.

## What __ actually has

Source paths below are relative to `~/dev/underscores/`.

| Area | Source | Existing behavior worth carrying over |
| --- | --- | --- |
| Time values | `src/timeValue.js`, `src/TimeValueInput.jsx` | Versioned expression plus fallback seconds; seconds, milliseconds, frames, samples, Hz periods, meter beats, bars, dotted/triplet note values, elapsed BBU and clock/timecode notation. Context dependencies allow musical durations to resolve after tempo/meter changes. Internal PPQ is 480. |
| Transport math | `src/transport.js` | Loop wrapping, playback rate, time/frame conversions, ruler subdivision, zoom-aware ticks, snapping, follow-playhead and strict-next-boundary launch quantization. MIDI clock constants, song position and a filtered opt-in tempo follower. |
| Running transport | `src/App.jsx` around 6795–6947 and 20580–20670 | Monotonic animation-frame deltas advance score position; UI publication has its own FPS limit. Separate MIDI clock receive/send and queued linked Livecode starts/stops/updates. |
| Timeline UI | `src/TransportTimeline.jsx` | Time/frame/BBU ruler, scrubbing, loop handles, zoom window, follow, object lanes and user-managed clip tracks, take summaries, mute/solo, selection, drag/drop, trim/stretch and edit callbacks. Automation keys and walkthrough markers share the view. |
| Clip model | `src/arrangementClips.js`, `src/arrangementAdapters.js` | Versioned tracks/takes/clips; fixed or Hold windows, source offset, rate, local looping, deterministic overlap selection, indexed evaluation and activate/seek/deactivate adapters. |
| Recording | `src/sessionHistory.js`, `src/commandSystem.js`, `src/mediaClipRecorder.js` | Semantic command/input sessions and macros are distinct from arrangement and media capture. Recording retains monotonic time alongside transport position. Playback suppression prevents recording its own actions. |
| Automation | `src/automation.js` | Auto-key extraction, numeric interpolation, shortest-angle interpolation and stepped structured values. Playback evaluates transient state. |
| Shared API | `src/App.jsx` around 23509–23738, `src/scriptRuntime.js`, `src/P5Frame.jsx` | Host `window.__` publishes commands, events, inputs, history, walkthroughs, time helpers, grid, streams and object lookup. Node-local `__` supplies params, scoped time and access to the host API. This is a service/reference bridge, not merely a shared dictionary. |
| Musical grid | `src/gridSystem.js` | Global grid time-per-cell, scale presets/custom degrees, root, octave, tuning and coordinate-to-MIDI/frequency conversion. Spatial snapping and musical mapping are already separable operations. |
| Strudel | `src/strudelRuntime.js` | One shared scheduler stacks active node patterns; free and linked modes, scheduled source swaps, launch phases and phase re-anchoring on transport changes. Linked `setcps`/`setbpm` declarations can update host tempo. |
| Orca | `src/orcaRuntime.js` | A smaller linked/free runtime with tempo-derived frame stepping. Useful adapter shape; currently a timer-based implementation rather than a complete shared phase scheduler. |

Focused existing tests passed **110/110**: time values, transport, linked
Livecode, arrangement timing/adapters, timeline selection, automation, grid,
session history, Strudel and Orca. This verifies those local tests; it does not
establish end-to-end browser performance or hardware synchronization.

### Details to resolve during the port

- `timeValue.js` uses zero-based elapsed BBU and 480 ticks per quarter note.
  Explicit input such as `100 ticks` is currently reserved/rejected. Some older
  `transport.js` helpers use a one-based musical display with 16 subdivisions
  per meter beat. Choose one canonical internal representation and clearly
  distinguish elapsed duration from a displayed position.
- Launch options mix note-value labels and beat-fraction labels. In particular,
  the `1/2` option says “1/2 beat” but calculates two meter beats; `1/4` says
  “1/4 beat” but resolves to one. Port typed units, not these ambiguous labels.
- The normal score tick caps an elapsed frame delta at 100 ms. That is useful
  for some simulations but loses clock time after a long stall. Performance
  time should derive from an anchor; bounded simulation substeps are separate.
- Some activation handling follows React-published score time. Musical/audio
  deadlines should go through a scheduler, independently of UI updates.
- MIDI output uses chained timeouts. Reuse its protocol and receiver math, then
  improve deadline scheduling rather than claiming sample-accurate MIDI output.
- Existing Strudel conversion is `cps = bpm / 240`, a four-quarter-note cycle.
  A cycle is not automatically one bar in every meter. Make cycle length explicit.
- Seconds multiplied by the current BPM are insufficient for continuous musical
  position across tempo changes. Use phase anchors and retain tempo segments for
  authored tempo automation.
- Clip recording distinguishes unwrapped time, visible time and loop iteration,
  but wrap inference alone cannot distinguish a rewind from a loop or recover
  several missed wraps. Supply explicit seek/loop events and epochs.
- __ documents incomplete universal undo across authored scene and top-level
  state in `notes/history-automation.md`. Carry over the semantic transaction
  model and tests, not a promise that all compound operations already undo.
- Arbitrary stateful p5, feedback and sound cannot be reconstructed by merely
  setting a time uniform. Each adapter needs an explicit seek/reset policy.

## Genereti integration boundaries

`integrations/genereti_comfy_chop/modular.py` declares `GeneretiAudioTransport`
with BPM/swing and one `GENERETI_AUDIO_CLOCK` output. Its browser implementation
in `web/modular.js` anchors sequence scheduling to Web Audio, wakes every 25 ms
and schedules about 120 ms ahead. Parameter/play changes currently re-anchor and
restart sequencing. It has no general seekable playhead or numeric clock output.

Livecode currently has a separate iframe elapsed-time origin in
`integrations/genereti_comfy_p5/livecode/runtime.js`. Its `__` exposes params and
image input, but not the host's shared transport, event/data or output services.
TOP generators currently use browser time plus their time parameter in
`integrations/genereti_comfy_texture/web/texture-nodes.js`. Control and image
streams already have `genereti-control-frame`, `genereti-live-frame` and live
value readers. These are adapter seams to consolidate, not clocks to multiply.

Our lesson recorder already captures node creation/deletion, wiring, parameters,
text, layout and sampled pointer cues in
`integrations/genereti_comfy_agent/web/js/guide-cua.js`. It uses polling and
relative action delays. Adapt these semantic actions into timeline events and
recorded curves; retain the existing lesson format and Hint/Do it behavior.

Persistent `generetiLessonRef` references already support lessons and texture
feedback. Generalize that identity machinery for node/parameter/output targets;
do not reuse texture-reference validation unchanged, since it requires IMAGE.

## Time and scheduling contract

Keep delivery and timing independent:

| Axis | Meaning |
| --- | --- |
| Delivery: Live | Browser values/frames stream without submitting a Python prompt. |
| Delivery: Comfy Queue | A run receives a frozen time/parameter snapshot and produces an asynchronous result. |
| Time: free | A source keeps its own local clock. Preserve existing workflows by default. |
| Time: linked | Local time maps to a selected shared transport or clip. |
| Musical scheduling | Starts, stops, triggers, source swaps and optional parameter changes wait for explicit beat/bar/note-value boundaries. |

Musical time is a first-class coordinate and event schedule; it need not force
all visuals to render only on beats. A beat-quantized launch can still run a
smooth 60 Hz visual and audio-rate sound after it starts. Expose an optional
musical sample-and-hold cadence for users who want discrete updates.

The proposed shared transport snapshot contains identity, playing/rate, monotonic
anchor, score seconds, quarter-note position, meter beat/bar position, PPQ tick
index, loop phase/iteration, tempo/meter and a discontinuity epoch. Publish time
units explicitly. Wall time is an additional timestamp, never the musical master.

Use __'s 480 PPQ for musical representation. This is **not** a request to dispatch
480 browser callbacks per quarter note. Calculate tick positions and schedule
subscribed divisions/triggers by deadline. Events include identity, epoch,
iteration, sequence number and scheduled time so polling consumers cannot mistake
a brief Boolean pulse for a reliably delivered trigger.

One transport may use a monotonic browser anchor without sound. Once audio is
explicitly enabled, map its position to the shared AudioContext clock without a
phase jump. Audio scheduling has lookahead and cancellation; animation frames
render the current state; UI subscribers update at a lower rate. Pausing or
hiding the timeline must not dispose the audio graph. Define background-tab and
device-loss behavior, with missed-event reporting instead of bursts of old notes.

Tempo edits preserve current musical position and future deadlines are recomputed
from that anchor. Meter affects bar layout; a quarter note remains a quarter note.
Loop/seek/reset cancel obsolete scheduled events, increment the appropriate epoch
and inform stateful adapters. Pause holds position; stop/reset are distinct.

### Queue and generation cues

Capture score seconds, musical position, tempo/meter and snapshot revision once
per submitted prompt. Every queued node reads the same snapshot. Use a changing
snapshot token as an execution dependency where needed; cache invalidation alone
does not schedule runs. Headless/API runs accept an explicit authored snapshot
rather than requiring a browser clock.

Queue submission and completion are events, not the realtime master. A musical
cue can request a generation, then activate the ready result on a later quantized
boundary. Report late/unready results and choose an explicit skip/hold policy.
Do not freeze the transport waiting for Python or queue a prompt for every tick.

## Timeline UI recommendation

Use a **ꘇ Timeline bottom-panel tab** as the primary editor. Comfy supports an
extension's `bottomPanelTabs` with custom `render(container)`/`destroy()` hooks.
The API is present in the installed frontend bundle, not just upstream source.
It provides a native shell mount and a registered tab-toggle command. A bundled
React view can mount inside that custom container, allowing reuse of __'s
`TransportTimeline` without adding React to Comfy's Vue application.

The current host API targets the existing `terminal` or `shortcuts` panel groups;
it does not expose arbitrary independent bottom docks. Start with a tab in the
existing bottom panel, verify resize/collapse and native command/keybinding
behavior, and only add a separate strip if this proves too restrictive. Do not
rely on undocumented DOM replacement as the first implementation.

Sources: [extension declarations](https://github.com/Comfy-Org/ComfyUI_frontend/blob/main/src/types/comfy.ts),
[custom panel types](https://github.com/Comfy-Org/ComfyUI_frontend/blob/main/src/types/extensionTypes.ts),
[bottom-panel registration](https://github.com/Comfy-Org/ComfyUI_frontend/blob/main/src/stores/workspace/bottomPanelStore.ts).

Add a detachable/floating view using our overlay conventions after the dock
works. `mod.transport` remains the compact patch controller and clock reference;
an optional timeline node opens the project view rather than owning another
scheduler. Hiding, closing or changing UI placement preserves transport state.
Use Comfy-native commands/keybindings, theme tokens, glyphs and hover explanations.
Handle Satori explicitly, including a way to reveal the performance view while
the shell is hidden. Opening the dock must respect overlays and canvas viewport
measurement; wheel and pointer gestures stay inside the timeline.

## Shared API, persistence and musical context

Introduce a small framework-independent performance package with pure timing,
scheduling, transport, binding and document modules plus separately bundled UI.
An optional `integrations/genereti_comfy_performance` pack is the proposed host;
update installer and pack dependencies together when implementing it.

Expose the host service under a Genereti-owned namespace and adapt node-local
`__` to it. Do not replace unrelated extensions' `window.__`. Proposed facades:

- `__.transport`: read position and explicit play/pause/seek/loop commands;
- `__.time`: __-compatible parse/resolve/format/quantize helpers;
- `__.events`: timestamped semantic events and subscriptions;
- `__.data`: named shared values with get/set/subscribe and declared ownership;
- `__.nodes` / `__.params`: persistent references and typed parameter access;
- `__.music`: selected scale, tuning, time-grid and note/time quantizers;
- `__.outputs`: declared typed live outputs with queued snapshot counterparts.

These are proposed APIs, not usable syntax today. Iframe access requires our
message bridge, versioned snapshots and scoped commands; copying the host object
into an iframe is not a shared runtime. Shared data must distinguish serializable
authored values from transient channels/textures/audio routes, clean up on node
removal and avoid serializing a mutable dictionary every frame.

Store versioned project transport configuration, musical context, track/clip
definitions and bindings under workflow extra metadata. Store node-local
references/settings in node properties. Runtime position, scheduler handles,
audio voices and per-frame parameter overlays remain transient. Default to one
project transport; preserve explicitly independent legacy transports and allow
named alternate transports without first-node-wins ambiguity.

Automation targets use persistent node reference plus parameter ID, with a typed
adapter for get/set/evaluate. Keep authored base values distinct from playback
overrides. A wired control and timeline curve need an explicit priority/mix rule;
the first UI should identify that conflict rather than silently rewriting a wire.
Commit an edit as one authored transaction; playback must not dirty the workflow,
fill undo history or feed itself into recording on every frame.

Extract musical scale/time-grid from __'s spatial grid. Keep root, custom scale
degrees, octave span, reference note/frequency and tuning; allow node overrides
of the project defaults. A `ꘇmod.scale` controller and CHOP note/time quantizers
can share that context. The canvas grid can optionally map to it later, without
turning pitch quantization into canvas snapping.

Strudel can read/write musical context through explicit adapters, with one tempo
authority and an explicit quarter-notes-per-cycle mapping. Preserve its scheduler
and phase-reset logic. Orca can consume scheduled musical steps later. MIDI
clock/song-position and MIDI-file interchange provide an initial exchange path
with external music tools; Ableton Link and native Bespoke/TouchDesigner project
exchange are separate integrations, not existing compatibility claims.

## Implementation stages and acceptance

1. **Shared time and transport foundation.** Extract __'s time-value/core math
   with provenance and notices, fix unit ambiguities in our adapter, implement a
   headless clock/scheduler and versioned workflow state. Extend `mod.transport`
   without changing its node ID or existing clock output index. Add clock-value
   CHOP/inspection access and linked TOP/Livecode time. Demonstrate one noise
   visual and one sequence sharing phase through pause, loop and a tempo change.
   Test fake-clock stalls, boundary cancellation, multiple loops, phase continuity,
   old workflows and explicit audio Start/Panic.

2. **Native dock and __ timeline port.** Register the bottom tab, mount the
   timeline view, preserve __'s ruler/zoom/follow/loop interactions and persist
   edits. Add native toggle commands and an optional floating view. Scrub a
   stateless visual, show numeric time in `dat.inspect`, and verify hiding,
   reopening, resize, workflow switching and Satori. The engine keeps running
   while views mount/unmount; no duplicate timers or event listeners.

3. **Musical launches and scale/grid.** Expose note-value, meter-beat, bar and
   custom boundaries, pending launches and timestamped triggers. Add project
   scale/tuning and note quantizers; wire Strudel through the authority adapter.
   Demonstrate an on-grid source swap, tempo edit without sequence restart,
   3/4 and 6/8, triplets, scale changes and a delayed UI frame without duplicate
   or retroactive notes. Raw tick input and internal PPQ receive focused tests.

4. **Typed code outputs and parameter automation.** Generalize @param binding
   and add code-declared output support with matching backend schemas, stable
   port identity and queued snapshots. Port interpolation and auto-key into
   Comfy parameter adapters. Record a cutoff/filter/visual-control gesture into
   a curve, edit it, replay and export/reload it. Verify base-value restoration,
   connected-input conflicts, type checking, copy/paste reference remapping and
   one-transaction undo of authored edits.

5. **Clips, takes and lesson recording.** Port clip evaluation, Hold/fixed
   windows, source offsets, looping, trims/stretch, mute/solo and lifecycle
   adapters. Start with parameter/action and Livecode clips, then media/note
   clips. Preserve monotonic recording time, transport phase and loop iteration.
   Adapt lesson actions/pointer cues into editable event clips; allow a recorded
   performance/build session to become a narrated lesson with Hint/Do it.
   Verify cross-loop takes, seek cancellation, replay suppression, bounded input
   capture and graph/transport changes during playback. Media capture is a
   distinct operation, not a requirement for recording automation.

6. **Synchronization, interchange and export.** Improve MIDI clock deadlines
   and expose external-follow diagnostics; test real hardware separately.
   Define JSON time/automation/clip exchange and MIDI import/export with tempo
   metadata. Add deterministic offline stepping where adapters support it,
   followed by replay/checkpoints for stateful visuals. Investigate Ableton Link
   as a separate adapter. Keep shared transport compatible with the pending
   multi-buffer/GPU Sound project in [livecode-multipass.md](livecode-multipass.md).

The first reviewable milestone is stages 1–2: a working shared clock, extended
`mod.transport`, numeric time inspection and a collapsible docked timeline,
driving a live visual and an explicitly enabled audio sequence. The subsequent
stages grow from that shared state rather than introducing parallel subsystems.

Before claiming realtime reliability, measure scheduled versus actual event
timing, visual/audio phase error, long-session drift, main-thread stalls and
background-tab behavior. Mathematical tests, browser verification, audible
listening and hardware synchronization are different evidence levels.

Reuse identified __-authored modules with their license/provenance notices;
keep third-party Strudel dependencies and notices explicit. Do not copy the
whole App component or its Excalidraw state assumptions into Comfy.
