# mediapipe.segments

A separate local browser segmentation stream. Connect the same IMAGE as a
landmark provider, choose the model, download ↓, load ↑, then start ▶.
Starting this node never starts a camera.

The small Selfie model supports Person and Background. The optional Multiclass
model supports Background, Hair, Body skin, Face skin, Clothes and Accessories.
Its model download is approximately 16.4 MB; it is separate from the base
package and may be slower than the binary model. Categories are model output
classes, not fine landmark regions such as eyes.

Open ◉ to toggle categories and save named selection sets. Multiple selected
categories are combined into one mask. Empty selection defaults to Person.
Threshold, edge softness and inversion control the output mask. These controls
take effect on the next frame without reloading the model.

Outputs: grayscale IMAGE mask, transparent IMAGE cutout and observation DAT.
DAT publishes selected coverage, confidence and per-category confidence means.
The named global stream remains available to perception.read/events and
Livecode. Selection sets export/import the same JSON format as landmarks.

All inference stays in a WASM CPU worker with one in-flight and one latest
pending frame. Input is limited to 2–1024 px per side. Pause releases the input;
unload frees the model and worker.
