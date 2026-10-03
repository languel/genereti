# Platform support

| Part | Apple silicon Mac | Windows/Linux PC or Intel Mac |
| --- | --- | --- |
| Genereti live generator | Supported: Core ML on M-series, macOS 14+ | Not supported: this generator and its converted models are Core ML-specific |
| Genereti web interface and stream | Supported locally at `127.0.0.1:8765` | The front end is standard web tech, but image generation needs a compatible backend |
| Genereti ComfyUI Generate / Live Frame nodes | Supported when the local Genereti server is running | Not supported by this Core ML backend |
| ComfyUI webcam/window/doodle capture nodes | Supported with the included browser widgets | Can run in ComfyUI where its current custom-node API is available |
| ComfyUI interactive p5.js source node | Supported | Can run on PC independently of Genereti; connect it to any compatible ComfyUI graph |
| TouchDesigner Web Render bridge | Supported as a client of the local stream | Web Render can display a stream served on that PC, but Genereti itself is not the PC server |

The app binds to loopback (`127.0.0.1`) by default, keeping its API and captures on the local machine. The current release does not offer a remote PC-to-Mac generator connection. A PC user who wants to generate on Windows/Linux can use ComfyUI’s own installed models and nodes; the Genereti Core ML generator is not involved.

Apple’s Core ML runtime can use the CPU, GPU, and Neural Engine on Apple devices. The conversion scripts target macOS 14 or later. See [Apple Core ML](https://developer.apple.com/documentation/coreml/) and [coremltools](https://github.com/apple/coremltools).

## Use the source nodes on a PC

To try interactive p5 or camera/window capture in ComfyUI without Genereti’s Mac server, copy the relevant folder from this repository into your ComfyUI `custom_nodes` folder, then restart ComfyUI:

- For the sketch canvas: copy `integrations/genereti_comfy_p5` and open `Genereti-p5-Source.json`.
- For doodle, webcam, and window/screen input: also copy `integrations/genereti_comfy_inputs` and open `Genereti-Input-Sources.json`.

On Windows, first set `$ComfyUI` to the folder that contains `custom_nodes` (often `C:\ComfyUI_windows_portable\ComfyUI`):

```powershell
$ComfyUI = "C:\ComfyUI_windows_portable\ComfyUI"
Copy-Item -Recurse .\integrations\genereti_comfy_p5 "$ComfyUI\custom_nodes\genereti_comfy_p5"
Copy-Item .\integrations\comfyui_genereti\workflows\Genereti-p5-Source.json "$ComfyUI\user\default\workflows\"
```

For camera/window capture, copy that second node folder and workflow too:

```powershell
Copy-Item -Recurse .\integrations\genereti_comfy_inputs "$ComfyUI\custom_nodes\genereti_comfy_inputs"
Copy-Item .\integrations\comfyui_genereti\workflows\Genereti-Input-Sources.json "$ComfyUI\user\default\workflows\"
```

You can also drag a workflow JSON onto the ComfyUI page. The source-only workflows preview and save their current image directly; they do not call the unsupported Core ML generator. Newer ComfyUI versions are required for the included nodes’ current extension API.

## Optional native Comfy Core ML experiment

`integrations/genereti_comfy_coreml` runs the existing Genereti engine directly in
Comfy's Python process on macOS 14+ Apple silicon. It has no HTTP model-server
dependency and does not make the generator Windows/Linux compatible. See the
[native experiment guide](../integrations/genereti_comfy_coreml/README.md) for
SDXS / SD Turbo model paths, live and queued workflows, and feature limits.

### Optional native output companion

`ꘇ image preview` uses a macOS 14+ AppKit companion for separate Comfy Desktop
output windows. Its first build requires Xcode Command Line Tools. This optional
window helper does not change the platform support of browser preview, overlays,
or the Core ML generator. Browser output windows and overlays remain usable
without it. See the stream pack README for setup and local transport details.
