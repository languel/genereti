# GeneretiCore UI handoff

This is the portable UI contract from Genereti's October 9, 2026 refinements.
Apply it to GeneretiCore's own controls and help without changing node IDs,
workflow compatibility, or inference behavior. Use one family symbol: `ꘅ` for
GeneretiCore and `ꘇ` for Genereti; never stack prefixes.

Canonical guides: [node UI](node-ui-design.md) and [help](help-guidelines.md).

## Layout and visual controls

| Element | Shared convention |
| --- | --- |
| Node layout | Ports → transport/output toolbar → visual preview → parameters → code/text editor |
| Toolbar buttons | 20 × 20px, 6px radius, no flex gap, no resting border or shadow |
| Glyphs | 14px SVG or 12px text, centered on both axes; reduce padding rather than enlarge icons |
| States | Host theme colors; subtle current-color hover/active fill; visible keyboard focus |
| Preview toolbar | Minimize, freeze, fit, and time sync grouped above the preview |
| Output toolbar | Window → overlay → Alt-O visual view → backdrop |
| Overlay bar | Same button/glyph sizes, 24px bar; opacity slider 51px (formerly 76px) |
| Alt-O glyph | Outline square with filled smaller center; same glyph for enter and restore |
| Signal previews | Transparent, no border/radius/shadow by default; optional CSS background color setting |
| Help | Header `?`, inset 8px from right; same-button toggle and Escape to close shared Help |

Alt-O preserves the preview's displayed position, width, and height. Fade the
other node elements to opacity zero rather than moving or removing their hit
areas. Invisible ports still allow hover tips and connections; cables stay
visible. Keep interactive surfaces and renderers alive. The edge-revealed title
bar moves the node; the glyph before its label restores controls. Alt-O prefers
the node under the pointer, then selection. Alt-Shift-O toggles all visual nodes.

Preserve positional serialization when reordering widgets for presentation.
Minimizing/restoring must preserve width and preview height. Dynamic parameters
stay above code, retain stable socket IDs, and update numeric precision when
step definitions change. Remove binary arithmetic noise from user edits without
quantizing to the slider step or rounding connected signal data.

Skip offscreen signal preview drawing. Freezing/minimizing a preview affects
local display; it does not promise to stop inference or upstream rendering.
Keep compute, delivery, and preview controls semantically separate.

## Source pointers and adoption checks

- `integrations/genereti_comfy_p5/web/js/control-style.js`: shared dimensions and theme states.
- `integrations/genereti_comfy_p5/web/js/preview-order.js`: display order versus saved values.
- `integrations/genereti_comfy_stream/web/js/preview-controls.js`, `overlay-shell.js`,
  `node-output-view.js`: output actions, compact bars, and in-place Alt-O views.
- `integrations/genereti_comfy_chop/web/preview-appearance.js`: optional transparent preview background.
- `integrations/genereti_comfy_agent/web/js/help-panel.js`, `node-reference.js`:
  shared tabs, Escape, header help, and reference context.

Port the behavior into Core's own extension paths and settings namespace; do
not blindly copy Genereti's absolute `/extensions/...` imports. Keep Core's
model/inference requirements explicit in Welcome and references.

Verify at default node width and zoom: glyph centering, toolbar fit, native
hover tips, header resize clearance, and keyboard focus. Exercise Alt-O enter,
restore, dragging, invisible port connections, and all-node toggles. Save/reload
and check parameter values and wires. Verify help from composer focus, Auto
selection following, and context handoff without sending. Confirm preview
freeze/minimize/offscreen behavior while downstream data stays live.

## Companion browser bridge

Genereti now exposes `window.generetiReference` for companion document registration
and node-reference toggling, announced by `genereti-reference-ready`. Register a
mapping of stable document/node IDs to Markdown with `registerDocuments`;
Contents refreshes on catalog registration, and Auto uses those authored pages.
Core-family native image IDs retain their existing Latin names and ꘅ labels.

`window.generetiCompanion` version 1 exposes `publishLive`, `attachExecutionMode`,
`visualNodeControls` and `ensureControlStyle`, announced by
`genereti-companion-ready`. Companions can consume these without importing
Genereti's extension URL aliases. A ready event announces UI availability only;
it does not start model inference, capture or audio. Core's source and workflow
migration are documented in its `docs/realtime-image-demo.md`.
