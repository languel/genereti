# ꘇ DAT operators

Shared CodeMirror text, CSV/JSON tables, table processors, conversions and a lesson authoring node. Install the combined packs with `scripts/install_comfy.sh`, restart ComfyUI and refresh. DAT uses p5 controls/editor, the texture expression parser, and CHOP data contracts; lesson authoring/playback additionally requires the agent pack. Image converters use texture/stream preview controls.

Read the [catalog](../../docs/opentouch-catalog.md), [report](../../docs/opentouch-report.md) and [lesson authoring/export guide](../../docs/opentouch-lessons.md). `dat.lesson` holds the authored JSON and Run/Stop/Markdown/HTML/PDF controls. Learner dialogues only navigate/check steps. `dat.text` holds the report in the model-free **ꘇ OpenTouch Operators and Lessons** workflow.

`GENERETI_DAT` contains string rows. `dat.cell` exposes a scalar STRING and FLOAT. `dat.tochop` maps columns to named signals; `chop.todat` maps channels back to a table. `dat.totop` maps numeric cells to grayscale; `top.todat` performs a bounded, rate-limited image readback. Queue evaluates one document/block/frame without tutorial playback or device I/O.
