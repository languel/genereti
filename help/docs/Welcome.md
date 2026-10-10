# Welcome to ꘇ Genereti

**Early alpha — experimental classroom release.** Expect bugs and changing interfaces; back up your workflows.

Genereti adds realtime creative tools to ComfyUI: live code, drawing, textures, control signals, sound, MIDI, and performance timelines. Build a small patch, change a control, and watch or hear what happens.

## Find your way

- **Contents** searches node references, lessons, and tutorials. Every installed Genereti node has a quickref; longer guides are added over time.
- **Reference** shows a guide. Turn on **Auto** to follow the selected node, or open a node’s **?** button. Turn Auto off to hold a page while working elsewhere. Press the same **?** again, or **Escape** inside any Help tab, to close the panel.
- **Assistant** can discuss your patch. **Ask about this guide** attaches the reference as context; a node’s guide can also attach that node. You choose when to send.

## The building blocks

| Family | What it carries |
| --- | --- |
| TOP | Images, textures, and image operations |
| CHOP | Numeric channels, modulation, LFOs, and gestures |
| DAT | Text, documents, tables, and lessons |
| Webview | Interactive HTML, Markdown with math/diagrams, literal text and embedded pages |
| Livecode | p5, GLSL, Three.js, HTML, Markdown, and audio sketches |
| Drawing and inputs | Interactive artwork and user-started media sources |
| Performance | Shared time, musical timing, and automation |

Connect outputs to inputs to compose these tools. Numeric controls can become sockets so an LFO, recorded gesture, or other signal can drive them.

## Live and Queue

**Live** runs supported creative tools in the browser without queuing Python work. **Comfy Queue** uses Comfy’s normal execution path. These paths have different clocks and device behavior; read each node’s reference for its contract.

Freeze or minimize a preview to reduce local presentation work. Downstream frames keep flowing. **Option/Alt-O** toggles the hovered node’s minimal visual view; **Option/Alt-Shift-O** toggles all visual nodes. Use **Nodes 2.0** for these views. The outlined-square glyph with a filled center, beside overlay, also toggles the minimal view; the same glyph before its edge-bar label restores controls. Signal previews are transparent by default, with an optional CHOP preview background under Genereti → Previews.

## Learn by doing

In **Contents**, choose **Lessons** for guided steps or **Tutorials** for guides with recorded demonstrations. Read the guide first, then start it in your current patch or open its example workflow in a separate tab. Opening a workflow does not automatically queue it or start devices.

Useful starting points include **Textures, signals and tables**, **Coherent noise: textures and expressions**, **Livecode: two p5 sketches, one image stream**, and **Interactive output views**.

## Settings and project

**Settings → Genereti** contains installation identity, learning preferences, themes, shortcuts, editor options, and assistant configuration. The installation identity helps distinguish browser and Desktop instances.

Genereti is the lightweight creative framework. GeneretiCore is a separate project for local inference work.

[Project and source on GitHub](https://github.com/languel/genereti)
