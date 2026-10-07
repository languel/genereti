# Genereti keyboard shortcuts

Edit viewing shortcuts in **Comfy Settings → Keybinding**: search **Genereti** or **ꘇ**.
**Genereti → Shortcuts → Open keybindings** opens the same native editor.
Hover a command for its scope. Native add/edit/delete/reset, presets and conflict
indicators apply; remapping or removing a binding changes the active shortcut.
Editor-local commands and pointer gestures are listed separately in Genereti settings. On macOS,
**Alt** means **Option**. Viewing shortcuts leave code editors, text fields and
IME composition alone. Select one node when a shortcut needs a graph selection.

| Shortcut | Action | Scope |
| --- | --- | --- |
| Alt+Shift+T | Timeline dock | Show/hide; project time keeps running |
| Alt+Space | Project play / pause | Outside editors; audio still requires explicit Start |
| P | Parameters sidebar | Canvas with no selection; selected items retain Comfy pin/unpin. Follows the native Pin binding if remapped |
| Alt+Shift+R | Parameters sidebar | Independent toggle, including in Satori |
| Alt+O | Output-only node | Selected node or output-only node under pointer |
| Cmd/Ctrl+[ / ] | Stack backward / forward | Hovered or last interacted view; add Shift to send back / front |
| D | Toggle graph backdrop | Selected preview-capable node |
| Alt+W | Toggle in-Comfy overlay | Hovered overlay first, otherwise selected node |
| Alt+F | Fill window / restore | Hovered overlay first, otherwise selected node; opens its overlay if needed |
| Escape | Restore filled overlay | Restore its previous position and size |
| Alt+P | Presentation visibility | Hide/show graph nodes, code and links; rendering continues |
| Alt+Shift+Z | Satori | Hide/show Comfy chrome and canvas diagnostics |
| Alt+Shift+I | Canvas diagnostics | Independent toggle, including in presentation/Satori |
| Alt+Shift+O | Overlay click-through | Open overlays; edit content underneath |
| Alt+Z | Drawing Satori | Inside the drawing editor |
| Cmd/Ctrl+Enter | Run livecode | Inside the code editor or livecode preview |
| Ctrl+. | Stop livecode | Keep the last frame |
| Cmd/Ctrl+Shift+F | Format code | Selected text; whole document when nothing is selected |
| Cmd/Ctrl+Shift+Plus / Minus | Adjust editor font size | Focused editor or one selected editor node; saved per node |
| Alt+Shift+Right | Next Manim cue | Inside the active Manim editor/preview |

For artwork presentation, combine **Alt+F**, **Alt+P** and **Alt+Shift+Z**.
Fill window uses the current Comfy viewport. Browser/app chrome remains under
host control; use the browser's own fullscreen shortcut separately when desired.
It does not request browser fullscreen or create a macOS fullscreen Space.
Toggling restores overlay geometry. All three viewing modes remain independent.

The lower-left diagnostics belong to LiteGraph: **T** is graph time in seconds,
**I** graph iterations, **N** total nodes `[in-view nodes]`, **V** graph revision,
and **FPS** graph-canvas redraw frequency. Use generator and preview counters for
inference and output delivery rates. Presentation and Satori hide diagnostics by
default; Alt+Shift+I can reveal them without leaving either mode.

See [node UI design](node-ui-design.md) for overlay behavior and
[livecode languages](livecode-languages.md) for render sizing and editor controls.
