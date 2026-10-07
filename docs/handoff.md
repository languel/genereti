# Genereti / OpenTouch handoff

Review checkpoint: **2026-10-06**, `main`, including the first performance timeline below. Earlier sections retain their dated validation results. This document is the review map, not a claim that every device or performance configuration has been tested.

## Comfy distribution setup · 2026-10-06

The root is now a single-folder V3 Comfy package with ten existing integration
packs, stable node IDs/browser aliases, `pyproject.toml`, a tracked-file archive
builder and GitHub Actions for checks, student prereleases and manual registry
publishing. The [distribution guide](comfy-distribution.md) is the student and
maintainer entry point. Core ML is excluded from the package loader/archive;
its dependencies moved to `requirements-macos.txt`, consumed by the existing
macOS setup script. The root requirements are the small Comfy path.

The project license and actual registry publisher ID must be committed before a
public release/registry publish; the publishing workflows check these fields.
This checkpoint prepares distribution and does not claim registry acceptance,
cross-platform classroom testing or a published GitHub release.

Local validation extracted the 22.6 MB preview ZIP into an isolated Comfy base
directory and booted it on port 8002: 81 Genereti nodes registered, no Core ML
generator loaded, and the drawing editor, Livecode bundle, performance demo and
lesson catalog served successfully. Packaging tests cover deterministic archives,
hashes, tracked-only files, forbidden weights/symlinks, release gates and matching
student/registry allowlists. The existing user instances remain untouched.
The extracted-package browser demo delivered about 60 FPS; explicit audio reached
peak 0.03 and Panic stopped it. Its frozen model-free Queue run succeeded. The
official `comfy node pack` payload matched all 743 student-package source files.
161 JavaScript tests, 4 packaging tests and 6 preserving-installer tests passed.

## Guided Livecode pipelines · 2026-10-07

Three new model-free examples ship with the package and Learning chooser:
**ꘇ-Livecode-Shader-Buffers**, **ꘇ-Livecode-P5-Pipeline** and
**ꘇ-Livecode-Audio-Visual**. Each has five clickable steps, semantic UUID targets,
Hint/Do it actions and the existing Markdown/HTML/Print exports. Read the
[Livecode tutorial guide](livecode-tutorials.md). The reproducible builder is
`scripts/build_livecode_lessons.py --server http://127.0.0.1:8001`.

Shaders use separate Livecode passes and a delayed composite reference; these
are external buffers with one IMAGE input each, not full Shadertoy A–D/Sound
support. Pixel captures confirmed fresh colored ink and larger accumulated
history. Both p5 runtimes drew their connected source/tiled output; all tutorial
actions replayed against real nodes. Explicit audio produced RMS about 0.014,
which reached p5 energy (about 0.12 before increasing sensitivity). Panic stopped
audio and returned energy to zero. Tests also validate annotated controls,
portable targets, acyclic wiring and manual-only audio activation.

Guide focus can move a p5 preview offscreen before its initial animation frame.
A cancellable first-paint fallback now redraws a pending candidate after setup,
preserving the first-frame acceptance check and last-good runtime. Setup also
reapplies requested p5 dimensions before user code, avoiding zero-size viewport
values during offscreen startup and frozen Queue capture. A fresh-page
offscreen startup check passed. All three new workflows completed frozen Comfy
Queue captures successfully without starting sound. All 43 canonical workflows
parse. Reload/restart after updating browser bundles;
existing open documents keep their loaded modules.

## Timeline compact header and performance pass · 2026-10-06

The Timeline tab places transport controls beside compact native Logs/Timeline
tabs, wrapping at narrow widths. Logs keeps its own header. The native close
control, splitter, keyboard commands and floating timeline are retained.

The new `ꘇdat.monitor` reports a rolling five-second browser frame window, source
frame-delivery rates, long tasks and transport/UI costs; it exports JSON and has
FLOAT/CHOP/JSON outputs. The demo includes it. These are browser/delivery
measurements, not GPU execution time or a backend Queue FPS benchmark.

