# Genereti send / receive

V3 nodes: **GeneretiSendFrame** generates from IMAGE + controls and returns an acknowledgement. **GeneretiReceiveFrame** reads shared output into IMAGE independently. Connect sender `frame_id` to receiver `after_frame` for ordered execution. Defaults: sketch SDXS 512, prompt `ink wash 水墨画`.

Install using `scripts/install_comfy.sh /path/to/ComfyUI` and restart Comfy. No extra Python packages beyond ComfyUI's torch, numpy and Pillow are needed. See [external interface guide](../../docs/external-interfaces.md) for setup, stream semantics, advanced options, p5 and MCP. `workflow-api.json` is an API-format example; the graphical p5 workflow is in the shared workflows folder.


### Browser realtime clock

Open **Genereti-p5-Realtime.json** for p5 → ꘇ image preview. Stop Run (instant), run the p5 sketch, then choose **Live** on the preview. Drawing and preview now run independently of Comfy Queue. Connect a separate **projector** node for projector links and cross-browser displays. No Genereti inference server is needed for this raw image preview.

The browser runtime transfers ImageBitmaps directly, with one outstanding source frame and bounded projector delivery. It avoids per-frame PNG uploads, tensor conversion, JPEG encoding and saved preview files. The preview reports delivered FPS and frame delivery time. A local 512px p5 + preview + projector test delivered about 41 fps over five seconds without queuing; this is a measured example, not a guaranteed rate.

Browser p5, started webcam/screen capture and the Genereti Live Preview output can feed this path. Input Source selection and known preview/projector passthrough links are followed, but arbitrary Python processing nodes are never bypassed: their IMAGE outputs still update when Comfy executes them. Queue can sample a p5 snapshot while its browser clock remains live. Choose Comfy Queue or remove the viewer to release its source subscription; changing sketch code restarts the sketch and resumes active subscriptions. Refresh the Comfy page to load the frontend update.

Projector windows in separate browsers/profiles fall back to a local in-memory JPEG relay (up to 30 sends/sec, one in flight, latest frame only). Encoding activates only when a relay viewer requests frames; same-profile windows continue using direct ImageBitmaps. Restart Comfy once after installing the relay backend, refresh the Comfy page, and reopen the current node’s projector link. Old links belong to old node instances. No preview files are saved.

### Direct output windows

The monitor glyph opens a separate output window; the inset-window glyph opens a
resizable, draggable overlay inside Comfy. Both can coexist. Browser windows and
overlays use direct bitmaps. On macOS Comfy Desktop, the monitor launches the native
companion described below. Projector links remain in the separate projector node.
These displays do not accelerate inference or queued nodes; keep the source active
to avoid browser background throttling.

### Generator and viewer

Use **drawing → ꘇ generator → ꘇ image preview** to keep inference separate
from display. The generator has prompt/model controls, a glyph to start/pause
live generation, and a Live / Comfy Queue dropdown. It has no image canvas or
projector controls. The viewer and projector consume its IMAGE stream through
the same browser runtime used by drawing and livecode.

In Live, a connected Live viewer starts generation automatically. ■ pauses;
▶ resumes. Removing the last live viewer stops inference. Switching to Comfy Queue
stops browser inference. Run then generates once from the queued IMAGE (or no
image in text mode) and returns that request's result directly. It does not sample
another producer's shared latest frame. Local inference requires the Genereti
macOS 14+ Apple silicon model server at `127.0.0.1:8765`.

The older **Genereti Live Preview** combined generator/viewer keeps its node ID
and behavior for saved workflows. New graphs should use **ꘇ generator** and the
separate viewer. `Genereti-Drawing-Generator-Preview.json` demonstrates the split.
Restart ComfyUI to register the new node, then refresh its browser page. Restart
`./run.sh` after server Python changes; a browser refresh alone cannot reload them.

The separate generator exposes **resolution** (Auto, 256, 384, 512). This is native
model resolution, separate from source/output dimensions. The server checks
installed mode/style capabilities before switching models.

### Image preview controls

**ꘇ image preview** keeps Live / Comfy Queue and transport at the top. The independent
window and overlay glyphs follow play/pause. Image fit sits alone below preview
size and above the canvas. A triangle below the
image expands performance details. Fit is saved in the workflow and applies to
the preview and local windows. There is no projector URL, copy-link action or
JPEG quality control here. Live frames retain transparency and use direct browser
bitmaps; queued previews retain alpha as PNG and use JPEG quality 85 for opaque
images. `preview_size` limits queued preview encoding; IMAGE passthrough remains
unchanged. Restart Comfy for the schema/label update, then refresh its frontend.

### macOS Desktop companion

The monitor glyph in Comfy Desktop launches **Genereti Output**, a separate AppKit
OS window. The overlay glyph stays inside Comfy. No patch to the installed Desktop
app is needed, and neither action falls back silently to the other.

Restart the Comfy backend and refresh Desktop after updating the node pack. The
first native launch compiles `native/Output.swift` using Xcode Command Line Tools
(`xcode-select --install` if missing). The application bundle is cached under
`~/Library/Caches/Genereti/desktop-output/`; no binary or frame is committed to Git.
Manual build: `python native/build.py` from this pack directory. Manual launch:
`python native/build.py http://127.0.0.1:PORT/genereti/native-output/TOKEN/view`
with an active session created by the node.

The helper requires macOS 14+. Browser preview and overlays remain independent
of this optional helper. The helper uses PNG over a same-origin, loopback-only
Comfy route, preserving alpha, capped at 30 uploads/sec with one upload in flight.
It keeps only the latest frame in memory. Uploads stop when the window closes;
removing the node closes its companion, and closing the helper releases its session.
There is no inference server, capture permission or remote connection involved.
F toggles native fullscreen; Escape leaves it. Normal macOS close/minimize/resize
controls remain available. The initial companion provides a window and frame
transport; Syphon, MIDI and OSC are future additions.
