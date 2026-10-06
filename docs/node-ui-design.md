# Genereti node UI

The **ꘇ livecode** toolbar is the reference for custom ComfyUI node controls.
Keep the creative surface prominent and the surrounding controls quiet. Apply
these rules when adding or changing node UI.

- Buttons and dropdowns have no resting borders, shadows or filled backgrounds.
  Use the host's text and surface colors. Hover and active states use a subtle
  fill derived from the current text color.
- Collapse/expand controls use outline chevrons **⌄ / ›**, distinct from play triangles.
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

In Comfy's Vue node renderer, DOM widgets default to expandable grid rows;
`computeSize` alone does not keep a toolbar compact. Livecode explicitly gives
its delivery and parameter rows their content height and lets only the editor
row fill the remaining node height. Keep this allocation when changing its schema.

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

Keep inference and display separate: **ꘇ generator** owns model parameters and
start/pause, while **ꘇ image preview** owns its canvas and local window controls. Projector links
and relay transport belong to the separate projector node. Place independent window and overlay glyphs beside play/pause. Put the fit
dropdown on its own below preview size, above the image; collapse performance details
under a triangle below it.
Both participate in the shared Live / Comfy Queue delivery contract. Preserve the
legacy combined node's identity for saved workflows.

### Transport and prompt submission

Place Live / Comfy Queue at the top of each browser node, beside its transport
button. On sources and viewers, pause holds browser frame delivery while editing
continues; it never starts a camera or screen capture. Generator transport starts
or pauses inference. Queue still runs through Comfy's Run action.

Generator prompt submission has a glyph toggle with hover text: live typing or a
held draft. The send glyph and Cmd/Ctrl+Enter commit a held draft. Save drafts and
the applied prompt separately, so reopening a workflow preserves that choice.

### Comfy shell Satori

The agent pack adds **Alt+Shift+Z** (or the `ꘇ Satori mode` command in Keyboard
Shortcuts) to hide Comfy's side toolbar, workflow tabs, top action bars, canvas
navigation/minimap and open panels. Nodes, their editors/previews and Genereti
output overlays stay visible. A quiet dot at the bottom right restores the shell.
This outer shortcut is separate from **Alt+Z** inside the drawing editor.

While Satori is active, **N / M / W / A** open Comfy's node/model/workflow/asset
panels; **Cmd/Ctrl+,** opens Settings, **Cmd/Ctrl+Shift+K** opens Keyboard
Shortcuts, and **Cmd/Ctrl+`** opens the logs/terminal panel. **Escape** hides the
revealed panels again. Existing execution shortcuts continue to work. The
presentation is session-only and doesn't overwrite saved layout preferences or
workflow data. Refresh the frontend to load the extension; no backend restart is
required when the agent pack is already installed.

CSS selectors target the Comfy frontend shell, not arbitrary buttons, canvases,
dialogs or iframe contents. After a frontend update, verify the shell selectors
and panel shortcuts. Native Desktop window chrome is outside the frontend and
isn't hidden by this mode.

### Local previews versus workflow delivery

Camera, screen capture, image preview and livecode surfaces have **freeze** and
**minimize** glyphs directly above the preview. These affect only the node's local
preview. Capture/rendering and downstream frames continue; external output windows
also continue updating. Freeze retains the visible frame, while minimize hides or
collapses that surface. Camera/image preview skip local canvas paints in either
state. Livecode retains its iframe runtime behind the frozen snapshot or clipped
preview: it still needs to render for downstream output. These controls don't
promise to stop inference or eliminate producer GPU work.

Camera/screen capture have one top start/stop control. Stop releases the capture
stream; it is distinct from freezing its local view. Capture settings include a
horizontal flip glyph, input longest-side size (256/512/1024/native; aspect ratio
preserved and no upscaling), and sampling rate (0.2/0.5/1/5/15/30 fps). **Hold
input** samples once and holds the workflow input; this is intentionally separate
from **Freeze node preview**, which leaves workflow input running. Device/size/
rate/flip preferences are saved in workflow properties; capture always requires
an explicit start gesture after loading.

All non-livecode Genereti DOM widget grids use content-sized rows anchored at
the top. Extra node height must not be divided among the transport and capture
settings. Capture, image and GPU texture previews follow the last displayed
frame's aspect ratio; freeze retains that frame's ratio until resumed. Do not
cap canvas height independently of width or leave a square CSS ratio on a
rectangular source. Sampling resolution changes pixels, not this display rule.

WebGL performs camera/screen resize and flip before ImageBitmap delivery or queued
PNG encoding. The node preview reads that processed frame. Sampling at a lower
rate reduces processing and delivery, but does not guarantee the physical camera
runs at that rate. Interactive crop and four-point/projective transforms are
reserved for a separate GPU transform node.

Preview controls live in a compact row directly above the image, aligned left: a disclosure triangle to minimize or restore, followed by the freeze glyph. Keep these out of the delivery/play toolbar. Status and performance details belong below the preview.

Local output overlays default to content-only: no resting border, shadow or title bar. An outside edge hit target reveals the compact title bar; hovering the image does not. Its close and keep-controls-visible glyphs have transparent resting backgrounds, hover tips and keyboard focus. Drag the revealed title bar; resize from the outside edges. The keep-visible toggle is session-only.

Overlay opacity changes only its displayed content; source frames remain unchanged. The position-lock glyph prevents dragging/resizing. Click-through passes content-area pointer events to Comfy underneath while outside edges and the revealed toolbar remain interactive. Alt+Shift+O toggles click-through for open overlays as a recovery shortcut. These controls are session-only and apply inside Comfy, not across other macOS applications.

Output canvases preserve source alpha, and fit/letterbox space is transparent. Overlay iframe documents explicitly use a normal color scheme so a dark host cannot introduce an opaque backing. The macOS companion also clears its native window and WebKit backing. Opacity multiplies the source alpha rather than replacing it.

The output-window and overlay glyphs are independent toggles: their pressed state indicates an open surface, and a second click closes it. Closing from the output itself clears the node toggle too. Reopening keeps the node’s selected fit.

Output toolbar glyphs share 18px SVG bounds, 1.5px strokes and centered 30px hit targets. Overlay geometry is stored per node in workflow properties and reused on reopen. The backdrop toggle beside the overlay draws output in Comfy’s background pass, fixed to the viewport, behind nodes and links; it does not capture pointer input. Only one Genereti backdrop is active at a time. Closing restores the previous background renderer.


The drawing node's overlay glyph after delivery moves the **active Excalidraw
editor** into a viewport overlay; drawing and live outputs continue there. Toggle
it again, or close the overlay, to return the editor to its node. It shares image
output's edge-revealed controls, opacity, lock, click-through and remembered
placement. Use transparent paper to annotate over the graph; solid paper stays
solid. Alt+Z exposes drawing tools, and Alt+Shift+O switches between drawing and
interacting underneath. Modern Chromium hosts preserve the iframe runtime and
undo history when moving; older hosts reload it and restore the saved scene.

Livecode render width/height and code-defined values are regular node controls above the editor. Source parameters expose typed sockets; appearance stays in the settings menu. Shared dropdowns use customizable native selects where supported: popup text follows the control font and graph zoom, surfaces follow Comfy theme tokens, and selection/hover highlights use a neutral text-color tint. Older hosts retain native option menus with explicit host surface/text colors.

Livecode's default dark code surface is `#121212` at 50% opacity with muted syntax
colors. Keep completion/tooltips opaque enough to read. Appearance settings remain
independent of native render dimensions and code parameters.

