# mediapipe.stream

An optional, local browser worker publishes a named global perception stream.
Connect a live IMAGE, choose pose/hands/face/segment, then download ↓, load ↑,
and start ▶. Camera capture is started separately. Pause releases the input;
unload × frees the worker/model. No models ship in the base package.

IMAGE is a real person confidence mask for segment, or a landmark overlay for
other tasks. DAT carries named features, source frame, revision, geometry, age,
and timings. Use perception.read/events anywhere in the workflow with the same
name; readers do not repeat inference. Inputs must be explicitly resized to
2–1024 px per side. WASM CPU only in this milestone.

See docs/browser-perception-plan.md for download sizes, licenses and contract.