A playing demo initially averaged about 66 ms between browser frames (about
15 FPS), with p95 116 ms. Profiling identified inspector document replacement;
the monitor then exposed TOP noise repeatedly recompiling shaders as automation
changed scale. Numeric noise controls now use uniforms, and pipelines compile
asynchronously. The same 512×320 RGB/noise demo subsequently measured 60 FPS,
p95 17–18 ms and zero >50 ms frames in a five-second window. Before the separate
pixel-equivalence checks, shader compilation stayed at two while scale animated.
Actual GPU comparisons matched byte-for-byte for Perlin/simplex/value in 1–4D,
including XYZ offsets, seed, time and two octaves. This is an isolated local check,
not a guarantee for larger graphs or other browsers/devices.

Timeline controls reconcile at 5 Hz while the playhead moves independently at
browser frame cadence; hidden views skip reconciliation. Control/scheduling
cadence remains unchanged. Automation retains transient value banks, expression
globals avoid cloning project data per frame, and the JSON inspector applies
incremental CodeMirror updates without synchronous scroll layout reads.

Validation: 157 JavaScript tests and 6 focused Python performance operator tests;
all 40 canonical workflow files parse. A model-free Queue run and native
pointer/keyboard playback also passed. Model/capture/audio-start boundaries remain.

## First performance timeline · 2026-10-06

Review **ꘇ-Performance-Timeline** and the [performance guide](performance-time.md).
The new performance pack ports __'s time-value parser and timeline interactions,
adds an anchored project clock, numeric automation/take recording, native bottom
panel and floating view, scale/tuning and optional project bindings. `mod.transport`
keeps CLOCK at output 0 and adds readable channels/scalars/JSON. TOP/CHOP/DAT
expressions can read numeric `__` fields; Livecode reads time/music/data helpers,
and GLSL has `u_genereti*` uniforms. Generator XYZ/T offsets are input sockets.

Seek pauses and resets linked feedback, rather than pretending to reconstruct
historical state. Pending musical notes are cancelled; audio remains explicit.
The first clip implementation is numeric automation only. Full shared Strudel
scheduling, media/action clips, typed code outputs and external interchange are
still pending. Restart Comfy and refresh for new schemas; user port 8000 was
preserved during isolated browser verification. Validation: 153 JavaScript tests,
41 distinct focused Python tests, 40 canonical workflow JSON files and rebuilt
bundles. Browser checks covered play/pause/seek, actual WebGPU color output,
recorded keys, migration of an older noise workflow, explicit audio start
(nonzero peak 0.02), silent pause/Panic and a successful frozen Comfy Queue run.
A real GLSL capture at project time 2 produced the expected RGBA [51, 94, 0, 255]
from shared time/beat uniforms. Fresh-load paused generators also delivered held
frames to their downstream image viewer. No hardware clock or latency benchmark is claimed.

## Performance time planning · 2026-10-06

The pre-timeline baseline is **4780395**, tagged and pushed as
**checkpoint/pre-timeline-2026-10-06**. The [performance time plan](performance-time-plan.md)
reviews Underscores' transport, timeline, time values, grid, recording and shared
API against the current Comfy integration. It recommends a shared headless
performance engine with a native bottom-panel timeline and compact node controls.
Focused Underscores timing/clip/history/grid/Strudel tests passed 110/110; that planning checkpoint preceded the implementation above.

## Modular audio follow-up · 2026-10-06

The independent `ꘇmod.*` family adds ten Web Audio routing nodes with OpenTouch CHOP note/scalar interoperability. Review **ꘇ-Modular-Audio** and its embedded walkthrough: Start on `mod.output`, edit both grids, mute/solo the mixer, adjust delay, then Stop/Panic. The [audio guide](modular-audio.md) records contracts and current limits. Legacy `chop.synth` endpoints are preserved. Backend restart and frontend refresh are needed for the new schemas/modules. Verification used an owned 8001 instance; the user's 8000 workflow was preserved. Validated 81 JavaScript tests, 14 Python operator tests and 6 installer tests; all 30 canonical workflows parse. Browser checks covered grid edits/save/reload, explicit start, mute/solo, Panic and real OfflineAudioContext rendering (audible RMS 0.0169, muted RMS 0). No hardware MIDI or speaker latency claim is made.

