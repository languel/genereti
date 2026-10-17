# ꘇ poliplan

An interactive source node like **ꘇ drawing**, with the **Poliplan** engine (the lean embeddable build of the Artist Model Studio drawing editor) in place of Excalidraw. Poliplan is vendored in `web/vendor/poliplan/` (a built folder; `VERSION` names the commit it came from) and served by this pack at `/genereti/poliplan/`.

## The node

Two boards live in the editor, the **image** board with the **mask** board (draw white) below it, both on transparent paper with their titles hidden, as in ꘇ drawing. Alt+1 / Alt+2 only move the camera to a board (they do not select it, so a hidden title or border stays hidden). There is no "trains" mark: nothing here learns from a board. **Alt+O** (or the ▣ glyph) shows the editor alone, without the node's controls. Their size is the node's `width` and `height` (the boards follow the widgets). At queue time the boards that the connected outputs need are exported at 1:1, uploaded to Comfy's temp folder and read by the python node. Unpainted mask paper is 0 and antialiased edges are weighted by their alpha.

Like the other browser nodes it has the shared toolbar: delivery (Live / Comfy Queue) with pause, the output window / overlay / visual / backdrop glyphs, freeze, minimize and fit. In Live delivery, edits are published to connected IMAGE and MASK outputs and to the output windows; Freeze holds delivery (the editor stays usable). A stroke shows in the live frames while it is drawn (the editor announces it with `draft` events and the export `draft: true` includes it); `over_input` compositing and the SVG and JSON outputs apply at queue time only.

**Alt+W** (the overlay glyph) moves the live editor itself into an overlay window that you draw in, above the graph, while the node mirrors the drawing; close it (Alt+W again, or its close glyph) and the editor returns to the node with its state. With a transparent workspace and paper the overlay is transparent, so you can draw over other nodes. **Alt+O** nodes also sit above ordinary nodes (Cmd/Ctrl+[ and ] reorder them).

| Output | What it is |
| --- | --- |
| `image` | the image board as an IMAGE (RGBA when it has transparency) |
| `mask` | the mask board as a MASK (black 0, white 1, grey partial) |
| `svg` | the image board as SVG, with its process record |
| `json` | `{ "poliplan": { "version": 1, "boards": { "image": {…}, "mask": {…} } }, "document": {…} }`: the editable Poliplan document |

**Input `image` (optional).** Shown under the image board, at 45% opacity, as the last run saw it (a reference to draw over; it is not part of any export). With `over_input` on, the image board is exported without paper and composited over the input (resized to the board), so `image` is the drawing on the input.

The drawing is saved in the workflow (the `poliplan` widget). The editor's own menu (≡, first in its toolbar) has the view items, import and export, the palette and the panels (Layers, Properties, Boards); zoom controls are optional there. Image / Mask in the node's bar frame a board.

## Not yet

More outputs (bounding boxes of marks for image generation, timing information, events), live `over_input` compositing and live SVG / JSON, an editor that stays active in both the node and the overlay at once (today there is one editor, in the node or in the overlay), and passing an input image as a mark rather than a reference.

## Updating Poliplan

In the Artist Model Studio repository: `npm run build:poliplan`, then copy `dist-embed/` into `web/vendor/poliplan/` and write the commit into `VERSION`. See that repository's `docs/EMBEDDING.md` (the protocol: `ams-editor-v1`).
