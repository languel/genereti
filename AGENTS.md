# Agent instructions for Genereti

- This project’s complete generator targets macOS 14+ on Apple silicon. Do not describe the Core ML generator as Windows/Linux compatible. See `docs/platform-support.md` for the precise PC-compatible Comfy source nodes.
- Do not add model weights, Core ML packages, compiled models, generated captures, or private training data to Git. Keep `models/`, `artifacts/`, and local experiments ignored.
- The model setup path is `scripts/setup_macos.sh` then `scripts/download_models.sh`; model source and license notes live in `docs/models.md`.
- The app binds to loopback by default. Camera and screen capture are user-started browser actions. Preserve those boundaries.
- Current integration packs: `integrations/comfyui_genereti`, `integrations/genereti_comfy_inputs`, and `integrations/genereti_comfy_p5`. The p5 source node is independent of the Core ML generator node.
- Keep Comfy workflows in `integrations/comfyui_genereti/workflows/` and validate that each is valid JSON after edits.
- Before renaming APIs, check the browser modules, workflow node IDs, `scripts/install_comfy.sh`, TouchDesigner builder, and documentation together.
- Use the sample stage prompt from `docs/prompts.md` when creating teaching examples.
