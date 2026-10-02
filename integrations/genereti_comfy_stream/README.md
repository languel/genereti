# Genereti send / receive

V3 nodes: **GeneretiSendFrame** generates from IMAGE + controls and returns an acknowledgement. **GeneretiReceiveFrame** reads shared output into IMAGE independently. Connect sender `frame_id` to receiver `after_frame` for ordered execution. Defaults: sketch SDXS 512, prompt `ink wash 水墨画`.

Install using `scripts/install_comfy.sh /path/to/ComfyUI` and restart Comfy. No extra Python packages beyond ComfyUI's torch, numpy and Pillow are needed. See [external interface guide](../../docs/external-interfaces.md) for setup, stream semantics, advanced options, p5 and MCP. `workflow-api.json` is an API-format example; the graphical p5 workflow is in the shared workflows folder.


### Browser realtime clock

Open **Genereti-p5-Realtime.json** for p5 → Live Image Preview. Stop Run (instant), run the p5 sketch, then click **Start realtime** on the preview. Drawing and preview now run independently of Comfy Queue. **Open projector** mirrors the same frames; its link can be opened in another window using the same Comfy server address. No Genereti inference server is needed for this raw image preview.

The browser runtime transfers ImageBitmaps directly, with one outstanding source frame and bounded projector delivery. It avoids per-frame PNG uploads, tensor conversion, JPEG encoding and saved preview files. The preview reports delivered FPS and frame delivery time. A local 512px p5 + preview + projector test delivered about 41 fps over five seconds without queuing; this is a measured example, not a guaranteed rate.

Browser p5, started webcam/screen capture and the Genereti Live Preview output can feed this path. Input Source selection and known preview/projector passthrough links are followed, but arbitrary Python processing nodes are never bypassed: their IMAGE outputs still update when Comfy executes them. Queue can sample a p5 snapshot while its browser clock remains live. Pause realtime or remove the viewer to release its source subscription; changing sketch code restarts the sketch and resumes active subscriptions. Refresh the Comfy page to load the frontend update.

Projector windows in separate browsers/profiles fall back to a local in-memory JPEG relay (up to 30 sends/sec, one in flight, latest frame only). Encoding activates only when a relay viewer requests frames; same-profile windows continue using direct ImageBitmaps. Restart Comfy once after installing the relay backend, refresh the Comfy page, and reopen the current node’s projector link. Old links belong to old node instances. No preview files are saved.

### Direct output windows

Use the monitor glyph to open a local output canvas, or the floating-window glyph for an always-on-top display (supported Chromium hosts). Live frames draw directly, without JPEG encoding, network transport, or an extra bitmap clone. The window title reports output FPS and source resolution. Ordinary browser windows support F/double-click fullscreen; floating windows may need OS maximize. Desktop hosts that redirect popups externally need Document Picture-in-Picture support or Comfy opened in Chrome. The existing projector link remains a separate cross-browser relay option. This display does not accelerate queued Python nodes or the DOM snapshot clock; keep the source/editor active to avoid background throttling.
