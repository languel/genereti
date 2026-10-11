# ꘇ top.key

Chroma mode removes RGB colors close to the key color using normalized Euclidean distance. Luma mode keeps luminance above the low/high ramp. High must be at least low; equal values approximate a hard key. Invert reverses the matte. Output image multiplies original alpha; matte outputs opaque grayscale. Despill reduces the dominant key channel near removed regions; default zero. This is a simple color key, not semantic segmentation.

Model-free WebGPU in Live mode; queued PyTorch implementation. Uses shared preview, output window, overlay and backdrop controls. No model downloads.
