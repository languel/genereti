# Super alpha classroom release

Version 0.1.1 is an early test release for classroom experimentation and feedback.
Expect bugs, incomplete features and changing interfaces. Back up workflows and
test in a separate ComfyUI installation before using an existing teaching setup.
Please report your OS, browser and ComfyUI version with a small reproducing workflow.

Student preview of ꘇ Genereti / OpenTouch for ComfyUI.

Includes Livecode, drawing/capture, GPU texture operators, CHOP/DAT tools,
modular Web Audio, interactive lessons, timeline automation and dat.monitor.
Browser bundles and example workflows are included. No model weights or Core ML
generator dependencies are included.

Install: unzip the `genereti` folder into ComfyUI's `custom_nodes`, install its
`requirements.txt` with ComfyUI's Python, restart ComfyUI, then refresh the page.
Import an example from `integrations/comfyui_genereti/workflows`, starting with
`ꘇ-Performance-Timeline.json`. Camera, screen sharing and audio start explicitly.

See [installation and distribution instructions](https://github.com/languel/genereti/blob/main/docs/comfy-distribution.md)
for Desktop/Portable paths, upgrades, example installation and current limitations.

Three guided Livecode examples cover connected shader buffers/history, a two-sketch p5 image pipeline and sound analysis driving an interactive p5 display. Each includes Hint/Do it and exportable lesson source.

- MIT for Genereti-authored code, full browser dependency notices and p5 LGPL source delivery.
- Public build omits embedded Strudel; saved patterns remain editable for external use.
- Publisher `liuboto` configured; Registry publication remains manual.