## Class hints and coherent noise · 2026-10-06

All seven **ꘇ-Class-Feedback-Bloom-Displace** lesson steps now include Hint and
Do it. Playback restores existing-node settings and connections; the final step
opens the output overlay. Browser verification replayed all 36 actions and used
the actual Hint/Do it buttons.

**ꘇtop.noise** adds Perlin, simplex and value noise in 1–4 dimensions, with seed,
scale, RGB, time/speed and normalized octaves. TOP/CHOP expressions share
`noise`/`perlin`, `simplex` and `value` functions. **ꘇ-Noise-Dimensions** is a
four-step mini-demo in the workflow folder and Learning chooser. The
[texture guide](texture-operators.md#coherent-noise) explains dimensions and
signed ranges. Restart Comfy and refresh to register the new node; reopen saved
examples to replace stale embedded guides.

Validated 132 JavaScript tests, 9 CPU texture tests, 2 cross-runtime noise tests,
and all 12 queued noise variants. All 12 WebGPU type/dimension combinations
compiled and rendered; pixel comparisons differed by less than 0.5 of an 8-bit
level. Browser demos delivered live output; no broad performance benchmark is
claimed. Speed-zero noise renders only on changes. User's 8000 instance was
preserved; tests used an owned 8001 instance.

## Start the review here

In Comfy, open **Workflows → Genereti**. The examples are installed locally in `user/default/workflows/Genereti/` and their canonical sources live in `integrations/comfyui_genereti/workflows/`.

| Workflow | What to review |
| --- | --- |
| `ꘇ-OpenTouch-Operators-and-Lessons` | Connected TOP/CHOP/DAT operators, conversion glue, Three.js, documents, lesson authoring and optional MIDI/OSC |
| `ꘇ-Interactive-Output-Views` | Interactive p5, scrollable Markdown/math, drawing, Alt+O and Alt+W |
| `ꘇ-Tutorial-Authoring` | A seven-step guide to authoring guides, editable two-step lesson, actual texture exercise and export controls |
| `ꘇ-Creative-Stage-Showcase` | Broader creative-stage overview, capture and optional Core ML generation |
| `ꘇ-Livecode-Languages` / `ꘇ-Livecode-Math` | Language starters, document rendering and formulas |
| `ꘇ-Performance-Timeline` | Shared clock, global expressions, noise automation and a six-step guide |
| `ꘇ-Noise-Dimensions` | Layered simplex, 1–4D coordinates, signed expressions and Hint/Do it |
| `ꘇ-Class-Feedback-Bloom-Displace` | Reference feedback, bloom/displacement, channel routing and seven actionable steps |
| `ꘇ-Texture-Lab` / `ꘇ-Texture-Queue` | GPU live texture operators versus ordinary queued execution |

**Settings → Genereti → Learning → Interactive lessons** opens the guide chooser. The command palette also exposes **ꘇ OpenTouch lessons**. Its workflow buttons create a separate Comfy workflow tab; they do not replace the current graph.

The [operator catalog](opentouch-catalog.md) lists **49 OpenTouch operators** with inputs, outputs and stable IDs. It covers TOP/CHOP/DAT, not every Genereti integration node. The [report](opentouch-report.md), [language guide](livecode-languages.md), [lesson guide](opentouch-lessons.md), [UI conventions](node-ui-design.md) and [workflow guide](workflows.md) explain the surrounding features.

## What is implemented

- TOP: compositing, arithmetic, expression generation/processing, crop, corner pin, transform, feedback and basic filters in our WebGPU renderer.
- CHOP: named sampled channels, generators/processors, expression operators, MIDI/OSC endpoints and basic note/sequence/arpeggiator/synth/drum tools.
- DAT: editable documents and tables, CSV/JSON, selection/expression operations and a CodeMirror lesson-authoring node.
- Conversion operators bridge all six TOP/CHOP/DAT directions. Scalar FLOAT/STRING outputs can drive regular Comfy parameter sockets.
- Livecode accepts a regular IMAGE input and declared typed parameters. Render width/height are ordinary Comfy controls. The catalog of supported languages and each code contract is in the language guide.
- Interactive overlays move the existing Livecode/drawing surface instead of replacing it with a raster copy. Documents remain selectable/scrollable and p5 receives pointer callbacks. Image-only output/backdrop paths remain image views.
- Freeze/minimize affects the node preview only; downstream frames continue. The frozen view keeps its aspect/fit.
- Alt+O hides the whole node chrome around its live output. Its edge-revealed bar shares opacity and stacking controls with Alt+W. Comfy selection updates no longer expose the hidden controls.
- Example filenames now use `ꘇ-…`. The installer migrates legacy names, preserves customized examples and backs up superseded managed copies outside the workflow browser.

Visible node labels use `ꘇ` and family names. Internal `Genereti…` IDs remain stable for saved graphs. Search aliases support family terms and `genereti`.

## Presentation and interaction

On macOS, Alt means Option. Viewing shortcuts leave code/text editing alone.

| Shortcut | Action |
| --- | --- |
| D | Toggle backdrop for one selected preview-capable node |
| Alt+O / Shift-click overlay glyph | Toggle output-only node |
| Alt+W / regular overlay click | Toggle floating interactive overlay |
| Alt+F | Fill the Comfy viewport; Escape restores the overlay |
| Cmd+[ / Cmd+] | Move hovered/last-interacted view backward/forward |
| Cmd+Shift+[ / Cmd+Shift+] | Send view to back/front |
| Alt+Shift+O | Toggle click-through |
| Alt+P | Toggle graph/code/link presentation visibility |
| Alt+Shift+Z | Toggle Satori shell visibility |
| Alt+Shift+R | Toggle properties sidebar independently |
| Alt+Shift+I | Toggle canvas diagnostics independently |

The bars have backward/forward buttons; Shift-click sends to an end. Floating views and output-only nodes sort in their respective DOM layers. Stack order is session-only.

**Alt+W opens at the cursor**, retaining the last size and clamping to screen edges. Opening with the node glyph retains its saved rectangle. Hover just outside an output edge to reveal the bar; its pin keeps the controls visible. Alt+O or the restore button restores node chrome. Opacity is a display setting and does not change the downstream texture.

Fill-window stays inside Comfy. Browser/macOS fullscreen remains separate; the user has verified the Alt+F then browser fullscreen combination works well. Canvas diagnostics FPS describes graph redraw, not model generation or delivered output FPS.

## Render sizing and performance boundaries

**Fixed texture** uses width/height. **Follow output** follows the newest open supported viewer, then returns to another open viewer or the width/height fallback. All consumers share that render resolution; use Fixed texture for stable generator inputs. Display fit is a separate choice. p5 keeps its instance through resizing; other languages currently rebuild on resolution changes. The native macOS output companion does not yet report its viewport for Follow output.

TOPs share a browser-page WebGPU device and reusable intermediate textures. Livecode/camera/image ingress and model transport still introduce copies or encoding. TOP-to-CHOP/DAT intentionally reads back sampled data. CHOP blocks use browser Float32Array data; their timeline sample rate is not browser redraw FPS or sample-accurate audio. DAT and signal traces use bounded update rates.

This is **not** OS shared memory, SharedArrayBuffer transport, a shared native Metal texture or an end-to-end zero-copy Core ML pipeline. No new throughput benchmark is claimed at this checkpoint. The earlier Tixy/model slowdown report warrants a controlled performance pass with the exact graph and only one active generation client.

Full Core ML generation requires **macOS 14+ on Apple silicon**. Portable source/operator boundaries are documented in [platform support](platform-support.md). WebGPU needs a capable secure-context host; unsupported live GPU hosts report a limitation rather than silently using a CPU live renderer.

## Lessons and exports

`dat.lesson` holds authored guide JSON in CodeMirror. Run registers/plays the draft; Stop preserves learner edits. Markdown, standalone HTML, Print / Save as PDF and editable JSON exports belong on the **authoring node toolbar**, not the learner dialogue. Save/export the Comfy workflow separately to retain executable nodes and wiring.

Guides use semantic node targets and bounded learner checks; they do not execute arbitrary script, request device permission or automatically queue inference. The dat.lesson toolbar now records local selections, values/text, connections and supported preview controls into editable steps. Hint reveals authored guidance; Do it replays a step with visible typing and click/drag cues. Node references distinguish duplicate types. Arbitrary UI automation, freehand strokes and classroom synchronization remain deferred. The updated authoring demo teaches recording, hints, playback and exports; see docs/opentouch-lessons.md for action schema and limits.

## Verification at this checkpoint

- **75 JavaScript tests passed** after the Alt+O selection fix and cursor placement change.
- **6 workflow-installer tests passed** at the preceding demo/migration checkpoint.
- All **29 canonical workflow JSON files** parsed and their link endpoints were checked; bundled lesson JSON parsed.
- Isolated browser testing verified Shift-click output-only mode, bar-edge interaction without restored chrome, pinned controls, opacity changes, native p5 interaction, multiple overlays and stacking actions, Alt+W placement at `(150, 200)`, saved DAT/expression text restoration, and the tutorial title-edit check unlocking Next.
- Recent browser tests used a separate instance on **8001**. The user's **8000** instance/workflow was left intact. Generated screenshots/logs remain ignored under `artifacts/texture-tests/`.
- Actual external MIDI hardware, OSC peers, every language/device combination, PDF printing in each desktop harness and sustained model throughput were not revalidated in this UI checkpoint.

Frontend changes need a browser refresh; use a hard refresh if old modules remain cached. Python node/schema changes need a Comfy backend restart as well. Camera/screen, MIDI/OSC and audio endpoints remain explicit user-started actions. No weights, captures or private workflow edits were committed.

## Suggested review sequence

1. Open Interactive Output Views. Click the p5 output; open/close Alt+O and Alt+W without losing sketch state. Scroll/select the Markdown view and draw in the active drawing view.
2. Touch the Alt+O bar, pin it and adjust opacity. Check that only the explicit restore action returns node chrome. Check stack buttons, shortcuts, click-through recovery and Fill/Escape.
3. Try Fixed texture versus Follow output with a nonsquare viewer. Freeze the node preview while resizing a live output; verify aspect and downstream behavior independently.
4. Open Tutorial Authoring through the guide chooser. Change the lesson title, pass its check, export from the node, then run the edited two-step lesson against its actual texture exercise.
5. Review the connected operator workflow, family naming/search, conversions and ordinary parameter wiring. Start device/audio endpoints only when ready to test those paths.
6. Record remaining visual glitches and performance observations with source rate, graph FPS, output delivery FPS and model round-trip/model time distinguished.

## Next engineering work

Prioritize issues found in review before expanding the catalog. Then measure end-to-end performance and reduce redundant source capture, conversion/readback, encoding and view work. Do not infer generation rate from the canvas FPS counter.

Useful next operator work: shared transport/clock, resampling/interpolation, trigger/envelope/event processors, mapping presets and a multiple-IMAGE shader interface. Keep 3D focused on Three.js. Defer NDI/OAK/Syphon/Spout and broader native device integration until the interfaces and render/transport boundaries are clear.

## Code entry points

- Shared output chrome/geometry: `integrations/genereti_comfy_stream/web/js/overlay-shell.js`
- Output-only host: `…/node-output-view.js`; stacks: `…/view-stack.js`; keyboard routing: `…/preview-shortcuts.js`
- Preview/viewer integration: `…/preview-controls.js`, `…/output-window.js`
- Livecode editor/runtime: `integrations/genereti_comfy_p5/web/js/livecode.js`, `livecode/runtime.js`
- Shared CodeMirror operator text: `integrations/genereti_comfy_p5/web/js/operator-editor.js` (explicit saved-text restoration)
- Active drawing: `integrations/genereti_comfy_drawing/web/js/drawing.js`
- Lessons/settings: `integrations/genereti_comfy_agent/web/js/guides.js`, `shortcut-reference.js`, `web/lessons/catalog.json`
- Lesson author node: `integrations/genereti_comfy_dat/web/lesson.js`
- Durable mini-demo builder: `scripts/build_learning_examples.py`
- Safe example migration: `scripts/install_comfy_workflows.py`

Build changed Livecode runtime assets with `node scripts/build_livecode.mjs`. Rebuild mini demos with `python3 scripts/build_learning_examples.py`, validate JSON, and reinstall examples with `scripts/install_comfy_workflows.py SOURCE WORKFLOW_FOLDER`. Run `node --test tests/*.mjs`; installer checks use `python3 -m unittest discover -s tests -p test_comfy_workflow_install.py`.

## Native keybinding editor checkpoint

Viewing commands register with Comfy commands/keybindings. Settings → Keybinding supports search Genereti/ꘇ, native keycaps, presets, conflicts and remapping. Genereti → Shortcuts links there; command hover tips describe scope. P on an empty canvas selection toggles parameters; selected items keep native Pin. Alt+Shift+R remains a directly editable sidebar binding. Editor shortcuts remain local.

`keybinding-router.js` isolates Comfy’s currently non-public Pinia binding lookup for macOS Option physical keys and iframe forwarding. It reads the active map every event and defers if that store becomes unavailable; there is no hard-coded default fallback that would defeat unbinding. Recheck this seam on frontend upgrades.

## Shared editors checkpoint

Shared appearance settings live in `genereti_comfy_p5/web/js/editor-settings.js`; open Livecode and operator editors subscribe to changes and release subscriptions on removal. Livecode retains its menu, now editing global defaults. Per-node font overrides use Cmd/Ctrl+Shift+Plus/Minus. Livecode has an editor-only collapse chevron and lightning auto-update toggle. Selection transforms use `editor-transform.js` and CodeMirror isolated undo. Rebuild bundles with `npm run build:livecode`; the build versions editor imports in all three consumers.

### Patch recording checkpoint

`guide-cua.js` now records graph creation/deletion plus widget edits, named wiring, title/layout and bounded action timing. `guide-patch.js` recreates instances using persistent refs. `dat.lesson` and the guide expose Play all/remaining and Stop, pausing at manual steps. Canonical browser recording: `web/lessons/feedback-av-recording.json`; demos: `ꘇ-Feedback-AV-Build-Tutorial.json` and `ꘇ-Feedback-AV-Recorded-Patch.json`. See `docs/opentouch-lessons.md` for supported operations and limitations.

Verified by recording a real 10-operator patch in an isolated Comfy browser tab, deleting it and playing the six-step lesson back from the author node alone. The final step paused for explicit audio Start; the reconstructed Web Audio output produced a nonzero peak (about 0.0068) and Panic stopped it. This verifies browser routing/meter output, not an external MIDI device or acoustic listening test.

## Flexible feedback and color checkpoint

`top.feedback` now defaults to screen with add/over alternatives: opaque black previously covered history and made decay appear ineffective. The new `top.feedbackref` uses a persistent node/output picker or convertible STRING reference input, with alternating GPU snapshots latched after each whole graph tick. Its optional IMAGE seeds reset/first frame; Queue returns seed or transparent pixels. `top.bloom`, `top.displace` and `top.channels` add four-pass Gaussian glow, RG vector displacement and two-source RGB/RGBA routing. Expression already exposes RGB channel index `c`; the class demo uses it for color.

New examples: `ꘇ-Feedback-Reference-Chain.json` and `ꘇ-Class-Feedback-Bloom-Displace.json`, both with clickable lessons and library launchers. Browser GPU pixel checks verified recursive accumulation versus source delay, zero-decay removal and colored 512×384 output. The updated queue smoke check passed on a separate port8001 test server. The user server on8000 was left running; restart it and reload to discover new schemas. No audio or capture started.

## Painterly lesson and cursor recording · 2026-10-06

**ꘇ-Painterly-Feedback-Tutorial** is a lesson-only starter; **ꘇ-Painterly-Feedback-Patch** contains the completed 10-operator paint loop plus the same six-step author node. Both are in the installed Genereti workflows folder. Hint / Do it and sequential replay create pigment noise, a channel-aware palette, fine grain, delayed reference, RGB displacement, blur and final crossfade. The final crossfade is the reference target; the IMAGE input only seeds history. See [texture operators](texture-operators.md#painterly-reference-feedback-tutorial) for the loop diagram and complete expression syntax.

Pointer recording now retains bounded curved hover/click/drag paths anchored to named controls. Numeric drag playback interpolates the real widget value. The tutorial uses explicitly authored cursor demonstrations; the recorder was separately tested using native browser pointer input on a noise field. No arbitrary DOM commands, embedded iframe interaction or OS automation is implied.

Validated 137 JavaScript tests and all 37 canonical workflow JSON files. Browser verification built all six steps with animated playback, tested learner Hint / Do it and replayed curved recorded paths and a numeric value change. The procedural output rendered on WebGPU in owned 8001/8002 test instances. Reopening the completed patch and replaying all steps preserved 11 nodes and 10 links without duplicate instances. The user's 8000 workflow was left untouched. No backend schemas changed; refresh the browser to load recorder changes and reopen the saved examples for the new lesson source.

## Livecode multi-pass planning checkpoint · 2026-10-06

The working implementation baseline is **a454de1**, pushed to main: six-step
painterly feedback tutorial, completed patch, bounded pointer-path recording,
Hint / Do it, and explicit TOP expression documentation. 137 JavaScript tests
passed; all 37 canonical workflows parse. The user's in-progress 8000 patch was
preserved; owned test instances were stopped.

The next requested milestone is multi-tab/multi-buffer Livecode, interoperable
node channels, complete Shadertoy/compact shader authoring and GPU-generated
sound. See [the design brief](livecode-multipass.md) and the
[current compatibility limits](livecode-languages.md#glsl-compatibility-checkpoint--2026-10-06).
The recommended architecture uses a shared pass/channel scheduler for both tabs
and separate nodes. Source tabs alone do not implement feedback. Current GLSL
supports main/mainImage and one IMAGE sampler; GPU Sound and Buffer A–D remain
unimplemented. Underscores' compact shader adapter is a concrete reuse candidate;
its current shader module does not provide mainSound rendering. Sound activation
must remain an explicit user gesture and route through the modular audio system.


## Sound analysis milestone (2026-10-06)

Added `mod.scope`, `mod.spectrum`, `mod.lissajous`, `mod.analyze`. Native stereo
analysers tap active audio buses, pass audio unchanged, and emit IMAGE, CHOP and
RMS/peak FLOAT outputs. Analysis roots follow an explicitly active output;
unrelated sources remain stopped. The `ꘇ-Sound-Analysis` workflow and lesson
catalog entry show a complete RMS → select → math → TOP opacity path. Rebuild
with `scripts/build_audio_analysis_demo.py --server http://127.0.0.1:8001`.
Browser verification uses a separate server, leaving the user workflow on 8000
untouched. Restart Comfy and reload once to discover the four new schemas.

The earlier multipass shader checkpoint remains the next runtime task: named
Common/Buffer/Image/Sound passes, routing, editor tabs and GPU sound are planned
in `docs/livecode-multipass.md`; these analysis nodes do not implement them.


## Current-value inspector (2026-10-06)

`dat.inspect` adds a wildcard input and read-only CodeMirror viewer for live
OpenTouch scalar/CHOP/DAT data and queued Comfy results. It bounds sampled
arrays, describes tensor metadata, freezes only the display, and exposes its
formatted text. No history logger was added. Shared `createEditor` now accepts
`readOnly`; existing editors remain editable. `ꘇ-Inspect-Values` is installed in
the Genereti workflow folder. Browser validation used an isolated server on
8001; the user workflow on 8000 remained untouched.
