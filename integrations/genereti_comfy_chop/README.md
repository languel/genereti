# ꘇ CHOP operators

Named sampled control channels, MIDI/OSC bridges and barebones musical modules. Install all packs with `scripts/install_comfy.sh`, restart ComfyUI and refresh. This pack uses the shared p5 controls/editor and the texture expression parser; the combined lesson also uses DAT, stream and agent packs.

See the [operator catalog](../../docs/opentouch-catalog.md), [report and performance boundaries](../../docs/opentouch-report.md) and [lesson authoring](../../docs/opentouch-lessons.md). Open **ꘇ-OpenTouch-Operators-and-Lessons** under Workflows → Genereti.

Signal processors run in browser Float32Array blocks in Live mode; queued nodes evaluate explicit samples/time using NumPy. MIDI requires Connect/Web MIDI, OSC is explicit loopback UDP, and synth/drum audio requires Start. Opening or queuing a graph never opens devices or plays audio. Musical note/gate/velocity CHOPs feed MIDI Out, Synth and DrumKit. They are control signals, not audio-buffer streams or sample-accurate sequencing.

The full Core ML generator remains macOS 14+ on Apple silicon. These source/control nodes do not require Core ML; browser feature availability governs their live paths.
