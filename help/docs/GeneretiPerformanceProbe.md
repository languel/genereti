# Performance probe

Connect any output to **ꘇ performance probe**. The probe observes delivery without drawing or encoding images.

Live IMAGE shows received FPS, dimensions, frame interval, interval jitter, browser delivery delay and update count. CHOP and other event-producing control outputs show updates per second; channel/sample counts and declared sample rate are separate from actual delivery rate. Reset clears the measurement window.

Rates use a rolling two-second window. Idle sources show zero. Queued outputs show type, tensor shape/dtype/storage size or bounded collection metadata; queued update rate is not model inference FPS. Browser delivery delay is not GPU execution or inference time. Outputs without live events require Comfy Queue for metadata.

An attached image probe keeps its upstream live source active, including offscreen. Remove the probe when finished measuring. It does not change the measured output.
