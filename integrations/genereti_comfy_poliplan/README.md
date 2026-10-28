# ꘇ poliplan

An interactive source node like **ꘇ drawing**, with the **Poliplan** engine (the lean embeddable build of the Artist Model Studio drawing editor) in place of Excalidraw. Poliplan is vendored in `web/vendor/poliplan/` (a built folder; `VERSION` names the commit it came from) and served by this pack at `/genereti/poliplan/`.

## The node

Two boards live in the editor, the **image** board with the **mask** board (draw white) below it, both on transparent paper with their titles hidden, as in ꘇ drawing. Alt+1 / Alt+2 only move the camera to a board (they do not select it, so a hidden title or border stays hidden). There is no "trains" mark: nothing here learns from a board. **Alt+O** (or the ▣ glyph) shows the editor alone, without the node's controls. Their size is the node's `width` and `height` (the boards follow the widgets). At queue time the boards that the connected outputs need are exported at 1:1, uploaded to Comfy's temp folder and read by the python node. Unpainted mask paper is 0 and antialiased edges are weighted by their alpha.

Like the other browser nodes it has the shared toolbar: delivery (Live / Comfy Queue) with pause, the output window / overlay / visual / backdrop glyphs, freeze, minimize and fit. In Live delivery, edits are published to connected IMAGE and MASK outputs and to the output windows; Freeze holds delivery (the editor stays usable). A stroke shows in the live frames while it is drawn (the editor announces it with `draft` events and the export `draft: true` includes it). The SVG and JSON outputs apply at queue time only. The status line shows the live rate and the export time (`live N fps · export X ms`); when exports are slow, frames are spaced out so drawing stays responsive.

**Alt+W** (the overlay glyph) moves the live editor itself into an overlay window that you draw in, above the graph, while the node mirrors the drawing; close it (Alt+W again, or its close glyph) and the editor returns to the node with its state. With a transparent workspace and paper the overlay is transparent, so you can draw over other nodes. **Alt+O** nodes also sit above ordinary nodes (Cmd/Ctrl+[ and ] reorder them).

| Output | What it is |
| --- | --- |
| `image` | the image board as an IMAGE (RGBA when it has transparency) |
| `mask` | the mask board as a MASK (black 0, white 1, grey partial) |
| `svg` | the image board as SVG, with its process record |
| `json` | `{ "poliplan": { "version": 1, "boards": { "image": {…}, "mask": {…} } }, "document": {…} }`: the editable Poliplan document |

**Input `image` (optional).** Drawn behind the editor, in the image board's place, as an underlay that belongs to the node and not to the drawing. It follows the editor's pan and zoom (and the offset the Boards panel gives the canvas), and it follows the connected source live, so freeze the source upstream (a frozen image preview, say) to hold it. Nothing is written into the document: it adds no marks, layers or undo steps, and costs the editor no work. The glyph beside freeze / fit shows or hides it; while it is shown the IMAGE output is the drawing composited over it (contain-fitted, centred), and hidden it outputs the drawing alone. MASK, SVG and JSON never include it. The node's own mirror and the output windows show it under the drawing too.

The drawing is saved in the workflow (the `poliplan` widget). The editor's own menu (≡, first in its toolbar) has the view items, import and export, the palette and the panels (Layers, Properties, Boards); zoom controls are optional there. The image and mask glyphs beside freeze / fit frame those boards.

## Not yet

More outputs (bounding boxes of marks for image generation, timing information, events), live SVG / JSON. A cached raster of committed strokes, so that a live frame exports only the stroke being drawn, needs an editor `draftOnly` export (not requested yet). The editor is active in one place at a time (the node, the output window or the output overlay; the others show its bitmap). `genereti_multi_ui` on the node's properties opts into synced editors in every window.

## Updating Poliplan

In the Artist Model Studio repository: `npm run build:poliplan`, then copy `dist-embed/` into `web/vendor/poliplan/` and write the commit into `VERSION`. Live frames use `export({ format: 'bitmap' })` (an `ImageBitmap`, no PNG encode; upstream since 81805bc), and the node falls back to PNG on its own with an older build. The editor's Lazy and Smoothing settings apply to every stroke since 433b027. See that repository's `docs/EMBEDDING.md` (the protocol: `ams-editor-v1`).
