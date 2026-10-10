# Webview checkpoint — October 9, 2026

Implemented in public Genereti: `GeneretiDocument` / **ꘇ webview**. Raw/Rendered and Reload use the compact shared toolbar. STRING input/output preserves source. HTML scripts run in an opaque sandbox, Markdown is sanitized, and math fonts/Mermaid assets are local. URL mode preserves the page origin for app API access; same-origin pages are trusted. External sites may disallow frames.

Source, format, view and font size are saved with workflows. Queue updates the display without overwriting the draft; disconnect restores it. Font changes update the running frame without reloading. Window, overlay, visual node view and backdrop controls share the Livecode conventions. Overlay/visual view preserve the original frame; output window/backdrop create independent document instances. Cmd/Ctrl+O remains Comfy Open workflow. Option/Alt+O, W, F and Shift+O work in authored frames as well as from the graph; cross-origin URL pages own their keyboard handling.

Demo: `example_workflows/ꘇ-Webview-Paper-Stage.json`. The HTML source is also available under the p5 web extension's `examples/paper-stage.html` and can be used in Livecode HTML mode. Help: `help/docs/GeneretiDocument.md`. Build: `npm run build:document`; package/license records include Mermaid and renderer chunks.

## Verification

Tested against Comfy at localhost:8188 in a separate headed browser session. Registered schema, Markdown KaTeX and Mermaid labels, escaped plain text, interactive canvas and audio after a click, font changes retaining script state, actual queued STRING input and draft restore passed. The existing local Blocks & Beats URL embedded and reached its status API without changing GeneretiCore. Real overlay, Alt-O, popup and backdrop checks passed; backdrop keeps the graph geometry and node buttons accessible. Browser tests do not establish arbitrary external website compatibility or native Desktop popup behavior.

Save/reload preserved edited HTML, Raw/Rendered and font size. Queuing a two-node STRING chain preserved the source exactly; removing the graph left zero document frames. Malformed Mermaid reported an inline error without retaining offscreen rendering hosts; script/event handlers were removed from Markdown. Popup close/reopen passed. Validation: 191 JavaScript tests and 79 Python tests passed, plus reference/template sync and package allowlist checks.

This checkpoint is included with the webview implementation, authored Help and demo. No inference, cloud calls or public deployment were needed. The changes remain under Unreleased; this update does not publish a Registry version.
