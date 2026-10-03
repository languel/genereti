# Genereti node UI

The **ꘇ livecode** toolbar is the reference for custom ComfyUI node controls.
Keep the creative surface prominent and the surrounding controls quiet. Apply
these rules when adding or changing node UI.

- Buttons and dropdowns have no resting borders, shadows or filled backgrounds.
  Use the host's text and surface colors. Hover and active states use a subtle
  fill derived from the current text color.
- Actions and boolean toggles use simple glyphs with native hover tips (`title`)
  and accessible names (`aria-label`). Toggles expose `aria-pressed` and retain
  a visible active fill. Avoid persistent labels, checkboxes and radio rows for
  these controls.
- Choices with several named values use a borderless dropdown. Keep its current
  value readable; add a hover tip describing the choice.
- Match livecode's compact rhythm: 30px controls, 18px glyphs, 4px gaps and 6px
  corner radii. Toolbars may wrap in narrow nodes without covering the workspace.
- Preserve keyboard operation and a visible focus ring. Borderless resting
  controls must still be discoverable on hover and operable without a mouse.
- Show status text for loading, errors or useful running feedback. Avoid repeated
  headings and labels already supplied by the node title or sockets.
- Let connected sockets determine output formats. **Live / Comfy Queue** chooses
  delivery, rather than which outputs exist. Put drawing delivery above its
  editor alongside the theme glyph.

Use `integrations/genereti_comfy_p5/web/js/control-style.js` and the
`genereti-node-controls` class for shared node controls. The drawing theme toggle
uses a display-and-moon glyph; its hover tip explains that it affects IMAGE and SVG
while preserving MASK values. State remains saved in the workflow.

These rules cover Genereti's custom node chrome. Preserve embedded editors'
native tools and behavior, and ComfyUI's own node selection outlines and sockets.

The drawing editor follows the same glyph-first approach for its custom footer
and Library trigger. Footer glyphs match the embedded editor’s native top toolbar
(12px glyphs with 32px hit targets), rather than the surrounding node controls.
Frame navigation uses Image/Mask glyphs, rather than role
selectors. Its accent is neutral and derives from the editor's current theme.
Satori hides editor controls and keeps a dot to exit; the node toolbar stays visible.
Shortcuts remain active. Transparent
paper is the default for new drawings, with a glyph to choose solid paper.

Embedded drawing iframes explicitly use `color-scheme: normal` to match their
document. In a dark Comfy host, inheriting its scheme can otherwise make Chromium
add an opaque white backing despite transparent CSS and canvas pixels. Editor
tool colors still follow Excalidraw's own theme.
