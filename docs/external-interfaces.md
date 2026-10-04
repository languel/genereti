# Genereti in other apps

The Core ML server runs independently of Excalidraw on macOS 14+ / Apple silicon. Start it with `./run.sh`; clients below send the same generation options. Model size and latest output are shared across clients, so run one producer at a time. Receivers/viewers can run together.

## Standalone p5 canvas lab

Open **http://localhost:8765/p5-lab.html**. This page uses bundled p5.js and no Excalidraw code. Click **Connect · 512** to load SDXS at 512 × 512. Click **Example** or draw in the left canvas, then **Send frame** or **Start live**. The initial prompt is `ink wash 水墨画`; default pipeline is SDXS sketch, base style, fixed seed, control strength 1, no AI upscaler. Connect changes the shared server resolution.

- Left: persistent drawing pixels sent as PNG, encoded only when drawing changes. One request at a time, no accumulating input queue.
- Right: received AI frame, local grayscale/threshold/posterize processing, and a separate editable mark layer. Drawing here does not affect model input. **Output → input** copies the composite back to the source once. Enable **Continuous output → input** and **Start live** for feedback animation: each successful generated frame is processed with the selected effect and output marks, then replaces the input before the next request. Pause stops the loop; uncheck the toggle to keep drawing without feedback. Receive latest does not feed back. This toggle defaults off and is included in saved canvas states.
- **Receive latest** reads output created by any client without generating. **Start live** receives each response from its own producer; it does not subscribe to another producer while paused. The existing `/p5` stage and `/stream.mjpg` remain independent live viewers.
- Cmd/Ctrl+Enter applies the prompt; **Live prompt** enables typing updates. Save/Open canvas state retains prompt/settings, input pixels, raw output, processed output, output marks and stroke data. The server receives pixels and generation settings, not the p5 drawing document.

The page exports `window.generetiP5`: `connect()`, `sendFrame()`, `receive()`, `snapshot()`, `load(scene)`, `clearInput()`, `clearOutput()`, `outputToInput()`, `setFeedback(boolean)`, `setPrompt(text)`, `setRunning(boolean)`, `setEffect(name)`, and `state`. This is the initial command seam for other frontends. Browser commands/canvas documents are local to that page; they are not yet a server-side document registry or an MCP remote-editor channel.

Files: `web/p5-lab.html`, `web/p5-lab.js`. Serve the repository's `web/` folder on any localhost port and set the server URL to use the lab independently. Use HTTP, not `file://` or a public hosted editor: server origins are restricted to localhost. Bundled dependencies must remain next to the page.

## HTTP and WebSocket contracts

| Operation | Endpoint | Result |
|---|---|---|
| Inspect readiness/models/timings | `GET /api/status` | JSON |
| Load model size | `POST /api/config/size` with `{ "size": 512 }` | JSON; shared configuration |
| Send input + controls | `POST /api/generate` | JPEG; X-Frame, X-Inference-Ms, X-Server-Ms headers |
| Bidirectional generation | `WS /ws` | Same options; JSON frame with image data URL + timing metadata |
| Receive latest | `GET /api/frame.jpg` | JPEG + X-Frame |
| Subscribe to shared output | `GET /stream.mjpg` | MJPEG stream |
| Publish externally processed pixels | `POST /api/output-frame` with raw image bytes | 204; becomes shared output |

`docs/generate-schema.json` catalogs **all** generation options from the backend's GenerateRequest schema: prompts/blend, pipeline/style, seeds/noise, images/independent guides, SDXS mixer, input color/value, levels/BCS, compositing and recursive upscaling. Image values are base64 or image data URLs. `resolution` accepts `"auto"` (default) or numeric 256, 384, 512. Auto retains the current size when installed for the requested mode/style; otherwise it selects the smallest compatible installed size. Explicit unsupported sizes return HTTP 400 with available sizes before preprocessing/model loading. The server selects size and renders under one lock. Status includes `models_by_size` and `resolution_handler`; generation returns `X-Model-Size` and metrics with requested/resolved resolution. Inputs are fitted to the selected model size: no separate resize node is needed. Model loading can make the first frame slower; the last good engine/output survives a failed size load. A 429 means another client is generating. The Comfy Generate and Send nodes retry three times over approximately one second; if still busy, pause Start live in the p5 lab/Excalidraw app and requeue. Use Output Monitor/Live Frame or Receive Frame to view another producer without generating. Errors must not discard the last good output.

Import `GeneretiClient` from `/genereti-client.js` for `status()`, `configureSize(size)`, `generate({canvas,image,...options})` and `receive()`. Close superseded returned ImageBitmaps to release memory. p5's canvas size and server model resolution are separate. Pass `resolution: 'auto'` or a numeric model size to generate; configureSize remains available for manually selecting the shared size.

## MCP (headless)

Run `./scripts/run_mcp.sh` (requires `uv`). It uses an isolated, pinned MCP SDK 1.x environment and connects to the running HTTP server; it does not load another model. Add this stdio server to your MCP client:

```json
{
  "mcpServers": {
    "genereti": {
      "command": "/absolute/path/to/genereti/scripts/run_mcp.sh"
    }
  }
}
```

