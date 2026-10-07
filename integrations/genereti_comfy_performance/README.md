# Genereti performance pack

Workflow-scoped browser clock, time/scale/quantization nodes and a native/floating
timeline with numeric automation. Install via `scripts/install_comfy.sh`; restart
Comfy and refresh. [User guide](../../docs/performance-time.md) describes time
units, global `__`, offsets, recording and the first-pass seek policy.

Rebuild the checked-in browser UI with `npm run build:performance`. The script
also derives served demo/guide fixtures from the canonical workflow. Livecode's
sandbox bridge is bundled separately by `npm run build:livecode`.

`web/core/timeValue.js`, `transport.js`, `timelineSelection.js` and
`ui/TransportTimeline.jsx` adapt Underscores source; its MIT notice is in
`UNDERSCORES-LICENSE`. React's notice accompanies the shipped bundle. Browser
state lives in `workflow.extra.generetiPerformance`; queued nodes read explicit
snapshots and never start sound, camera or screen capture.
