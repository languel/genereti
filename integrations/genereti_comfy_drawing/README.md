# ꘇ drawing

An interactive Excalidraw source node for ComfyUI, using the Genereti host editor
without model controls or generation. Its IMAGE and MASK sockets can replace
Painter's output connections. Native tools, colors, imported images, undo, pan
and zoom stay interactive inside the node.

Two native frames define the outputs:

- **IMAGE**: the Image frame cropped into a configured-size IMAGE tensor (RGBA for transparency).
- **MASK**: the Mask frame cropped into a configured-size mask. Black is 0, white is 1,
  gray gives partial strength. Use white or gray ink on its black paper.
- **SVG**: a STRING containing the Image frame's cropped SVG vector drawing.
  It includes imported images, with the configured viewport.
- **JSON**: a STRING containing the editable Excalidraw scene, including both
  frames and embedded image files. `genereti.imageFrameId` and
  `genereti.maskFrameId` identify the output regions for downstream controls.

The Image and Mask glyphs fit their protected frames without changing the
selected tool or ink. Rectangular frames
match the configured output dimensions. SVG and tensor crops exclude runtime
paper and preview elements. Grid, toolbars, selection and zoom never enter the
output. Shapes intersecting a region are cropped, matching the main host.

The editor is always interactive in the node. Connected IMAGE, MASK, SVG and JSON
ports determine which outputs are produced; multiple outputs can run together.
Unconnected outputs skip their exports and uploads. Use the editor's Image/Mask
buttons to focus a frame. Resize the node for more room.
Drawings, output dimensions and appearance settings are saved per node in the workflow. Open/Save drawing
also supports `.excalidraw` files. Temporary raster captures go to Comfy's temp
folder on Queue. SVG/JSON are data strings for downstream tools; they do not
execute scene contents. Painter image-input widgets are not implemented.

Run `scripts/install_comfy.sh`, restart ComfyUI and refresh its browser. Add
**ꘇ drawing** from Genereti / Interactive Sources, or open
**ꘇ Drawing Live Inputs.json**. The drawing node needs no models or Genereti
server. The example workflow's Core ML generator still requires the macOS
Apple silicon app. Rebuild the shared editor after source changes with
`npm run build:editor`.

## Live or Comfy Queue

The dropdown above the editor selects **Live** or **Comfy Queue**.
**Live** (default) publishes the framed drawing directly to connected browser
viewers. Connect IMAGE to **ꘇ live image preview** to see edits immediately,
or to **Genereti Projector** for a projector view. No Genereti model server, Python
execution or raster uploads are needed for live drawing frames. **Comfy Queue**
pauses browser delivery; Run snapshots only connected outputs for Python nodes.
Normal Queue execution remains available in either mode.

Browser bitmap events identify the IMAGE or MASK output slot. SVG/JSON updates
use `genereti-live-value` events with `nodeId`, `outputSlot` and `value` fields.
Python consumers of these sockets receive their values on Queue execution.

Use **ꘇ Drawing Source.json** for the drawing-only live/queued example.
For inference, use **drawing → ꘇ generator → ꘇ live image preview** and start the
generator with ▶. **ꘇ Drawing Generator Preview.json** demonstrates this
split. The generator requires the macOS Apple silicon model backend; the raw
viewer does not. The older combined **Genereti Live Preview** remains available
for existing workflows.

## Appearance and narrow nodes

The display-and-moon glyph toggles **Match editor theme** (off by default).
Hover for its label; an active fill shows when enabled. Enable it to make live/queued IMAGE and
SVG rendering follow the editor's light/dark appearance. SVG uses Excalidraw's
native export filter; element geometry and authored JSON colors are unchanged.
MASK always exports its original grayscale values, independent of theme. The
appearance choice is saved with the node's drawing.

The Comfy drawing host keeps the desktop toolbar and side properties panel even
in narrow nodes. Other Genereti editor pages retain their responsive layouts.
The editor build adapts the pinned Excalidraw 0.18.1 breakpoint and fails clearly
if a dependency upgrade changes that code.

Image and Mask output frames are protected, locked workspace regions. Cmd+A /
Ctrl+A and Delete clear editable shapes while leaving both frames in place.
Protection also applies when restoring older drawings. Frame IDs and output-role markers remain in JSON.

Custom node controls follow the [livecode UI design rules](../../docs/node-ui-design.md).

## Paper and Satori

New drawings use transparent paper. The slashed-paper glyph switches transparent/white
paper; existing drawings retain their background. Browser PNG frames and SVG
preserve transparency. Transparent queued IMAGE tensors retain four RGBA channels; downstream nodes must
support alpha or explicitly convert to RGB. Opaque images stay RGB. MASK retains
black paper and original grayscale values. The grid glyph separately toggles the
editor grid, which never enters exports.

Transparent paper also shows through to the Comfy node background in the editor;
tool panels retain their theme surfaces. The embedded iframe and document use
`color-scheme: normal` to prevent Chromium from adding an opaque backing in a
dark host. Refresh the Comfy page after updating the editor assets. The standalone
drawing page uses a dark backdrop so transparent artwork remains visible.

The lightning glyph toggles **Update while drawing**. When disabled, exports
wait for pointer release. The Library control uses its native book glyph.

**Satori** hides editor controls and leaves a small exit dot. The node toolbar
above the drawing stays visible.
Use **Alt+Z** to enter/exit, **Alt+1 / Alt+2** to fit Image/Mask, and
**Shift+Alt+U** to toggle updates during strokes. Native Excalidraw tool shortcuts
remain available; **S / G** open stroke/fill palettes. Click the dot to exit.

**[ / ]** decrease/increase brush width by 1; **Shift+[ / Shift+]** adjust by
0.25. Width stays between 0.25 and 100. These shortcuts affect the next strokes,
work in Satori, and leave text fields alone.

## Output size and auto mask

The settings glyph above the editor, before Match Theme, opens output sizing.
Choose an aspect or preset, or enter width and height (64–2048 pixels). Image and
Mask frames and IMAGE/MASK/SVG exports share this size. Settings persist in scene
JSON under `genereti.outputSize`. Resizing changes the crop rather than scaling
existing Image artwork; mask-frame children move with their frame.

The **Auto Image → Mask** glyph immediately after Fit Mask derives a mask from
Image: alpha coverage on transparent paper, inverted luminance on solid paper.
White means coverage and black means empty. The Mask frame shows a locked runtime
preview; manual mask artwork is retained and becomes the output again when auto
mask is disabled. The setting persists as `genereti.autoImageMask`.

### Drawing entry and clearing

New editors start in Satori, with freehand selected and Image fitted. Alt+Z or the
zen dot expands/collapses editor chrome; node transport/settings stay visible.
Help and the dot share the compact bottom toolbar with zoom, undo and drawing
controls. Mask sits below Image, with at least one frame height of separation.
Cmd/Ctrl+Shift+Backspace clears drawing content immediately, preserving Image,
Mask and runtime paper/preview infrastructure. The same action is in the editor
menu; it is undoable and does not ask for confirmation. It does not intercept
Backspace while typing in text/input fields.


The drawing node's overlay glyph after delivery moves the **active Excalidraw
editor** into a viewport overlay; drawing and live outputs continue there. Toggle
it again, or close the overlay, to return the editor to its node. It shares image
output's edge-revealed controls, opacity, lock, click-through and remembered
placement. Use transparent paper to annotate over the graph; solid paper stays
solid. Alt+Z exposes drawing tools, and Alt+Shift+O switches between drawing and
interacting underneath. Modern Chromium hosts preserve the iframe runtime and
undo history when moving; older hosts reload it and restore the saved scene.
