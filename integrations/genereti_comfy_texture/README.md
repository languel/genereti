# Genereti textures

Thirteen V3 IMAGE operators, with a shared WebGPU live renderer and PyTorch queued
implementations. See [the operator guide](../../docs/texture-operators.md) for
installation, controls, performance boundaries and tests.

Install alongside `genereti_comfy_p5` (live bus and controls) and
`genereti_comfy_stream` (output windows/overlays), using
`scripts/install_comfy.sh`. This pack does not depend on the Core ML generator.
Live mode requires a WebGPU browser; Queue uses ComfyUI's torch environment.
