# Genereti send / receive

V3 nodes: **GeneretiSendFrame** generates from IMAGE + controls and returns an acknowledgement. **GeneretiReceiveFrame** reads shared output into IMAGE independently. Connect sender `frame_id` to receiver `after_frame` for ordered execution. Defaults: sketch SDXS 512, prompt `ink wash 水墨画`.

Install using `scripts/install_comfy.sh /path/to/ComfyUI` and restart Comfy. No extra Python packages beyond ComfyUI's torch, numpy and Pillow are needed. See [external interface guide](../../docs/external-interfaces.md) for setup, stream semantics, advanced options, p5 and MCP. `workflow-api.json` is an API-format example; the graphical p5 workflow is in the shared workflows folder.
