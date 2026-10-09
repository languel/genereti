# LFO quick reference

A low-frequency oscillator continuously changes a value. Connect `value` to a numeric input, or use `channels` in a CHOP chain.

- `wave`: sine, triangle, saw, reverse saw, square, sample & hold, smooth noise.
- `interval = free`: `period` is cycle duration in seconds.
- Musical intervals follow project transport: `1m` means one bar in project meter, `4n` a quarter note, `4nd` dotted, `4nt` triplet. Start transport to advance.
- `speed` multiplies cycle speed; `phase` shifts in cycles.
- `low/high` scale output range; `smooth` is smoothing time in seconds. Zero disables smoothing.
- `seed` makes random waves repeatable.

Drag the waveform to shift phase. **Ⅱ** holds output; **▶** resumes. **↶** resets free phase. The transport button plays/pauses project time; **▥** opens the timeline.

One output can feed several controls. Livecode parameters, TOP/CHOP expressions and other live Genereti controls follow the wire; ordinary Python computations require Queue. Queue uses explicit `time` and the performance snapshot. It never starts audio.

For hand-drawn modulation, use **ꘇ chop.gesture**: record X/Y/XY movement, preserve timing or fit a musical interval.

## Minimal performance view

Click **▣** or select this node and press **Alt+O** to show only the interactive
pad/waveform, with cables attached and invisible sockets still available for hover and connections. Hover just outside an edge to
reveal the restore-controls bar. **Alt+Shift+O** toggles this view for all visual
nodes in the workflow. View choices are saved; playback and downstream outputs
continue. Arm gesture recording before entering the view if you want to capture.
