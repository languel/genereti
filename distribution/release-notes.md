# ꘇ Genereti 0.1.3 — reference and performance UI

- Visual panels appear below ports and node transport, above parameters. Code and text editors follow their parameters.
- Preview minimize, freeze, image fit, and time source controls share the top preview toolbar.
- Node quick reference sits in the top-right header, inset from the resize handle. Press it again, or Escape inside any Help tab, to close the panel.
- Compact square toolbar buttons use centered glyphs and consistent spacing.
- CHOP curves redraw at signal cadence; offscreen CHOP, LFO, and gesture previews skip drawing while downstream signals continue.
- X/Y gesture recording draws its live trace before release.
- Reference, searchable Contents, and Assistant share one dockable or floating Help panel. Includes Welcome, schema quickrefs, and lesson/tutorial context.
- Auto Reference follows selected nodes. The book/Genereti button appears above Comfy Help Center.
- Assistant settings live under Genereti settings, with a provider model picker and compact composer.
- Retires the redundant queue-based p5 Source demo; current p5 examples use Livecode.

Existing workflow widget values and recordings keep their positional serialization contract. Nodes 2.0 is required for the visual presentation and Alt-O views. No models are bundled.

# ꘇ Genereti 0.1.2 — early alpha classroom release

EARLY ALPHA - experimental classroom release.
Experimental realtime live creative tools for ComfyUI: code (p5js,glsl), drawing,
shaders, 2d operators, web audio, MIDI, lessons and performance timelines.
Expect bugs and changing interfaces; back up workflows.

## Changes in 0.1.2

- Bundled demos appear in Comfy's Templates browser under genereti.
- Startup installs demos into Workflows → Genereti for existing user profiles,
  preserving edited copies and backing up replaced managed examples.
- Uses Comfy's configured paths, including Desktop installations.
- Includes 26 curated classroom demos without inference models or extra node packs.
- Updates the Registry display name to ꘇ Genereti, description and icon.
- Focuses the distribution on the lightweight realtime framework. Historical
  Core ML inference and standalone experiments are archived and excluded.

**Compatibility:** external-generator Send Frame, Receive Frame, Live Preview
and Live Generator nodes are no longer registered. Existing workflows using
those nodes will have missing nodes after upgrading. User-saved workflows are
preserved; image preview and native output views remain supported. GeneretiCore
is the intended migration destination, but is not yet a working replacement.

## Classroom installation

Version 0.1.2 is an early test release for classroom experimentation and feedback.
Expect bugs, incomplete features and changing interfaces. Back up workflows and
test in a separate ComfyUI installation before using an existing teaching setup.
Please report your OS, browser and ComfyUI version with a small reproducing workflow.

Student preview of ꘇ Genereti for ComfyUI.

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