### Preview shortcuts

Two-finger scrolling over a livecode editor stays inside that editor, including
unmodified momentum after releasing Shift and events at its scroll limits.
Shift-scroll retains vertical code scrolling. Pinching over code does not zoom
the browser or graph; use the existing font-size shortcut for text sizing.
Pinching over an embedded livecode preview zooms the workflow at the pointer,
through Comfy's normal zoom handler. Ordinary preview scrolling remains available
to interactive HTML/Markdown content. Standalone exports keep browser gestures.

Select one preview-capable node and press **D** to toggle its graph backdrop or
**Alt+W** to toggle its in-Comfy overlay. Alt+W prioritizes an overlay under the
pointer, including its content iframe. Drawing uses Alt+W to move its active
editor between the node and overlay. These shortcuts leave code editors, text
fields, composition and modified typing alone. Overlay headers identify their
source node with a rectangle glyph and the node title.

**Alt+F** or the overlay header’s **Fill window** glyph fills the current Comfy
viewport. It opens the selected node’s overlay if needed; an existing hovered
overlay takes priority. Toggle again, or press **Escape**, to restore its position
and size. The content remains borderless; controls appear at its top edge.
This uses CSS viewport sizing, not the browser Fullscreen API, a new native
window, or macOS fullscreen Spaces. Browser/app chrome stays under host control.
Presentation geometry is temporary and never replaces the saved overlay rectangle.
**Follow output** livecode adapts its render resolution to this viewport; fixed
textures retain their resolution and use their selected display fit.

**Alt+P** toggles presentation visibility: graph nodes, their embedded code and
links disappear while renderers and workflows continue. Combine it with Alt+F
and Alt+Shift+Z for artwork presentation. It does not alter workflow contents or
node collapse settings. **Alt+Shift+I** independently toggles LiteGraph’s canvas
diagnostics, including while Satori or presentation is active. Both modes hide
these diagnostics by default and restore the normal visibility preference on exit.
The corner counters mean: T = graph clock in seconds; I = graph iterations;
N = total nodes [visible nodes]; V = graph revision; FPS = graph redraw frequency.
This FPS is neither inference speed nor the output’s frame delivery rate.

**Alt+Shift+R** toggles the right properties sidebar independently, including a temporary reveal in Satori. Satori hides that sidebar and its resize gutter without changing the saved open/closed preference. Escape hides temporarily revealed panels.

### Node names and discovery

