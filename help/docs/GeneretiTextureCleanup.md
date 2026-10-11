# Cleanup quick reference

Model-free spatial cleanup and resize; Live uses WebGPU, Queue uses PyTorch.

- **width/height:** explicit output dimensions. Match the source aspect ratio.
- **method:** bilinear baseline or bicubic enlargement.
- **smoothing:** 3×3 bilateral blend before resize. Start at 0.25; zero skips it.
- **color_threshold:** RGB/alpha similarity for bilateral weights. Start at 0.12; lower values protect boundaries.
- **antialias:** short luminance-edge directional filter after resize. Start at 0.3; it can soften fine texture. FXAA-style, not full NVIDIA FXAA.
- **sharpen:** local-envelope-clamped sharpening. Start at 0.1; zero skips it.

All stages interpolate premultiplied alpha and clamp source boundaries. Thin
lines already missing from the input cannot be recovered. No model downloads.
FSR1/SMAA are not included. Try **ꘇ-Realtime-Cleanup** to compare equal-sized
bilinear and processed outputs. Performance details distinguish delivered
cadence, CPU submission and shared GPU queue-completion wall time.
