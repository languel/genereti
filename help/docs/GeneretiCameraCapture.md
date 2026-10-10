# Webcam capture quick reference

Choose a camera and press the top Play control to start it. Stop releases the device. Capture never starts automatically.

Choose explicit width and height (default 512 × 288), Match source, or Match output window. Contain keeps the entire camera image with black bars where needed; Cover crops; Stretch fills the dimensions; Native pixels keeps the camera’s pixel size centered. Framing and horizontal flip apply to the sampled output, so preview, live consumers and Comfy Queue agree.

Sampling rate controls all deliveries. Hold keeps the last frame. Freeze and minimize affect only local drawing; connected consumers continue receiving sampled frames. Disconnected, unused capture nodes do not block queuing another workflow branch.