All Genereti node labels start with `ꘇ`. Operator labels attach it directly to the family name, for example `ꘇdat.totop`; other labels use a space, for example `ꘇ livecode`. The glyph is visual branding, while stable `Genereti…` node IDs prevent namespace conflicts and preserve existing workflows. Search aliases include plain family names (`dat`, `top`, `chop`, `mod`) and branded phrases (`genereti dat`, `genereti top`, `genereti chop`, `genereti mod`), so typing the glyph is optional. Existing descriptive workflow titles receive the prefix when loaded; their wording and node IDs are preserved.

### Interactive output overlays

Livecode Alt+W moves the existing output surface into the overlay, rather than displaying a raster copy. The same iframe keeps its sketch state, selectable document text, links, scrolling and pointer interaction. Closing returns it to the node; code and parameter controls stay in the node. Interaction is enabled by default; the click-through glyph (Alt+Shift+O) explicitly passes input to the graph underneath. Node preview freeze/minimize affects only the embedded view, while the interactive overlay and downstream frames continue. External output windows and graph backdrops remain image displays.

**Alt+O** toggles an output-only node view for Livecode, drawing and nodes using
the shared output-view controls. The existing interactive surface fills the node;
title, sockets, parameters, editor, status and resize controls are hidden. Hover
just outside any edge to reveal the restore-controls glyph above the top edge,
or press Alt+O again. Text editing is excluded. The mode is saved in workflow
properties, preserves node placement, and keeps the same iframe/renderer alive.
Opening an overlay restores normal node chrome; returning to output-only mode
closes the overlay and brings its live surface back into the node.

HTML, Markdown, math and SVG overlays/output-only views use the actual viewport
for document layout, without a CSS scale transform. Text stays selectable and
sharp; overflowing documents scroll inside their view. Raster IMAGE capture
still uses configured render width/height (or Follow output sizing), independently
of the displayed document dimensions. P5 retains texture sizing and its authored
mouse, touch and keyboard callbacks. Reload the Comfy frontend after updating
these browser modules; existing iframe runtimes keep their old code until reload.

### Shared output bars and stacking

Alt+O output-only nodes and Alt+W floating overlays use the same edge-revealed bar: node title, opacity, backward/forward, click-through, keep-visible and close/restore. Output-only nodes hide move/resize lock and fill-window controls, which belong to floating overlays. **Shift-click the node's overlay glyph** toggles output-only mode; an unmodified click toggles the floating overlay. Neither action clones or restarts the renderer.

Hover a view or interact with it, then press **Cmd+[ / Cmd+]** to move it backward/forward one layer. **Cmd+Shift+[ / Cmd+Shift+]** sends it to the back/front. The bar's backward/forward glyphs support Shift-click for the end positions. Ctrl is the equivalent modifier on other hosts. Text fields and code editors retain their bracket shortcuts. Sorting changes display order only and leaves graph execution, source pixels and opacity unchanged. Floating overlays sort against other floating overlays; output-only nodes sort within the graph's node layer. Graph nodes remain below floating overlays. Stack order is session-only.

Alt+W anchors the opened overlay at the current cursor position, clamped to the viewport so its controls remain reachable. Its last size is retained. Opening with the node glyph retains the saved rectangle. Output-only hiding follows the embedded view itself, so Comfy selection updates cannot restore the chrome accidentally.

### Modular audio controls

`ꘇmod.*` uses the same compact themed controls: explicit output Start/Panic, accessible note/drum grids, audition keys and mixer mute/solo/faders. Native parameters remain available for Comfy socket conversion and saved values. Sound never starts on node creation, workflow load or queue. Runtime AudioNodes and playing state are excluded from workflow serialization.

## Shared CodeMirror controls

Livecode and DAT/TOP/CHOP text surfaces use the same editor defaults in **Settings → Genereti → Editor** (theme, font, default size, line height, wrapping, completion, hover docs and color overrides). Livecode keeps its settings menu as a shortcut to these global preferences. Its chevron minimizes just the editor; the output and renderer continue. Auto-update uses a lightning glyph. Compact operator editors omit the font dropdown; **Cmd/Ctrl+Shift+Plus/Minus** changes the focused or selected node font size, saved in `generetiEditorFontSize`. This override survives changes to the shared default. Editing Default size in the Livecode menu clears that node override.

Format and minify operate on explicit selections (including multiple ranges), or the whole document when all selections are empty. Each operation is one isolated undo transaction; a changed draft/selection cancels an in-flight format. Fragments must be valid for the chosen formatter; parse errors leave text unchanged. GLSL reindent follows the same selection rule.

Toolbar choice dropdowns use a chosen glyph and chevron when closed, then glyph plus label for each menu entry. The shared decorator in `choice-glyphs.js` covers Livecode view/sizing/fit, delivery, capture and lesson/export controls while retaining native select values, keyboard input and change events. Labeled settings fields keep their text. Browsers without customizable native selects retain readable native dropdowns. Auto-update/apply-while-typing uses the same **ϟ** glyph across editors.

Shared DAT/TOP/CHOP code editors have a divider below the code. Drag it to set editor height, use Up/Down for 16px adjustments, or double-click to reset to 160px. Drag distances account for graph zoom. Height is saved per widget in `generetiOperatorHeights`; minimizing hides the divider and restores the chosen height when expanded.
