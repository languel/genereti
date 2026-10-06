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

Drag the learner panel by its title bar to reposition it; its position stays through steps and reopening during the session. **Settings → Genereti → Learning → Appearance** provides **Guide highlight color** (outline, faint background tint and glow; blank follows the theme), **Pulse guide highlight**, **Guide panel background** (Theme, Soft contrast, Custom), and a custom CSS background color. Theme preserves the existing default. The three-second glow cycle respects reduced-motion preferences. Highlight corners follow the target’s radius and graph zoom; guide focus does not change node selection. Highlight tracking follows graph panning every animation frame while a guide is active.

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