Tools: `genereti_status`, `genereti_set_resolution`, `genereti_generate`, `genereti_receive_frame`, `genereti_publish_frame`. `genereti_generate` accepts a prompt, optional local image path and an `options` JSON object containing any backend generation option. Receive returns an MCP image without generating. Publish sends a locally processed image to all shared-output consumers. The `genereti://generation-schema` resource documents every option. Set `GENERETI_URL` for a different localhost port.

This covers generator controls and shared output, not browser-only camera permissions, Excalidraw commands, or editing a remote p5 scene. Those need an explicit app-command/document channel in a subsequent increment. Do not use the stdio server without the local HTTP generator running.

## Separate ComfyUI send/receive nodes

Install with `scripts/install_comfy.sh /path/to/ComfyUI`, then restart ComfyUI. The new `genereti_comfy_stream` pack uses the V3 API. Existing Generate/Live Frame nodes keep their IDs and behavior.

- **Genereti Send Frame** (`GeneretiSendFrame`): sends the first IMAGE in a batch plus prompt/mode/size/seed/guide strength. Defaults to SDXS sketch at 512, `ink wash 水墨画`. Advanced `options_json` exposes the remaining server options. Returns a frame ID and acknowledgement metadata, not an image.
- **Genereti Receive Frame** (`GeneretiReceiveFrame`): reads the latest output into IMAGE + frame ID without generation. Leave `after_frame` at zero for an independent receiver. Connect the sender's frame ID to `after_frame` to order both operations in one graph.

Open **ꘇ p5 Send Receive.json** from your workflow folder: p5 input → Send Frame → Receive Frame → Preview. `integrations/genereti_comfy_stream/workflow-api.json` provides an API-format LoadImage variant. Both nodes bypass cache on repeated execution. Use Comfy's repeated/instant queue for continuous updates; they execute one frame per queue run rather than maintaining a background stream.

Output is the server's **latest shared** frame. `after_frame` ensures it is not older than the acknowledgement, but another producer can replace it; this is not a per-client channel or guaranteed exact-frame history. Stop other producers when you need deterministic pairing. This workflow was tested on Apple silicon. The Core ML generator remains Mac-only; this demo does not add a network or PC GPU backend. See the platform guide for existing PC-compatible source nodes.

## Verification

Real browser generation succeeded at 512px with the initial prompt, using the standalone page. Drawing over output preserved input pixels; canvas-state save/load preserved the input raster. Real Comfy V3 classes were imported against the installed Comfy core, then Send/Receive executed against Genereti and returned a matching frame ID with a `[1,512,512,3]` tensor. The installed pack/workflow needs a Comfy restart for its GUI catalog; a full queued GUI workflow was not exercised. MCP stdio initialize/list-tools/status/receive returned a real image through ClientSession.


### Browser realtime clock

Open **ꘇ p5 Realtime.json** for p5 Livecode → Live Image Preview. Evaluate the p5 sketch and click **Start realtime** on the preview. Drawing and preview run independently of Comfy Queue. The Livecode node can also open an output window, an in-Comfy overlay, or a graph backdrop. No Genereti inference server is needed for this raw image preview.

The browser runtime transfers ImageBitmaps directly, with one outstanding source frame and bounded projector delivery. It avoids per-frame PNG uploads, tensor conversion, JPEG encoding and saved preview files. The preview reports delivered FPS and frame delivery time. A local 512px p5 + preview + projector test delivered about 41 fps over five seconds without queuing; this is a measured example, not a guaranteed rate.

Browser p5, started webcam/screen capture and the Genereti Live Preview output can feed this path. Input Source selection and known preview/projector passthrough links are followed, but arbitrary Python processing nodes are never bypassed: their IMAGE outputs still update when Comfy executes them. Queue can sample a p5 snapshot while its browser clock remains live. Pause realtime or remove the viewer to release its source subscription; changing sketch code restarts the sketch and resumes active subscriptions. Refresh the Comfy page to load the frontend update.

Projector windows in separate browsers/profiles fall back to a local in-memory JPEG relay (up to 30 sends/sec, one in flight, latest frame only). Encoding activates only when a relay viewer requests frames; same-profile windows continue using direct ImageBitmaps. Restart Comfy once after installing the relay backend, refresh the Comfy page, and reopen the current node’s projector link. Old links belong to old node instances. No preview files are saved.


Livecode’s V3 schema includes optional IMAGE, native width/height, source code,
parameter defaults and typed dynamic control sockets. Named source parameters
map to stable `controls.value0` … `controls.value63` ids; their visible socket
labels retain the authored names. Queue requests use the executing client’s
`genereti-livecode-render` WebSocket event; the isolated browser renderer replies
with PNG through `/genereti/livecode/result`. The response is matched to its
request and client, expires after 30 seconds and becomes a Comfy IMAGE tensor.
No external generator is involved. Keep the corresponding workflow open.
Browser live input uses the existing borrowed-frame bus, a persistent local
canvas/texture and transferable ImageBitmaps with backpressure. It avoids PNG
serialization in the live path; this is not a claim of shared-memory or zero-copy
transport. Camera/screen sources remain explicitly user-started.

Livecode supports the [language contracts](livecode-languages.md) for thirteen browser modes, including KaTeX math and JavaScript Manim. All share the same IMAGE/parameter/Queue handshake and output surfaces. KaTeX/fonts are local; the Manim library loads on demand.
