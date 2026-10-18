# ꘇ mediamime

Regions on the body that send MIDI, OSC, WebSocket messages and Genereti events. A successor to the standalone Mediamime, built on Genereti's perception streams and the Poliplan editor.

**How it works.** Wire a picture into `image` (and, for silhouette regions, a mask into `mask`), run a `ꘇ mediapipe.stream` node, and type its stream name into `stream` (or pick it in the toolbar). Draw regions with the Poliplan tools over the picture (▭ view), or on the homunculus (☺ view): regions drawn there are in torso units and follow the person. Select a region to choose which landmarks trigger it (click joints on the body or hand) and what it sends. ▶ starts sending; ■ ends every note.

- **Triggers:** enter, exit, enterExit (note on/off), inside (continuous), hit (enter, if moving fast enough: velocity from speed).
- **Values:** constant, or a landmark measure (x, y, distance, speed, depth, mask coverage) mapped between ranges.
- **Outputs:** Web MIDI (browser), OSC over UDP (sent by Comfy's server to loopback or a private network), a WebSocket at `ws://<comfy>/genereti/mediamime/ws`, a WebSocket of your own, and Genereti events (`__.events.on(name, …)` in livecode). The `mediamime` stream (`region.<name>.active`, `.x`, `.y`, `.speed`) and the `regions` CHOP output carry the live state.
- **Puppet:** the source `☻ puppet` is a synthetic body that dances the drum kit, to try a score without a camera. 🥁 adds a drum kit on the body. ⬆ imports a legacy Mediamime snapshot.
- **Layout:** `web/js/core` is pure (regions engine, frames, outputs hub), tested with `node --test tests/mediamime/*.test.mjs`; `web/js/ui` is the interface; `osc.py` encodes OSC.

Notes: the perception provider only accepts sources up to 1024 px per side; Web MIDI needs a browser that supports it (Chromium) and its permission.
