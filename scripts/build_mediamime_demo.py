#!/usr/bin/env python3
"""Build the portable mediamime body-drum demo (Laurie Anderson style): no media or models in Git."""
import argparse
import json
import urllib.request
from build_livecode_lessons import Lesson, ROOT, LESSONS

PARAMS = dict(source_opacity=.55, burst_size=60, trail_emission=1.2, gravity=.18, drag=.04, life_seconds=1.6, glow=.8, show_zones=True)


def build(base_url='http://localhost:8188'):
    info = json.load(urllib.request.urlopen(base_url + '/object_info'))
    l = Lesson(info, 'mediamime-body-drum', 'Mediamime · the body as a drum',
               'Draw trigger zones on the homunculus and over the stage. Strikes play Genereti instruments, send MIDI/OSC/__ events and burst into particles.',
               'ꘇ-Perception-08-Mediamime-Body-Drum.json')
    source = l.node('GeneretiMediaStream', 'ꘇ Dancer · + load a film or camera · ▶ play', (0, 0), (450, 620))
    source['properties'].update(genereti_media_kind='video', genereti_media_url='', genereti_media_fps=15, genereti_media_speed=.75, genereti_media_size=640)
    provider = l.node('GeneretiPerceptionProvider', 'ꘇ One Holistic provider · dancer', (500, 0), (470, 680), stream='dancer', tasks='holistic', max_fps=15)
    provider['properties']['generetiProviderOverlay'] = False
    segments = l.node('GeneretiPerceptionSegments', 'ꘇ Body mask · selfie segmentation', (500, 760), (470, 560), stream='dancerMask', model='segment', regions='person', threshold=.5, softness=.1, max_fps=15)
    score = json.loads((ROOT / 'docs/examples/mediamime-body-drum.score.json').read_text())
    mime = l.node('GeneretiPerceptionMime', 'ꘇ mediamime · body drum + stage gates', (1020, 0), (1300, 840),
                  stream='dancer', publish='mime', min_confidence=.4, max_age_ms=500, score=json.dumps(score, separators=(',', ':')))
    drums_only = l.node('GeneretiChopSelect', 'ꘇ drums · MIDI channel 10', (1020, 900), (320, 200), pattern='ch10.*')
    synth_only = l.node('GeneretiChopSelect', 'ꘇ synth · MIDI channel 1', (1360, 900), (320, 200), pattern='ch1.*')
    drums = l.node('GeneretiAudioDrumKit', 'ꘇ body drum kit', (1020, 1140), (320, 260), level=.85, decay=.25, tone=1)
    synth = l.node('GeneretiAudioSynth', 'ꘇ gate synth', (1360, 1140), (320, 420), level=.3, attack=.02, release=.6, cutoff=2400)
    mixer = l.node('GeneretiAudioMixer', 'ꘇ mix', (1700, 900), (420, 420), level_1=.9, level_2=.6, pan_2=.0, master=.8)
    out = l.node('GeneretiAudioOutput', 'ꘇ speakers · press Start', (2160, 900), (320, 200), level=.8)
    particles = l.livecode('ꘇ Body drum particles · R clears', (2380, 0), 'p5', (ROOT / 'docs/examples/mediamime-particles.js').read_text(), PARAMS)
    particles['size'] = [690, 900]
    particles['properties']['generetiP5'] = {'version': '2.3.4'}
    for name, value in [('width', 960), ('height', 720)]:
        particles['properties']['genereti_widget_values'][name] = value
        particles['widgets_values_named'][name] = value
        particles['widgets_values'][list(particles['widgets_values_named']).index(name)] = value
    for port in particles['inputs']:
        if port.get('label') == 'show_zones':
            port['type'] = 'BOOLEAN'
    preview = l.node('GeneretiLiveImagePreview', 'ꘇ Particles · output', (3120, 0), (700, 580))
    ledger = l.node('GeneretiDatInspect', 'ꘇ Hit ledger', (2160, 1160), (520, 380), format='text', limit=64)
    for a, b, name, slot in [(source, provider, 'image', 0), (source, segments, 'image', 0), (provider, mime, 'image', 0), (segments, mime, 'mask', 0), (provider, particles, 'image', 0), (particles, preview, 'image', 0),
                             (mime, drums_only, 'input', 0), (mime, synth_only, 'input', 0), (drums_only, drums, 'notes', 0), (synth_only, synth, 'notes', 0),
                             (drums, mixer, 'input_1', 0), (synth, mixer, 'input_2', 0), (mixer, out, 'input', 0), (mime, ledger, 'input', 1)]:
        l.wire(a, b, name, slot)
    l.step('Load a dancer', 'Use + on the source to load a film (early films such as Sandow work well) or start a camera, then press ▶.', source,
           'No camera, playback, download or inference starts until you press it.')
    l.step('Start the Holistic provider', 'Press ▶ on the provider (↓ downloads the pinned model once if needed). It publishes the shared "dancer" stream.', provider,
           'Mediamime, the particles and any other consumer reuse this one stream.')
    l.step('Add the body outline', 'Optionally start the segmentation node too (▶). Its mask outlines the body on the stage and drives the wingL zone, which fires when the body itself enters the left wing.', segments,
           'Segmentation zones measure how much of the zone the body covers (threshold), not where a landmark is.')
    l.step('Read the score', 'The stage board shows the film with the skeleton; the body board is the homunculus. Seven drum zones sit on the body, two gates high on the stage, a tripwire on the floor.', mime,
           '☺ frames the body board, ▭ the stage. Dashed outlines on the stage are the body zones following the dancer.', part='node')
    l.step('Play the body', 'Press ▶ in mediamime, then Start on the speakers node. Index fingers striking a body zone play the drum kit (velocity follows the strike speed); hands in a gate hold a synth note; feet crossing the floor line play a low note.', mime,
           'A zone on an arm or shoulder cannot be struck by that same arm. Cooldowns stop a single strike from repeating.')
    l.step('Draw your own instrument', 'Draw closed shapes on the homunculus or over the stage, lines for tripwires, or points for small targets. Each new mark gets a region with an event and a note; edit them in the panel.', mime,
           'Body marks anchor to the nearest bone and move with the performer; stage marks stay in image coordinates.')
    l.step('Route events anywhere', 'Each region can send __ events (Livecode: __.events.on), MIDI (connect MIDI), OSC (arm OSC, loopback UDP) and WebSocket messages. The channels output carries ch10.noteNN / ch1.noteNN for Genereti instruments.', mime,
           'MIDI and WebSocket only open after their buttons; OSC goes to 127.0.0.1 only.')
    l.step('Particles from movement', 'Every hit bursts into sparks at the struck point; fast hands and feet trail sparks. Adjust burst_size, trail_emission and gravity.', particles,
           'The sketch reads __.streams.read("mime") for the live zones and __.events.on("mime") for hits.')
    guide = l.save((2380, 960))
    catalog_path = LESSONS / 'catalog.json'
    catalog = [x for x in json.loads(catalog_path.read_text()) if x.get('id') != guide['id']] + [guide]
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    return l.filename


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://localhost:8188')
    print(build(parser.parse_args().base_url))
