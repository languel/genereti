# Authoring OpenTouch lessons

Install the DAT, CHOP, texture, p5, stream and agent packs with `scripts/install_comfy.sh`, then restart Comfy and refresh. Open **Workflows → Genereti → ꘇ-OpenTouch-Operators-and-Lessons**. The model-free project includes real operators, the report and a `dat.lesson` authoring node. Camera, device I/O, audio and model inference never start automatically.

## Authoring node

Add **dat.lesson**. Its shared CodeMirror editor holds the lesson JSON. Its toolbar provides:

- **▷ Run**: validate/register the document and start its learner guide. The editor’s play button and **Cmd/Ctrl+Enter** do the same, applying the current draft first. **Apply while typing** updates the JSON without starting the guide.
- **■ Stop**: end the guide; learner edits stay and the prior viewport returns.
- **Document export**: Markdown, standalone static HTML, or Print / Save as PDF.
- **{}**: export editable lesson JSON for reuse or Import guide.
- **⌄ / ›**: collapse or expand the outline.
- **Tutorial startup**: Manual start (default), Start on open, or Start if not played. Startup is saved with the lesson node; first-time tracking is local to this browser and keyed by lesson ID. Starting a guide never starts audio, capture or inference. If several lessons request startup, the first one in the workflow opens.

Drag the learner panel by its title bar to reposition it; its position stays through steps and reopening during the session. **Settings → Genereti → Learning** provides **Guide highlight color** (outline, faint background tint and glow; blank follows the theme), **Pulse guide highlight**, **Guide panel background** (Theme, Soft contrast, Custom), and a custom CSS background color. Theme preserves the existing default. The three-second glow cycle respects reduced-motion preferences. Highlight corners follow the target’s radius and graph zoom; guide focus does not change node selection. Highlight tracking follows graph panning every animation frame while a guide is active.

The learner dialogue only contains narration, focus, previous/next, action checks and skip. It has no document exports. **Settings → Genereti → Learning → Interactive lessons** or **ꘇ OpenTouch lessons** in the command palette opens the bundled lesson chooser. “Open lesson workflow” creates a separate temporary Comfy workflow tab, preserving the current workflow.

The JSON is an authored lesson, not executable JavaScript:

```json
{
  "format": "genereti-guide",
  "version": 1,
  "id": "my-texture-lesson",
  "title": "Make a moving texture",
  "summary": "Learn by editing a real expression.",
  "steps": [{
    "title": "Change the expression",
    "text": "Try x*8 instead of x*12. Continue when the image changes.",
    "target": {
      "nodeType": "GeneretiTextureExpression",
      "part": "code",
      "widget": "expression"
    },
    "check": {"kind": "changed-widget"}
  }]
}
```

Semantic parts are `node`, `code`, `preview`, `toolbar` and `parameter`. The first matching node type is selected/focused; absent targets show guidance to add the node or open the lesson workflow. Current parameter focus highlights the containing node. Checks are `changed-widget`, `connected-input` (optional input name), `overlay-open`, `backdrop-open` and `preview-frozen`. A changed-widget check compares against the value at step entry. Checks do not assess artistic correctness.

Use stable internal node IDs from the [catalog](opentouch-catalog.md), not their visible labels. Guides may have 1..100 steps. Imported files are bounded to 512 KB; narration and semantic fields have length limits. Arbitrary script/selector fields are discarded. Guides cannot execute code, start devices or queue inference. Imports/register calls last for the current browser page; save authored JSON in the workflow or export it to retain it.

Bundled catalog: `integrations/genereti_comfy_agent/web/lessons/catalog.json`. Browser API: `window.generetiGuides.list()`, `.register(document)`, `.start(id)`, `.stop()`, `.open()`. Agent tools expose guide list/start/stop for the same registered guides.

## Document export

DAT text/table nodes and the lesson authoring node share the document export utility. Livecode Markdown/HTML/LaTeX adds **Document HTML** and **Print / Save as PDF** in its existing export menu. Static HTML sanitizes scripts, embeds local KaTeX fonts, preserves selectable text/tables/math, and remains independent of Comfy. External image links stay references.

PDF uses the host print dialog. Choose Save as PDF; hosts without printing can export HTML and print in a regular browser. This exports the authored lesson/report document, not an interactive executable Comfy graph. Export the Comfy workflow JSON separately to preserve its nodes and links.

This first pass does not record teacher actions, snapshot/undo the full graph, grade students, synchronize classrooms or upload learner activity. The semantic focus/check pattern draws on the existing Underscores and Artist–Model Studio walkthroughs.

## Learn to author a tutorial

Open **Settings → Genereti → Learning → Interactive lessons → Open authoring workflow**. This opens `ꘇ-Tutorial-Authoring.json` in a separate tab and starts **Make a tutorial with Genereti**. Its steps teach document identity, narration, semantic targets, learner checks, exports and playback. Edit the single `dat.lesson` node to make your own two-step texture lesson. The example includes the actual tools the learner will use.

