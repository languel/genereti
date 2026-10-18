# Key and MIDI bindings

Bind a computer key or a MIDI control to a node action without wiring anything.
Press **⌨** on a **mod.output** node (or use `window.generetiBindings.openPanel()`) to
open the Bindings panel, choose a target (for example `mod.output · mute`), press
**◉**, then press a key chord or move a MIDI control. Esc cancels.

**Targets** are actions a node offers. `mod.output` offers `start / stop`, `start`,
`stop`, `mute` and `level`. Global targets are `audio start / stop` (starts the
lowest-numbered output, or stops everything that is running) and `audio panic`.

**Modes** follow the action: trigger actions run on press; `mute` can be
*toggle*, *momentary* (on while held), *on* or *off*; `level` is a range, so a CC
sweeps it from min to max and a held key or note holds the maximum. A CC above half
counts as one press, so a controller resting at 127 does not retrigger.

**Scope.** *Workflow* (◇) bindings are saved inside the workflow, so a patch
carries its own mappings. *Global* (◆) bindings stay in this browser and hold common
transport controls; ◆/◇ moves a binding between the two. Defaults:
`⌃⌥Space` audio start / stop and `⌃⌥.` audio panic.

**Keyboard.** Keys are physical, so Option does not change a chord's name on macOS.
Bare keys are ignored while typing in a text field; chords with ctrl, alt or cmd
still bind. Chords the browser or system keeps (⌘Q, ⌃W, ⌘T…) are refused while
learning. A key press counts as the user gesture that browsers require to start
audio, so a chord can start playback.

**MIDI** is opt-in: starting a learn connects Web MIDI (all inputs), or press ♪ in
the panel. Workflows that contain MIDI bindings try to reconnect when they load.
Notes, CC and pitch bend can be bound; the existing **chop.midi in** node is
unaffected and can run alongside.

**`__` events.** Every bound or unbound key and MIDI message is also emitted as a
`__` event named `key:ctrl+alt+space` or `midi:ch1.note60` (`entry` on press, `exit`
on release), so livecode can react with `__.events.on('key:space', …)`.
