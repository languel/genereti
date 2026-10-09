# Gesture quick reference

Record expressive movement and route it to numeric controls. Choose **XY**, **X**, or **Y**. XY uses a pad; X and Y offer a wide single-axis slider and recorded curve.

1. Press **● Record** to arm.
2. Drag the pad or slider. Recording starts with the first drag; release ends the take.
3. Press **▶ Play**. Connect `x`, `y`, or `value` to a numeric input.

`value` follows X in X/XY mode and Y in Y mode. `channels` contains both named axes for CHOP processing. Connect one output to several controls to reuse a gesture.

## Playback timing

- `interval = free`: preserve the recorded timing. `speed = 2` plays twice as fast.
- A musical interval stretches the entire gesture to that interval at speed 1. `1m` means one bar in project meter; `4n` is a quarter note; `4nd` dotted; `4nt` triplet.
- With `quantize` enabled, musical playback waits for the next interval boundary. Start project transport with the transport button or timeline. Paused transport holds playback.
- `loop` repeats. Disable it to stop at the last point.
- `smooth` is smoothing time in seconds; zero follows immediately. Try 0.03 to soften abrupt changes.

Original timestamps are retained; retiming changes playback, not the saved gesture. Recording uses real elapsed time even when project transport is paused. Tempo changes follow project beat position. Seeking or looping project transport restarts playback; transport jumps cancel pending launches.

## Range and saving

`x_low/high` and `y_low/high` map normalized movement to output ranges. Hold **Cmd** (Mac) or **Ctrl** and drag a gesture slider's left/right corner to adjust its lower/upper bound. Regular number controls provide precise values. This interaction applies to our gesture sliders; ordinary Comfy widgets keep their usual behavior.

Recordings live inside workflow JSON. Playback starts paused after reopening. A new take replaces the old take when the drag ends; disarming without dragging preserves it. Maximum take: ten minutes or 8192 points. Pointer capture follows dragging outside the pad.

Queue samples the saved recording at explicit `time` and the performance snapshot for musical timing. It never records or starts live playback. Live Genereti consumers update continuously; arbitrary Python nodes update when queued. Use CHOP Lag for smoothing elsewhere in a chain.

## Minimal performance view

Click **▣** or select this node and press **Alt+O** to show only the interactive
pad/waveform, with cables attached and invisible sockets still available for hover and connections. Hover just outside an edge to
reveal the restore-controls bar. **Alt+Shift+O** toggles this view for all visual
nodes in the workflow. View choices are saved; playback and downstream outputs
continue. Arm gesture recording before entering the view if you want to capture.
