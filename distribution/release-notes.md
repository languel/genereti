# ꘇ Genereti 0.1.6 — recording, modular instruments and Neuron Dance

- Adds a live audiovisual recorder for images and sound, with source, 720p, 1080p and 1440p sizes, 6–50 Mbps video bitrate and up to 60 fps.
- Adds Neuron Dance, a generative music-video workflow and guided lesson.
- Expands modular audio: instrument panels, polyphonic and multitrack sequencers, synth presets, note visualizers, named routing, mixer layout and audio cable waveforms.
- Sequencers get a step-count knob (1–128, editable up to 1024 steps), a step-duration menu that also accepts typed values such as 1/16, 125ms or 8 Hz, compact action pads and drum row glyphs.
- Updates themes, number-input drafts, node collapse gestures, control styles, graph backdrop and preview shortcuts.
- Refreshes the README with a feature overview and quick start, and adds a documentation index.
- Continues the early alpha classroom preview. Camera and screen capture remain user-started; optional perception models are not bundled.

# ꘇ Genereti 0.1.5 — drawing, audio and performance

- Adds the Poliplan drawing node, with live image output, an optional image underlay, interactive output views and score sequencing.
- Expands modular audio with sequencers, instrument and mixer panels, key and MIDI bindings, recording, and ambient and braindance teaching workflows.
- Adds MediaMime body regions and perception measures, with movement-painting and body-drum teaching examples.
- Expands timeline transport, time-value controls and embedded performance views; improves live output views and shortcuts.
- Extends procedural noise with additional algorithms, shaping, domain warp and seamless looping.
- Continues the early alpha classroom preview. Camera and screen capture remain user-started; optional perception models are not bundled.

# ꘇ Genereti 0.1.4 — Holistic streams and feature selection

- Holistic is the default coordinated pose/hand/face provider. Start loads installed models; observations hold when the source is deliberately paused.
- Providers publish all observations. Selection belongs in Features; old provider selections are ignored. Clean image and diagnostic overlay outputs are separate, with diagnostic preview off by default. Existing image and observations socket indices are preserved.
- Anatomical selectors include stylized body/face/hand maps, a static frontal 478-point face map, named selection sets, compact outline labels, optional point IDs, zoom/pan, box and paint selection. Ctrl-drag selects a box, Option/Alt-drag paints, Shift adds, and Escape cancels.
- Features supports source underlays with opacity and independent small preview-point sizing. Segmentation has independent mask/cutout outputs and category selections.
- Media sources have playback-speed and sampling controls. Five portable Holistic teaching examples cover stream visualization, drawings, event brushes, nose contact and region studies. Local film assets remain outside Git and packages.
- One Genereti catalog root replaces the split Genereti/glyph categories; capture inputs no longer appear under Local Core ML. All examples install in Workflows → Genereti, including migrated local Holistic examples. Separate GeneretiCore nodes remain owned by that companion installation.
- MediaPipe assets remain explicit optional local downloads. Camera and screen capture are user-started. No inference weights, captured media or private experiments ship in this release.

# Included UI and stream improvements

- New performance probe accepts any output: live image FPS/dimensions, CHOP update rate/channel metadata, interval jitter and bounded queued metadata. Detailed measurements use a chevron; routine image-preview timings move to the probe.
- Preview minimize is first on the shared toolbar and correctly hides explicitly displayed canvases; freeze, fit, dimensions and window controls retain compact glyphs.
- Queued image-preview resolution is a global Genereti setting with an explanatory hover tip; full-resolution IMAGE input/output and live delivery remain unchanged.
- D backdrop shortcut follows the node under the pointer, then selection.
- Preview and webcam surfaces support independent width/height, source/output matching and shared fit controls. Webcam framing applies before live and queued delivery.
- New 2D stream source and live image compare, with authored Help and a self-contained paper-stage comparison demo.
- New webview node: Raw/Rendered HTML, Markdown with bundled KaTeX/Mermaid, text and URL; unchanged STRING ports, persisted drafts/fonts, interactive window/overlay/visual/backdrop controls and a model-free Paper Stage demo.
- Transparent, frameless CHOP/LFO/gesture/analysis previews, with optional CHOP background color in Genereti settings.
- Compact overlay controls: 20px buttons, 14px glyphs, and a 51px opacity slider.
- Explicit Alt-O control beside overlay and before backdrop, including Livecode; the matching glyph before the minimal-view label restores node controls.
- Dynamic parameter edits remove binary numeric noise and follow declared step precision.
- Documents shared visual/help conventions and a portable GeneretiCore UI handoff.

These improvements are included in 0.1.4.

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
