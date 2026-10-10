# Image preview quick reference

Shows live browser frames and queued IMAGE results without saving preview files. The IMAGE output preserves the full input batch.

Preview dimensions can **Match source**, **Match output window**, or use explicit **width / height**. Match output follows the most recently opened viewer; without one it uses source dimensions. Fit offers Contain, Cover, Stretch and Native pixels. Preview size retains its existing role as the queued thumbnail encoding limit; display dimensions do not change the output IMAGE.

Freeze and minimize skip local drawing while forwarding fresh frames to downstream viewers. Window, overlay, visual node view and backdrop use the standard Genereti controls. D targets the node under the pointer and falls back to selection.

Queued preview resolution is set globally in **Genereti settings → Previews** (default 512 px). Its hover tip explains quality and speed. This only limits queued thumbnails, including Alt-O and Alt-W views; live frames and full-resolution IMAGE input/output remain unchanged. Existing workflows use the global value when queued in the browser.
