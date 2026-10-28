#!/usr/bin/env python3
"""Build two model-free, playable song lessons from the running Comfy schema."""
import argparse
import json
import urllib.request

from build_livecode_lessons import Lesson, LESSONS, WORKFLOWS


def make(info, ambient):
    key = 'ambient-song' if ambient else 'braindance-breaks'
    title = 'Ambient: a slow constellation' if ambient else 'Braindance: fractured breaks'
    filename = 'ꘇ-Ambient-Song.json' if ambient else 'ꘇ-Braindance-Breaks.json'
    lesson = Lesson(info, key, title, 'A model-free song patch with an interactive walkthrough; sound starts only when you choose.', filename)
    a = lambda kind: 'GeneretiAudio' + kind
    clock = lesson.node(a('Transport'), 'ꘇ transport · shared project clock', (0, 0), (330, 280), bpm=78 if ambient else 172, swing=.04 if ambient else .12, clock_name='project')
    melody = lesson.node(a('Sequence'), 'ꘇ melody · draw notes', (400, 0), (520, 390), pattern=('60 - - - 67 - - - 64 - - - 71 - - - 62 - - - 69 - - - 65 - - - 72 - - -' if ambient else '60 - 63 - 67 70 - 67 63 - 65 - 62 65 - 58'), division=2 if ambient else 4, gate=.8 if ambient else .45, velocity=.58)
    bass_seq = lesson.node(a('Sequence'), 'ꘇ low notes', (400, 470), (520, 390), pattern=('36 - - - - - - - 41 - - - - - - - 33 - - - - - - - 43 - - - - - - -' if ambient else '36 - - 36 - 39 - - 34 - 34 - 41 - 39 -'), division=1 if ambient else 4, gate=.8 if ambient else .55, velocity=.65)
    drums = lesson.node(a('DrumSequence'), 'ꘇ rhythm · draw hits', (400, 940), (520, 350), pattern=('kick:1000000000000000;hat:0010001000100010;rim:0000000000001000' if ambient else 'kick:1000001000100001;snare:0000100000001000;hat:1211112112111121;openhat:0000000100000000;rim:0000010000100010'), division=4, velocity=.3 if ambient else .65)
    voice = lesson.node(a('Synth'), 'ꘇ melody · soft FM' if ambient else 'ꘇ melody · FM', (980, 0), (430, 430), voice='fm', level=.22 if ambient else .25, attack=.14 if ambient else .01, decay=.65 if ambient else .16, sustain=.35, release=1.8 if ambient else .3, cutoff=3200, resonance=.8, filter_env=.15)
    bass = lesson.node(a('Synth'), 'ꘇ low voice', (980, 500), (430, 430), voice='sine' if ambient else 'subtractive', wave='auto' if ambient else 'sawtooth', level=.22 if ambient else .3, attack=.15 if ambient else .005, decay=.4 if ambient else .18, sustain=.4, release=1.2 if ambient else .18, cutoff=500 if ambient else 850, resonance=.8 if ambient else 2)
    kit = lesson.node(a('DrumKit'), 'ꘇ drum kit', (980, 1000), (410, 270), level=.4 if ambient else .7, decay=.22, tone=1)
    delay = lesson.node(a('Delay'), 'ꘇ echoes', (1470, 0), (300, 200), seconds=.48 if ambient else .22, feedback=.38 if ambient else .22, mix=.3 if ambient else .16)
    reverb = lesson.node(a('Reverb'), 'ꘇ space', (1810, 0), (300, 200), decay=3.5 if ambient else 1.1, mix=.5 if ambient else .18)
    mixer = lesson.node(a('Mixer'), 'ꘇ mixer · mute / solo', (1810, 420), (370, 380), level_1=.65, level_2=.65, level_3=.55, pan_1=.15, master=.65)
    mixer['properties']['genereti_mixer_channels'] = 3
    scope = lesson.node(a('Scope'), 'ꘇ sound as a waveform', (2260, 0), (420, 300), display_gain=8)
    out = lesson.node(a('Output'), 'ꘇ output · press Start', (2260, 420), (340, 230), level=.45)
    for source, target, name in [(clock, melody, 'clock'), (clock, bass_seq, 'clock'), (clock, drums, 'clock'), (melody, voice, 'notes'), (bass_seq, bass, 'notes'), (drums, kit, 'notes'), (voice, delay, 'input'), (delay, reverb, 'input'), (reverb, mixer, 'input_1'), (bass, mixer, 'input_2'), (kit, mixer, 'input_3'), (mixer, scope, 'input'), (scope, out, 'input')]:
        lesson.wire(source, target, name)
    lesson.step('Start listening', 'Press Start on the output to enable sound, then play the transport if it is paused. Start with a low system volume. The scope is the only visual: it shows the actual sound.', out, 'Audio requires your own Start gesture; loading or queueing this workflow does not start sound.')
    lesson.step('Set the pulse', 'The project clock drives all three parts. Try a small change in tempo or swing and listen to the relationship between the parts.', clock, 'The timeline and this transport share the project clock.')
    lesson.step('Edit the melody', 'Click a piano-roll cell to place or remove a note; drag to draw a phrase. Listen to the spaces between notes.', melody, 'Use the octave and transpose controls to find another register.')
    lesson.step('Shape the low part', 'Change the bass notes, then adjust the low voice filter and envelope. Solo its mixer channel to hear it on its own.', bass, 'A longer release overlaps notes; a lower cutoff softens the sound.')
    lesson.step('Make the rhythm your own', 'Draw hits in the drum grid. Shift-click makes an accent and Alt-click makes a ghost hit. Mute or solo the drum channel to compare the arrangement.', drums, 'For a break, add a few quiet snare or rim hits and leave space around the main snare.' if not ambient else 'The sparse percussion is optional; mute it for a beatless version.')
    lesson.step('Create space', 'Adjust the delay mix and feedback, then the reverb mix. Bring the melody channel down if the echoes cover the bass or drums.', reverb, 'The effects process only the melody; the bass and drums remain clear.')
    lesson.step('Perform and finish', 'Use the mixer mute and solo buttons to bring parts in and out. Press Stop on the output when finished; record with the output record button if you want to keep a take.', mixer, 'Try an introduction with only the melody, then add bass and rhythm one at a time.')
    guide = lesson.save((0, 350))
    # The project clock owns tempo after load, so the transport widget alone
    # cannot establish the intended song tempo.
    for path in (WORKFLOWS / filename, LESSONS / (key + '.json')):
        flow = json.loads(path.read_text())
        flow['extra']['generetiPerformance'] = {
            'version': 1, 'duration': 32,
            'transport': {'bpm': 78 if ambient else 172, 'fps': 30,
                          'signature': {'numerator': 4, 'denominator': 4},
                          'loop': {'enabled': False, 'start': 0, 'end': 8}},
            'tracks': [], 'clips': [], 'data': {}}
        path.write_text(json.dumps(flow, ensure_ascii=False, indent=2) + '\n')
    return guide


def build(server):
    with urllib.request.urlopen(server.rstrip('/') + '/object_info') as response:
        info = json.load(response)
    guides = [make(info, True), make(info, False)]
    path = LESSONS / 'catalog.json'
    catalog = json.loads(path.read_text())
    ids = {guide['id'] for guide in guides}
    path.write_text(json.dumps([g for g in catalog if g.get('id') not in ids] + guides, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--server', default='http://127.0.0.1:8188')
    build(parser.parse_args().server)
