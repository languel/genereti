# Drawing quick reference

Draw with the embedded Excalidraw tools. Pan and zoom navigate the editor; the output frame determines the artwork sent downstream.

- **image:** the captured drawing at its configured output size, retaining transparency when present.
- **mask:** the configured mask frame.
- **svg:** cropped vector drawing.
- **json:** editable scene document.

Open the drawing editor before queueing so it can capture the current frame. The node does not generate an image with a model. Connect its image output to an effect, Livecode, preview or an independently installed inference node.

Local windows, overlays and backdrops are viewers. Use the output framing controls to choose what is captured rather than relying on the editor’s zoom.
