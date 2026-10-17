# ꘇ poliplan

An interactive source node like **ꘇ drawing**, with the **Poliplan** engine (the lean embeddable build of the Artist Model Studio drawing editor) in place of Excalidraw. Poliplan is vendored in `web/vendor/poliplan/` (a built folder; `VERSION` names the commit it came from) and served by this pack at `/genereti/poliplan/`.

## The node

Two boards live in the editor, side by side: **image** (white paper) and **mask** (black paper, draw white). Their size is the node's `width` and `height` (the boards follow the widgets). At queue time the boards that the connected outputs need are exported at 1:1, uploaded to Comfy's temp folder and read by the python node.

| Output | What it is |
| --- | --- |
| `image` | the image board as an IMAGE (RGBA when it has transparency) |
| `mask` | the mask board as a MASK (black 0, white 1, grey partial) |
| `svg` | the image board as SVG, with its process record |
| `json` | `{ "poliplan": { "version": 1, "boards": { "image": {…}, "mask": {…} } }, "document": {…} }`: the editable Poliplan document |

**Input `image` (optional).** Shown under the image board, at 45% opacity, as the last run saw it (a reference to draw over; it is not part of any export). With `over_input` on, the image board is exported without paper and composited over the input (resized to the board), so `image` is the drawing on the input.

The drawing is saved in the workflow (the `poliplan` widget). The editor's own menu (≡, first in its toolbar) has the view items, import and export, the palette and the panels (Layers, Properties, Boards); zoom controls are optional there. Image / Mask in the node's bar frame a board.

## Not yet

Live delivery (the drawing node's Live mode), more outputs (bounding boxes of marks for image generation, timing information, events), overlay over the graph, and passing an input image as a mark rather than a reference.

## Updating Poliplan

In the Artist Model Studio repository: `npm run build:poliplan`, then copy `dist-embed/` into `web/vendor/poliplan/` and write the commit into `VERSION`. See that repository's `docs/EMBEDDING.md` (the protocol: `ams-editor-v1`).
