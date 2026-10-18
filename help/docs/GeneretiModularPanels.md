# Modular audio panels

Every `mod.*` node edits its own widgets through a visual panel, so anything you draw
can still be linked, copied and saved. Press **⚙** on a node to show the plain
parameter rows. Double-click a knob or fader to reset it; hold **Shift** for fine steps.

**mod.synth**: voice and waveform (sine, triangle, saw, square), an **envelope** you
drag (attack peak, decay + sustain corner, release end), a **filter** response you
drag (cutoff sideways, resonance up and down) with lp / hp / bp and an envelope
amount, detune, glide, vibrato and polyphony. The keys at the bottom audition notes.

**mod.drumsequence**: click or drag cells to draw hits, Shift for an accent, Alt for
a ghost note. A row name mutes, right-click removes, **+ row** adds kick, rim, snare,
clap, toms, hats, ride or cowbell. Length 8 to 64, step size from quarter to 1/32,
rotate, randomize and clear. The pattern string (`kick:1002;snare~:0300`, where `2`
is an accent, `3` a ghost and `~` a muted row) is the source of truth.

**mod.sequence**: a monophonic piano roll. Click to place a note, again for a rest,
drag to draw; −12 −1 +1 +12 transpose, ⇄ reverses, ⚄ writes a phrase in the project
scale and ♯ snaps drawing to it.

**mod.mixer**: strips with pan, fader and live meter, mute and solo; **+ / −** show
up to 8 channels. **mod.filter**, **mod.gain**, **mod.delay** and **mod.drumkit**
(with audition pads) have matching panels; **mod.transport** adds tempo, swing and tap.

**Recording.** ⏺ on **mod.output** records the live signal and saves a 16-bit WAV
when you press it again.

**Bindings.** Every numeric and boolean parameter is a bindable action (see
[key and MIDI bindings](GeneretiInputBindings.md)), for example a CC on the synth cutoff.
Open the **ꘇ-Modular-Studio** example workflow for a patch that uses all of this.
