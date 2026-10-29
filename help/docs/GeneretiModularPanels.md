# Modular audio panels

Every `mod.*` node edits its own widgets through a visual panel, so anything you draw
can still be linked, copied and saved. Press **⚙** on a node to show the plain
parameter rows. Double-click a knob or fader to reset it; hold **Shift** for fine steps.

**mod.synth**: voice and waveform (sine, triangle, saw, square), an **envelope** you
drag (attack peak, decay + sustain corner, release end), a **filter** response you
drag (cutoff sideways, resonance up and down) with lp / hp / bp and an envelope
amount, detune, glide, vibrato, polyphony, and FM ratio and depth. The keys at the bottom audition notes.

**mod.drumsynth**: eight independently editable synthesized drum voices. Select a pad to edit its tone and noise levels and decays, oscillator waveform, pitch sweep and filter. Pads audition through a started output. The preset menu recalls factory kits; **✚** saves the current kit into the workflow.

**Instrument presets** are also available on **mod.synth**, **mod.karplus**, **mod.granular** and **mod.drumkit**. Select a factory sound or use **✚** to save a named patch in the node for later recall.

**mod.drumsequence**: click or drag cells to draw hits, Shift on an empty cell for an accent, Shift-drag an existing hit for velocity, Alt for
a ghost note. A row name mutes, right-click removes, **+ row** adds kick, rim, snare,
clap, toms, hats, ride or cowbell. Length 8 to 64, step size from quarter to 1/32,
rotate, randomize and clear. The pattern string (`kick:1002;snare~:0300`, where `2`
is an accent, `3` a ghost and `~` a muted row) is the source of truth.

**mod.sequence**: a monophonic piano roll. Click to place a note, again for a rest,
drag to draw; Shift-drag a note for velocity; −12 −1 +1 +12 transpose, ⇄ reverses, ⚄ writes a phrase in the project
scale and ♯ snaps drawing to it.

**mod.euclidean** and **mod.circlesequence**: up to eight independently sized rings. Add tracks with +, set note and track level, and Shift-drag a hit for its velocity. Click an Euclidean ring to rotate or a circle ring to toggle a step.

**mod.pianoroll**: draw polyphonic notes by dragging; drag their body to move or right edge to resize. Shift-drag vertically to set velocity; right-click removes and the wheel scrolls pitch.

**mod.mixer**: strips with pan, fader and live meter, mute and solo; the visible strips follow connected inputs up to 8 channels. **mod.filter**, **mod.gain**, **mod.delay** and **mod.drumkit**
(with audition pads) have matching panels; **mod.transport** adds tempo, swing and tap.

**Recording.** ⏺ on **mod.output** records the live signal and saves a 16-bit WAV
when you press it again.

**Bindings.** Every numeric and boolean parameter is a bindable action (see
[key and MIDI bindings](GeneretiInputBindings.md)), for example a CC on the synth cutoff.
Open the **ꘇ-Modular-Studio** example workflow for a patch that uses all of this.
