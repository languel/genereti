# ꘇ top.opticalflow

Dense 5×5 Lucas–Kanade small-motion flow. Analysis width caps the longest axis (default 256); aspect is retained. R/G encode signed horizontal/vertical displacement in analysis pixels: `(channel - 0.5) * 2 * max_motion`. Positive X is right; positive Y is down. B is a local structure/confidence heuristic; alpha is one. Live remembers the previous source dispatch; optional previous IMAGE overrides history. Queue requires previous or emits neutral flow. Use ↺ to reset. History resets on settings, source, dimensions and seek. This is one local solve without a pyramid: large motion, flat regions, lighting changes and occlusions can fail. Live rgba8 storage quantizes neutral 0.5 to 128/255; account for one byte of precision.

Model-free WebGPU in Live mode; queued PyTorch implementation. Uses shared preview, output window, overlay and backdrop controls. No model downloads.
