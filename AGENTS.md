# Agent instructions for Genereti

- The supported project is the lightweight Comfy realtime framework. Historical Core ML generation is archived for GeneretiCore and required macOS 14+ Apple silicon; do not describe it as Windows/Linux compatible. See `docs/platform-support.md`.
- Do not add model weights, Core ML packages, compiled models, generated captures, or private training data to Git. Keep `models/`, `artifacts/`, and local experiments ignored.
- Inference and standalone experiments are archived in `integrations/legacy-generator/` for migration to GeneretiCore. They are unsupported here and excluded from distribution. Do not restore them to the main installation path.
- The app binds to loopback by default. Camera and screen capture are user-started browser actions. Preserve those boundaries.
- Current ComfyUI integration packs: `integrations/comfyui_genereti`, `integrations/genereti_comfy_inputs`, `integrations/genereti_comfy_p5`, `integrations/genereti_comfy_projector`, and `integrations/genereti_comfy_agent`. The p5 source and projector nodes are independent of the Core ML generator node.
- Keep Comfy workflows in `integrations/comfyui_genereti/workflows/` and validate that each is valid JSON after edits.
- Before renaming APIs, check the browser modules, workflow node IDs, `scripts/install_comfy.sh`, TouchDesigner builder, and documentation together.
- Use the sample stage prompt from `docs/prompts.md` when creating teaching examples.
- Follow `docs/node-ui-design.md` for custom ComfyUI controls: livecode is the template, buttons/dropdowns are borderless, and toggles use glyphs with hover tips and accessible state.
