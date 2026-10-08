# Genereti

**Realtime creative coding and performance tools for ComfyUI.** Build live visuals and sound with code, drawing, shaders, texture operators, signals, interactive lessons and timeline automation.

**Super alpha — early classroom testing.** Back up your workflows before updating. Expect bugs and changing interfaces.

## Student getting started

The bundled demos need **no model downloads, separate model server, or extra node packs**. Use a recent ComfyUI installation and a modern browser; GPU texture demos require WebGPU support.

1. Install **Genereti realtime** through Comfy's Extensions / Manager, then restart and refresh the browser. For a GitHub installation, stop Comfy and run this from your ComfyUI directory:

   ```sh
   git clone https://github.com/languel/genereti.git custom_nodes/genereti
   ```

2. For GitHub installs, install the requirements using **ComfyUI's Python**. On a checkout with a `.venv`:

   ```sh
   ./.venv/bin/python -m pip install -r custom_nodes/genereti/requirements.txt
   ```

   See the [installation guide](docs/comfy-distribution.md) for Windows, Portable, Desktop and existing installations.
3. Restart ComfyUI and refresh its browser page.
4. Open **Workflows → Genereti** or **Templates → genereti**. Start with **ꘇ-Performance-Timeline**; **Alt+Shift+T** opens the timeline. Audio starts explicitly on `mod.output`.

Continue with the [student quickstart](docs/student-quickstart.md), [shader, p5 and audiovisual tutorials](docs/livecode-tutorials.md), or [demo list](docs/workflows.md).

## What is included

- **Livecode:** p5, GLSL/multibuffer shaders, Three.js, HTML and document rendering, with editable parameters.
- **Drawing and capture:** interactive Excalidraw, explicitly started camera/screen sources, and image output views.
- **OpenTouch:** `top.*` textures, `chop.*` signals and `dat.*` data/lessons.
- **Sound:** `mod.*` browser instruments, effects, analysis and visualizers.
- **Performance:** shared time, musical timing, scale, automation and a docked timeline.
- **Assistant:** optional local/hosted provider connections; no assistant service is needed for the bundled demos.

See the [node catalog](docs/opentouch-catalog.md), [audio guide](docs/modular-audio.md), [performance guide](docs/performance-time.md) and [keyboard shortcuts](docs/shortcuts.md).

## AI inference is moving to GeneretiCore

Model generation, conversion and downloads belong in the separate experimental [GeneretiCore repository](https://github.com/languel/genereticore). It is not yet an installable replacement. Genereti's current classroom demos use the lightweight performance framework only.

Old standalone apps, inference packs, conversion scripts and model-dependent demos are preserved in [the migration archive](integrations/legacy-generator/README.md). They are unsupported here and excluded from the distributed package.

## For contributors

- `integrations/`: the supported Comfy node packs; the legacy archive is clearly separated.
- `example_workflows/`: bundled templates shown by Comfy.
- `docs/`: guides and design notes.
- `editor/` and `web/vendor/`: drawing editor source and its shared browser bundle.
- `scripts/`, `tests/` and `distribution/`: developer build, validation and packaging tools.

Canonical workflow sources remain in `integrations/comfyui_genereti/workflows/`; run `python scripts/sync_comfy_templates.py` after editing them. Students do not need npm or these build scripts.

Original Genereti code is MIT licensed. Dependencies retain their own licenses and notices; see [licensing](licensing/README.md). Model weights, secrets and generated captures are not stored in this repository.
