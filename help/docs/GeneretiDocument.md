# Webview quick reference

An editable browser surface for notes, diagrams and interactive HTML. Choose **Raw source** to edit, then **Rendered document** to view. Text passes unchanged through the STRING input and output; rendering never replaces the source with HTML or a screenshot.

## Formats

- **Markdown**: headings, lists, tables, inline `$math$`, display `$$math$$`, and fenced `mermaid` diagrams. Math fonts and diagram rendering are bundled locally. Markdown HTML is sanitized.
- **HTML**: a full document with styles, scripts, canvas and audio. Scripts run in an isolated frame and cannot access the Comfy page. Start audio with a button or another user gesture. Reload explicitly restarts the document.
- **Text**: literal text; HTML tags are shown rather than interpreted.
- **URL**: enter an HTTP(S) page address. The page keeps its origin so local apps can reach their APIs. Same-origin local pages are trusted and can access the host. External sites may prohibit embedding or require permissions unavailable in a frame.

## Controls

The compact toolbar provides a separate output window, a draggable/resizable overlay, visual node view and a graph backdrop, followed by Raw, Rendered and Reload. Overlay and visual node view move the original surface, retaining running script state. Separate windows and backdrops run independent instances; they do not share game or audio state.

| Shortcut | Action |
| --- | --- |
| Option/Alt+O | Toggle visual node view |
| Option/Alt+Shift+O | Toggle all visual nodes |
| Option/Alt+W | Toggle overlay window |
| Option/Alt+F | Fill or restore the overlay |
| Option/Alt+Shift+C | Toggle click through |
| D | Toggle the selected node’s backdrop from the graph |
| Cmd/Ctrl+Shift+Plus or Minus | Adjust this node’s font size |

Cmd/Ctrl+O keeps Comfy’s Open workflow action. Font shortcuts work in Raw and Rendered without restarting scripts. Authored documents also relay the Option/Alt preview shortcuts while focused. Same-origin URL pages support font shortcuts; external pages control their own keyboard behavior.

Source, format, Raw/Rendered and font size survive workflow save/reload. Connected text is displayed after queuing; disconnecting restores the local draft. Editing a connected display does not overwrite that draft. Close output viewers when finished; removing the node cleans up its viewers and listeners.

## Try it

Open **ꘇ-Webview-Paper-Stage** from the workflow templates. Move the pointer over the paper shapes; press Start sound to hear the oscillator, then Mute to stop it. The companion notebook demonstrates math and a Mermaid diagram. The same HTML can be pasted into Livecode’s HTML mode.
