# ꘇ top.mask

Connect an IMAGE mask in Live or Queue; native Comfy MASK is also accepted in Queue. For IMAGE choose luma, alpha, red, green or blue; luma/RGB includes mask alpha. Native MASK directly supplies opacity regardless of channel selection. Multiply combines with source alpha; replace sets alpha. Invert flips the mask; strength blends with original alpha. RGB unchanged. Mask scales to source dimensions using clamped alpha-aware interpolation. Blob, edge and key matte IMAGEs can feed this node.

Model-free WebGPU in Live mode; queued PyTorch implementation. Uses shared preview, output window, overlay and backdrop controls. No model downloads.
