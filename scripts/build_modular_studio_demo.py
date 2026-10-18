#!/usr/bin/env python3
"""Build the modular audio studio demo: every mod.* tool in one playable patch, with key/MIDI bindings preset."""
import argparse
import json
import shutil
import urllib.request
from build_livecode_lessons import Lesson, ROOT, WORKFLOWS

FILENAME = 'ꘇ-Modular-Studio.json'

DRUMS = 'kick:1000100010001001;snare:0000200000001000;clap:0000000000001000;hat:2131213121312131;openhat:0000000000100000;rim:0100000000010000'
BASS = '36 - 36 - 39 - 36 - 34 - 34 - 39 - 41 -'
LEAD = '72 - 67 - 63 67 - 72 70 - 65 - 62 65 - 70'


def build(base_url='http://127.0.0.1:8188'):
    info = json.load(urllib.request.urlopen(base_url + '/object_info'))
    l = Lesson(info, 'modular-studio', 'Modular audio studio',
               'A playable patch with transport, three sequencers, two synths, a drum kit, effects, an 8-channel mixer, recording, key/MIDI bindings and the timeline.',
               FILENAME)
    A = lambda kind: 'GeneretiAudio' + kind

    transport = l.node(A('Transport'), 'ꘇ transport · tempo, swing, tap', (0, 0), (330, 300), bpm=112, swing=.1)
    drums = l.node(A('DrumSequence'), 'ꘇ drums · draw hits, shift = accent', (380, 0), (470, 330), pattern=DRUMS, division=4, velocity=.7)
    bass_seq = l.node(A('Sequence'), 'ꘇ bass line · piano roll', (380, 400), (520, 420), pattern=BASS, division=4, gate=.7, velocity=.8)
    lead_seq = l.node(A('Sequence'), 'ꘇ lead arpeggio · piano roll', (380, 880), (520, 420), pattern=LEAD, division=4, gate=.45, velocity=.6)
    kit = l.node(A('DrumKit'), 'ꘇ drum kit · pads audition', (960, 0), (430, 270), level=.9, decay=.22, tone=1)
    bass = l.node(A('Synth'), 'ꘇ bass synth · envelope + filter', (960, 340), (470, 430), voice='subtractive', wave='sawtooth', level=.55, attack=.005, decay=.22,
                  sustain=.35, release=.14, cutoff=650, resonance=3, glide=.03, polyphony=3, filter_mode='lowpass', filter_env=.7, detune=0)
    lead = l.node(A('Synth'), 'ꘇ lead synth · fm voice', (960, 840), (470, 430), voice='fm', wave='auto', level=.32, attack=.01, decay=.25, sustain=.3,
                  release=.45, cutoff=6000, resonance=1, vibrato=.12, vibrato_rate=5.5, polyphony=6, filter_mode='lowpass', filter_env=.2, detune=6)
    bass_filter = l.node(A('Filter'), 'ꘇ bass filter · drag the point', (1480, 340), (380, 280), mode='lowpass', cutoff=900, resonance=1.4)
    lead_delay = l.node(A('Delay'), 'ꘇ lead delay', (1480, 840), (300, 190), seconds=.4, feedback=.38, mix=.3)
    mixer = l.node(A('Mixer'), 'ꘇ mixer · faders, pan, M/S, meters', (1910, 0), (340, 320), level_1=.85, level_2=.7, level_3=.8, pan_2=.25, master=.85)
    mixer['properties']['genereti_mixer_channels'] = 3
    spectrum = l.node(A('Spectrum'), 'ꘇ spectrum', (1910, 400), (430, 300), fft_size=2048)
    out = l.node(A('Output'), 'ꘇ output · ▷ start · ⏺ record', (1910, 780), (330, 190), level=.7)
    timeline = l.node('GeneretiPerformanceTimeline', 'ꘇ timeline · Alt+W floats it as an overlay', (0, 1400), (920, 480))

    for a, b, name in [(transport, drums, 'clock'), (transport, bass_seq, 'clock'), (transport, lead_seq, 'clock'),
                       (drums, kit, 'notes'), (bass_seq, bass, 'notes'), (lead_seq, lead, 'notes'),
                       (bass, bass_filter, 'input'), (lead, lead_delay, 'input'),
                       (bass_filter, mixer, 'input_1'), (lead_delay, mixer, 'input_2'), (kit, mixer, 'input_3'),
                       (mixer, spectrum, 'input'), (spectrum, out, 'input')]:
        l.wire(a, b, name)

    l.step('Start the sound', 'Nothing plays until you press ▷ on mod.output; keep your volume low for the first run. The ⏺ button records the output to a WAV file, ■ is panic.', out,
           'Queue never starts audio. ctrl+alt+space starts and stops it from anywhere, ctrl+alt+. is panic.')
    l.step('Set the tempo', 'Turn the bpm knob, or tap in your own tempo. Swing delays every second step. All three sequencers share this clock.', transport,
           'Double-click a knob to reset it. Hold Shift for fine control.')
    l.step('Play the drums', 'Click or drag cells to draw hits, Shift+click for an accent, Alt+click for a ghost note. Click a row name to mute it, right-click to remove it, + row adds one. Use 8–64 for the length and the note value for the step size.',
           drums, 'The pattern stays a plain text string you can copy: kick:1000…;snare:…. ⚄ randomizes, ↺ ↻ rotate.')
    l.step('Draw the bass', 'The piano roll is a monophonic melody: click a cell to place a note, click it again for a rest, drag to draw a line. −12 −1 +1 +12 transpose, ⚄ writes a random phrase in the project scale, ♯ snaps drawing to it.',
           bass_seq, 'Wheel scrolls the pitch range. Alt-click or right-click makes a rest.')
    l.step('Shape the bass synth', 'Drag the envelope points for attack, decay + sustain and release. Drag the filter point sideways for cutoff and up for resonance; env sweeps the cutoff on every note. Choose the voice and waveform at the top, and play the keys at the bottom to audition.',
           bass, 'The ⚙ button shows the plain parameter rows, which stay linkable to other nodes.')
    l.step('Add the lead', 'The lead is an FM voice with detune and vibrato, repeating through a delay. Try the ◿ saw wave or hp / bp filter modes.', lead,
           'Every panel control edits a real widget: link a CHOP or LFO to any of them.')
    l.step('Mix and watch the meters', 'Each strip has pan, a fader with a live meter, mute and solo. Press + for more channels (up to 8); the master fader is on the right.', mixer,
           'Double-click a fader to return to unity.')
    l.step('Bind keys and MIDI', 'Press ⌨ on mod.output to open Bindings. This patch already has ctrl+alt+r (record), ctrl+alt+b / ctrl+alt+d (mute bass / drums) and, with a MIDI controller connected, CC74 on channel 1 for the bass cutoff. Choose any control, press ◉, then press a key or move a knob to learn it.',
           out, 'Workflow bindings are saved with the workflow; global ones (like ctrl+alt+space) stay in this browser.')
    l.step('Float the timeline', 'The timeline is a node: press Alt+W while hovering it to float it as an overlay window you can drag over the graph, or Alt+O to see only the timeline. Type a position or loop point in any format and tap a tempo.',
           timeline, 'Use it to automate parameters and record your knob moves.')

    guide = l.save((0, 380))
    # Preset bindings (kept in the workflow, loaded by the bindings hub).
    path = WORKFLOWS / FILENAME
    flow = json.loads(path.read_text())
    ids = {name: str(n['id']) for name, n in dict(out=out, mixer=mixer, bass=bass).items()}
    flow['extra']['genereti_bindings'] = [
        dict(id='demo-record', source=dict(type='key', combo='ctrl+alt+r'), target=dict(node=ids['out'], action='record'), mode='trigger'),
        dict(id='demo-mute-bass', source=dict(type='key', combo='ctrl+alt+b'), target=dict(node=ids['mixer'], action='mute_1'), mode='toggle'),
        dict(id='demo-mute-drums', source=dict(type='key', combo='ctrl+alt+d'), target=dict(node=ids['mixer'], action='mute_3'), mode='toggle'),
        dict(id='demo-cutoff', source=dict(type='midi', kind='cc', channel=1, number=74), target=dict(node=ids['bass'], action='cutoff'), mode='range', min=200, max=2400),
    ]
    path.write_text(json.dumps(flow, ensure_ascii=False, indent=2) + '\n')
    shutil.copy(path, ROOT / 'example_workflows' / FILENAME)
    return path


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:8188')
    print(build(parser.parse_args().base_url))