Running your draft replaces the authoring walkthrough with your own guide. Export controls remain on the author node. Save workflow JSON for the working graph, editable guide JSON for reuse, and Markdown/HTML/PDF for static notes. The learner dialogue exports nothing.

`ꘇ-Interactive-Output-Views.json` offers another small authoring example about interaction, overlays and presentation. Bundled chooser actions open either mini demo without replacing the current workflow. Rebuild these small fixtures with `python3 scripts/build_learning_examples.py`; they reuse canonical operator schemas and start no devices or model inference.

## Guide appearance in JSON

An optional `style` on the guide supplies defaults. A step's `style` overrides only the fields it supplies. Settings remain the fallback; existing guide files need no changes.

```json
"style": {
  "panel": {
    "backdrop": "#20262b",
    "frame": {"color": "#65c9b5", "width": 1, "radius": 10},
    "glow": {"enabled": true, "radius": 12, "spread": 3, "pulse": true, "duration": 3}
  },
  "target": {
    "backdrop": "rgba(101, 201, 181, 0.06)",
    "frame": {"color": "#65c9b5", "width": 2},
    "glow": {"enabled": true, "radius": 12, "spread": 3, "pulse": true, "duration": 3}
  }
}
```

`target` styles the active node or targeted code/toolbar/preview region. Its corner radius automatically follows the target and graph zoom unless explicitly supplied. `backdrop` is the surface fill, not a full-workspace veil; use `transparent` to remove it. Colors are CSS colors. The panel glow inherits the target frame color unless `glow.color` is supplied. Panel glow is steady by default; only the target pulses by default. Set panel `glow.pulse: true` explicitly to animate it. With no style, panel glow stays off and the target uses a tighter 12 px glow with a three-second cycle. Setting `pulse: false` keeps a steady glow; `enabled: false` removes it. Reduced-motion preferences always suppress animation.

Dimensions are screen pixels: frame width 0–8, radius 0–64, glow radius 0–64, spread 0–16; duration is 0.5–20 seconds. These structured fields are validated and retained when exporting editable guide JSON. Invalid CSS colors fall back to the theme. For example, a step can override just `"style": {"target": {"glow": {"enabled": false}}}` without losing the guide's other styles.

## Record selections and actions

The authoring toolbar has **● Record tutorial actions**, **+ New recorded step**, and **✓ Stop recording and append steps**. Record starts a local session; perform a coherent task, press +, and repeat. Stop appends the draft steps to the lesson without replacing existing narration. Edit each draft's title, text and hint before sharing. Removing the author node cancels recording.

Recording captures node clicks/selections, scalar parameter and text edits, input connection changes, and Genereti overlay/backdrop/freeze/minimize toggles. Slider revisions coalesce into their final value. Click/drag positions are normalized within a node and become visible pointer cues; these cues show the gesture rather than dispatching arbitrary synthetic UI clicks. Parameter values and wiring are changed through node APIs. Node creation/deletion, freehand strokes, application settings and device activation are not recorded in this first version.

Recorded references include a persistent `ref` saved in node properties plus `nodeId` and `nodeType`. This resolves duplicate node types in the supplied workflow. If references cannot resolve and several nodes share a type, playback reports the ambiguity rather than editing a random node.

A step may include `hint` and `actions`:

```json
{
  "title": "Change the synth level",
  "text": "Lower the level to 0.25.",
  "hint": "Use the level parameter on mod.synth.",
  "target": {"nodeType": "GeneretiAudioSynth", "nodeId": 4, "part": "parameter", "widget": "level"},
  "actions": [
    {"kind": "pointer", "target": {"nodeType": "GeneretiAudioSynth", "nodeId": 4}, "gesture": "drag", "from": [0.3, 0.2], "to": [0.7, 0.2]},
    {"kind": "set-widget", "target": {"nodeType": "GeneretiAudioSynth", "nodeId": 4, "widget": "level"}, "value": 0.25}
  ]
}
```

**Hint** reveals the authored hint. **Do it** plays the current step and leaves advancement to the learner. `type-text` visibly types a string into a named widget; `set-widget` commits a scalar value; `select` selects a node; `connect` uses `source`, `output` and `input` names; `disconnect` removes a named input link; `view` sets a supported preview toggle; `pointer` shows a click or drag; `run-code` runs a non-audio Livecode sketch after typing. Source auto-update is paused during typing. Audio/Strudel, camera, screen capture, MIDI permissions and workflow queue remain explicit tool actions. The structured action schema accepts no arbitrary selectors, scripts or commands.

A Do it attempt is grouped with the graph change hooks for Comfy undo. Closing the guide, changing steps or switching workflows interrupts playback; already-applied edits stay. Run failure is shown in the guide, so the learner can correct a missing tool or socket. Exports retain hints and actions in editable JSON; static Markdown/HTML/PDF include hints and action summaries, not an executable player.

Open **ꘇ-Tutorial-Authoring** for the expanded “Make a tutorial with Genereti” walkthrough and runnable typing/Hint/Do it examples.
