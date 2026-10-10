# Browser media streams and comparison

The 2D stream source follows Artist–Model Studio's media-by-address approach: images load once, videos use browser playback, and frames are sampled locally for downstream consumers. Genereti also accepts local files and a live IMAGE input. It does not proxy remote media or embed arbitrary web pages. Use Webview for interactive HTML pages.

Image preview, capture and comparison share Contain / Cover / Stretch / Native framing plus Match source / Match output / explicit width and height. Preview and comparison display choices preserve their queued passthrough batches. Capture framing applies before output sampling, so live and queued captured frames agree. IMAGE connected to 2D stream passes through unchanged in Comfy Queue when no media file/URL is loaded.

D targets a preview-capable node under the pointer, falling back to the selected node. Keyboard shortcuts remain inactive while editing input fields. Preview freeze/minimize and offscreen visibility skip local drawing; connected consumers and open output viewers can continue receiving frames.

Local files are browser-session resources and must be reselected after a page reload. Saved URLs load again without starting playback. Animated GIFs use ImageDecoder for actual frame progression; videos depend on browser codec support. Remote URLs must provide CORS-readable media. Clear loaded media to switch to IMAGE input. Camera capture remains explicitly user-started.

## Validation checkpoint — October 10, 2026

Tested in Comfy at localhost:8188 with separate browser workflows: live PNG and alternating GIF frames, a generated WebM video, direct SVG URLs, queued media snapshots and A/B comparison, explicit 200 × 100 stream framing, and hovered D backdrop with another node selected. Webcam verification used a synthetic 80 × 40 stream: 100 × 100 Contain produced black bars, Cover filled the frame, Queue succeeded, and Stop released the test track. Physical camera/device behavior was not verified.

The bundled **ꘇ-2D-Stream-Compare** workflow uses two authored SVG paper stages; it needs no model downloads or camera access. Help pages describe each node's output and persistence contract. Validation passed 195 JavaScript tests and 81 Python tests, with current reference/template mirrors and package allowlist checks. These changes remain unreleased.

## Performance probe

Connect **ꘇ performance probe** to any output for delivery-rate diagnostics. IMAGE shows dimensions and FPS; CHOP control events show updates/s, channels, samples and declared sample rate. Detailed intervals, jitter, delivery and counts expand with a chevron. Queued results report metadata without copying tensor pixels. A connected live image probe keeps its source active. Routine Image Preview timings are now consolidated here; local errors remain visible.

Probe validation in Comfy: a CHOP expression delivered about 30 updates/s with a declared 60 Hz sample rate; a 512 × 512 GPU texture delivered about 30 FPS without pixel readback. These are observations from the test workflow, not guaranteed performance. Preview minimize explicitly hides canvases with an existing display style, and its button is first on the shared toolbar.
