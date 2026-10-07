# Distribute ꘇ Genereti for ComfyUI

The **Genereti Comfy package** installs as one `custom_nodes/genereti` folder.
It includes Livecode, p5/GLSL, drawing/capture, TOP/CHOP/DAT operators, modular
Web Audio, lessons, timeline automation and `dat.monitor`. Browser bundles,
their notices and examples ship with it. Students do not need npm, model
downloads or the separate Genereti server for the realtime performance demos.

The Core ML generator is **not loaded by this package**. It remains a separate
macOS 14+ / Apple Silicon experiment, installed from a full source checkout
through `scripts/setup_macos.sh` and `scripts/download_models.sh`. Its dependencies
are in `requirements-macos.txt`; do not install that file into ComfyUI's Python.

## Student install

Use an existing ComfyUI installation. The reference build is ComfyUI **0.38.2**,
frontend **1.53.6**, Python **3.11+**, tested on macOS/Apple Silicon. Browser tools
have no Core ML dependency; Windows/Linux installs still need classroom testing.
Live TOP rendering requires a browser with WebGPU enabled. Audio, camera and
screen sharing start only through the user's explicit controls.

### ZIP install

When a preview release is available, download `genereti-X.Y.Z.zip` from
[GitHub Releases](https://github.com/languel/genereti/releases). Stop ComfyUI,
unzip it, and put its **inner `genereti` folder** directly in ComfyUI's
`custom_nodes` directory. Confirm `custom_nodes/genereti/__init__.py` exists;
avoid an extra nesting level. Install that folder's `requirements.txt` using
**the Python belonging to ComfyUI**, then restart and refresh the browser page.
The ZIP contains no model files or private captures.

The release workflow is prepared; this setup commit does not itself create a
public release. GitHub Actions preview artifacts are available to the maintainer
after package checks pass. A release asset is the simpler download for students.

### Git install now

From your actual ComfyUI directory:

```sh
git clone https://github.com/languel/genereti.git custom_nodes/genereti
```

For a Comfy checkout with a `.venv`, install the small Comfy requirements:

```sh
# macOS / Linux
./.venv/bin/python -m pip install -r custom_nodes/genereti/requirements.txt

# Windows, from PowerShell
.\.venv\Scripts\python.exe -m pip install -r custom_nodes\genereti\requirements.txt
```

Windows Portable uses its bundled `python_embeded/python.exe`; Comfy Desktop has
its own Python environment and custom-node directory. Locate those paths in your
installation instead of using global `pip` or assuming the terminal is in ComfyUI.
The package requires a recent frontend but does not install Core ML, a separate
torch build or inference models.

**Earlier split-pack installs:** stop Comfy and move the old
`genereti_comfy_inputs`, `p5`, `drawing`, `stream`, `texture`, `chop`, `dat`,
`projector`, `performance` and `agent` folders/symlinks outside `custom_nodes`
(each has the full `genereti_comfy_` prefix). Keep them for rollback. The package
detects duplicates before registering routes; use only one layout at once.
Keep saved workflows: internal node IDs and `/extensions/genereti_comfy_…`
browser paths are preserved.

### Open the realtime class demo

Drag `custom_nodes/genereti/integrations/comfyui_genereti/workflows/ꘇ-Performance-Timeline.json`
onto Comfy's canvas, or import it through **Open workflow**.

1. Open **ꘇ Timeline** with **Alt+Shift+T**. Play advances continuous project time.
2. Watch `top.noise` and `top.expression`. Automation changes noise scale;
   beat/bar quantization applies to musical events, not image refresh.
3. Read `dat.monitor`: browser FPS, p95/worst frame time, delivery rates and
   transport/UI costs. These are local browser measurements, not GPU timing.
4. Run the `dat.lesson` guide for the walkthrough.
5. Enable sound explicitly on `mod.output`. Stop/Panic ends sound. Queue captures
   frozen values and does not start sound or capture devices.

Other model-free starters include `ꘇ-Modular-Audio`, `ꘇ-Sound-Analysis`,
`ꘇ-Painterly-Noise-Feedback`, `ꘇ-Tutorial-Authoring` and
`ꘇ-Interactive-Output-Views`. See the [workflow list](workflows.md) and
[node catalog](opentouch-catalog.md). Some other supplied examples need diffusion
models, optional Core ML nodes or third-party packs; those are separate installs.
The three [guided Livecode pipelines](livecode-tutorials.md)—shader buffers,
connected p5 sketches and audio-reactive analysis—also ship with the package.
Bundled lessons also open through **Settings → Genereti → Learning**.

To put all examples in **Workflows → Genereti**, run the preserving installer
with Comfy's Python, from the `custom_nodes/genereti` folder:

```sh
python scripts/install_comfy_workflows.py integrations/comfyui_genereti/workflows /path/to/ComfyUI/user/default/workflows
```

Replace `python` with Comfy's Python path and the destination with its actual user
workflow folder. The installer keeps customized examples and backs up managed
copies it replaces. Installation never silently edits students' workflows.

## Updates and removal

For a Git install, stop Comfy, run `git -C custom_nodes/genereti pull --ff-only`,
install requirements again if changed, restart and refresh. For a ZIP install,
move the old folder outside `custom_nodes` and extract the new one; keep the old
copy for rollback. Re-run the example installer to update unmodified examples.
Never replace the Comfy `user` directory.

To disable the package, stop Comfy and move `custom_nodes/genereti` outside
`custom_nodes`. Your workflows remain. The existing development symlink installer
is still an alternative for work on the full source checkout.

## Maintainer distribution workflow

`pyproject.toml` holds the metadata: initial version **0.1.0**, registry ID candidate
**genereti**, display name **ꘇ Genereti · OpenTouch**. Registry name availability
has not been claimed or verified. The registered publisher ID is **liuboto**.

`distribution/manifest.json` is the student archive allowlist. `.comfyignore`
selects the same files for registry archives; a test compares both selections.
Only Git-tracked files are packaged. Models, captures, environments and private
experiments are excluded. Checked-in browser bundles are used as-is; editable
source, the npm lockfile and build scripts are included. `DISTRIBUTION.json`
contains per-file hashes and a source commit URL. Credentials never enter ZIPs.

```sh
python -m pip install pathspec                # packaging tests only
python -m unittest discover -s tests -p test_comfy_package.py
python scripts/build_comfy_package.py        # local preview; no upload
```

This writes a ZIP, SHA256 checksum and manifest under ignored
`artifacts/comfy-package/`. Preview builds record uncommitted changes with
`sourceDirty`. Release builds require a chosen license and committed sources.
Genereti-authored code is MIT; bundled libraries retain their licenses. See
[licensing](../licensing/README.md) for p5 source delivery, dependency notices and
external Strudel use.

| GitHub Actions workflow | Result |
| --- | --- |
| **Comfy package checks** | On main/PRs, run browser and packaging tests; upload a preview ZIP as a 14-day Actions artifact. |
| **Release Comfy student package** | Manual. Enter the committed X.Y.Z version; verify license, build/checksum, create `genereti-vX.Y.Z` and a GitHub prerelease with ZIP assets. |
| **Publish to Comfy Registry** | Manual. Verify license, publisher and token; publish the committed version. Ordinary pushes do not publish. |

Before a classroom release, test the ZIP in a fresh Comfy installation: no missing
nodes/imports; play/pause, automation and explicit sound work. Collect monitor
results on students' actual browsers/GPUs. Bump `project.version`, update
`distribution/release-notes.md`, commit/push, then run the manual release action.
Re-publishing requires a new version. Source packages and ZIPs do not update the
Comfy backend.

## Registry preparation

Follow the [official publishing guide](https://docs.comfy.org/registry/publishing)
and [metadata specification](https://docs.comfy.org/registry/specifications):

1. The MIT license and publisher `liuboto` are configured. Confirm package name
   availability before first publication; registry identities are permanent.
2. Publisher **liuboto** is configured in `[tool.comfy].PublisherId`. Keep that
   immutable ID when updating the package.
3. Add its API key as repository secret **REGISTRY_ACCESS_TOKEN**. Never commit it
   or put it in an example. Icon/banner metadata can be added later.
4. Run `python scripts/build_comfy_package.py --check-registry`. This validates
   metadata without upload. Inspect the CLI archive before publishing; it
   respects `.comfyignore`. For current comfy-cli, use the command below so Git
   emits literal UTF-8 paths and the `ꘇ` examples are not omitted. The registry
   workflow already applies this process-scoped override.
5. Run the manual **Publish to Comfy Registry** action. After acceptance, students
   can install the published ID through Comfy's registry/Manager.

The publisher account and GitHub secret have been configured by the maintainer.
No Registry publication has been performed. The initial classroom install remains Git/ZIP. [Challenge preparation](comfy-challenge.md)
records the separate submission requirements.

```sh
GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.quotepath GIT_CONFIG_VALUE_0=false comfy node pack
```
