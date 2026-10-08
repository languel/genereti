# Lightweight framework checkpoint

Public Genereti now focuses on realtime creative coding and performance. The private development checkout remains unchanged.

- Supported packs are listed in distribution/manifest.json.
- 26 bundled classroom workflows require no inference models, extra node packs or external generator server. WebGPU is required for GPU textures; audio/capture start explicitly. Optional MIDI/OSC and assistant connections are not prerequisites.
- Inference packs, old standalone web applications, conversion/download scripts and their tests are archived in integrations/legacy-generator, excluded from Registry/student packages. GeneretiCore is the destination for migration and is not yet a working replacement.
- External-generator Send/Receive/Live Preview/Live Generator nodes are no longer registered. Image preview and native output views remain supported.
- Existing user-saved obsolete AI demos are deliberately preserved. They can be removed from Workflows manually; future installs receive only the curated set.
- The canonical workflow path is still integrations/comfyui_genereti/workflows. Sync root example_workflows using scripts/sync_comfy_templates.py.

No model weights or private data were transferred. No Registry version was bumped or published by this cleanup.
