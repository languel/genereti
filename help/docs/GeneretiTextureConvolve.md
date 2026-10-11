# ꘇ top.convolve

Configurable row-major 3×3 RGB kernel: k0/k1/k2 top row, k3/k4/k5 center, k6/k7/k8 bottom. Default center=1 is identity. Normalize divides by kernel sum when nonzero; zero-sum edge kernels remain unnormalized. Bias shifts the filtered color; mix blends with source. Clamped boundaries and center-color substitution for transparent neighbors reduce dark fringes. Alpha preserved. Useful kernels: box blur all ones + normalize; sharpen center 5 with cardinal neighbors −1; Laplacian center 8 with all neighbors −1.

Model-free WebGPU in Live mode; queued PyTorch implementation. Uses shared preview, output window, overlay and backdrop controls. No model downloads.
