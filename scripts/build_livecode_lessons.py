#!/usr/bin/env python3
"""Rebuild three model-free Livecode lessons from a running Comfy's schemas."""
import argparse
import json
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / 'integrations/comfyui_genereti/workflows'
LESSONS = ROOT / 'integrations/genereti_comfy_agent/web/lessons'


class Lesson:
    def __init__(self, info, key, title, summary, filename):
        self.info, self.key, self.filename = info, key, filename
        self.nodes, self.links = [], []
        self.guide = dict(format='genereti-guide', version=1, id=key,
                          title=title, summary=summary, steps=[])

    def node(self, typ, title, pos, size=(340, 440), **values):
        schema = self.info[typ]
        inputs, widgets, named = [], [], {}
        for group in ('required', 'optional'):
            for name, (kind, opts) in schema['input'].get(group, {}).items():
                opts = opts or {}
                if kind == 'COMFY_AUTOGROW_V3':
                    continue
                is_widget = isinstance(kind, list) or kind in ('COMBO', 'FLOAT', 'INT', 'BOOLEAN', 'STRING') and not opts.get('forceInput')
                if is_widget:
                    choices = kind if isinstance(kind, list) else opts.get('options', [])
                    value = values.get(name, opts.get('default', choices[0] if choices else None))
                    widgets.append(value)
                    named[name] = value
                if not opts.get('socketless'):
                    inputs.append(dict(name=name, type='COMBO' if isinstance(kind, list) else kind, link=None,
                                       **({'widget': {'name': name}} if is_widget else {})))
        node_id = len(self.nodes) + 1
        props = {'Node name for S&R': typ, 'generetiLessonRef': str(uuid.uuid5(uuid.NAMESPACE_URL, self.key + ':' + str(node_id))),
                 'generetiPerformanceVersion': 1, 'genereti_widget_values': named}
        # Preserve named widgets across frontend-only delivery/picker controls.
        named = dict(named)
        if typ in ('GeneretiLivecode', 'GeneretiTextureComposite', 'GeneretiTextureFeedbackRef', 'GeneretiLiveImagePreview', 'GeneretiDatLesson'):
            widgets.append('Live')
            named['genereti_delivery'] = 'Live'
        n = dict(id=node_id, type=typ, title=title, pos=list(pos), size=list(size), flags={}, order=node_id-1, mode=0,
                 inputs=inputs, outputs=[dict(name=name, type=kind, links=[]) for name, kind in zip(schema['output_name'], schema['output'])],
                 properties=props, widgets_values=widgets, widgets_values_named=named)
        self.nodes.append(n)
        return n

    def livecode(self, title, pos, language, code, params):
        n = self.node('GeneretiLivecode', title, pos, (410, 620), language=language,
                      width=384, height=256, auto_update=True, code=code, parameters=json.dumps(params), performance='{}')
        n['properties']['generetiLivecodeParameters'] = dict(values=params, slots={name: i for i, name in enumerate(params)})
        n['properties']['generetiLivecodeLastGood'] = dict(mode=language, source=code)
        for i, name in enumerate(params):
            n['inputs'].append(dict(name=f'controls.value{i}', type='FLOAT', label=name, link=None, widget={'name': f'controls.value{i}'}))
        return n

    def ref(self, n, **kw):
        return dict(nodeType=n['type'], ref=n['properties']['generetiLessonRef'], **kw)

    def wire(self, a, b, input_name='image', output=0):
        slot = next(i for i, port in enumerate(b['inputs']) if port['name'] == input_name)
        link_id = len(self.links) + 1
        b['inputs'][slot]['link'] = link_id
        a['outputs'][output]['links'].append(link_id)
        self.links.append([link_id, a['id'], output, b['id'], slot, a['outputs'][output]['type']])

    def set(self, n, widget, value):
        return dict(kind='set-widget', target=self.ref(n, widget=widget, part='parameter'), value=value)

    def connect(self, a, b, input_name='image', output=0):
        return dict(kind='connect', source=self.ref(a), target=self.ref(b), input=input_name, output=a['outputs'][output]['name'])

    def step(self, title, text, n, hint, actions=(), part='node'):
        self.guide['steps'].append(dict(title=title, text=text, target=self.ref(n, part=part), hint=hint, **({'actions': list(actions)} if actions else {})))

    def save(self, lesson_pos):
        source = json.dumps(self.guide, ensure_ascii=False, indent=2)
        self.node('GeneretiDatLesson', 'ꘇ walkthrough · start here', lesson_pos, (630, 590), guide=source)
        flow = dict(last_node_id=len(self.nodes), last_link_id=len(self.links), nodes=self.nodes, links=self.links,
                    groups=[], config={}, extra={'ds': {'scale': .42, 'offset': [70, 90]}}, version=.4)
        for path in (WORKFLOWS / self.filename, LESSONS / (self.key + '.json')):
            path.write_text(json.dumps(flow, ensure_ascii=False, indent=2) + '\n')
        (LESSONS / (self.key + '-guide.json')).write_text(source + '\n')
        return self.guide


GLSL_SOURCE = '''// Fresh source: mainImage aliases map to u_time/u_resolution.
float speed = 1.0; /* 0.1..3 step:0.05 */
void mainImage(out vec4 color, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = (uv - 0.5) * vec2(iResolution.x/iResolution.y, 1.0);
    vec2 center = 0.25 * vec2(cos(iTime*speed), sin(iTime*speed*1.3));
    float ink = 1.0 - smoothstep(0.035, 0.055, length(p-center));
    vec3 palette = 0.5 + 0.5*cos(iTime*0.5 + vec3(0.0, 2.1, 4.2));
    color = vec4(palette*ink, 1.0);
}'''
GLSL_HISTORY = '''// Buffer A: transform and fade the previous composite.
float decay = 0.96; /* 0..0.99 step:0.01 */
void mainImage(out vec4 color, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = (uv-0.5)*0.992;
    float angle = 0.012;
    p = mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p;
    vec2 sampleUV = p+0.5;
    float inside = step(0.0,sampleUV.x)*step(sampleUV.x,1.0)
                 * step(0.0,sampleUV.y)*step(sampleUV.y,1.0);
    color = vec4(texture2D(iChannel0,sampleUV).rgb * decay * inside,1.0);
}'''
GLSL_DISPLAY = '''// Image pass: color-grade the composite, outside its history loop.
float contrast = 1.2; /* 0.5..2 step:0.05 */
void mainImage(out vec4 color, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 ink = texture2D(iChannel0,uv).rgb;
    color = vec4(pow(max(ink,vec3(0.0)),vec3(1.0/contrast)),1.0);
}'''
P5_SOURCE = '''let speed = 1.0; /* 0.1..3 */
function setup(){ createCanvas(windowWidth,windowHeight); colorMode(HSB,360,100,100); }
function draw(){
  background(225,45,8); noStroke();
  for(let i=0;i<18;i++){
    let a=frameCount*0.018*speed+i*TWO_PI/18;
    fill((i*20+frameCount)%360,80,95);
    circle(width/2+cos(a)*width*.3,height/2+sin(a*1.3)*height*.3,12+i*.7);
  }
  if(mouseIsPressed){ fill(40,30,100); circle(mouseX,mouseY,45); }
}'''
P5_PROCESS = '''let tiles = 3; /* 1..6 */
function setup(){ createCanvas(windowWidth,windowHeight); }
function draw(){
  background(8);
  if(!inputImage) return; // upstream has not delivered a frame yet
  let count=max(1,round(tiles)), w=width/count, h=height/count;
  for(let y=0;y<count;y++) for(let x=0;x<count;x++){
    push(); translate((x+.5)*w,(y+.5)*h);
    if((x+y)%2) scale(-1,1);
    imageMode(CENTER); image(inputImage,0,0,w,h); pop();
  }
}'''
P5_AUDIO = '''let energy = 0.0; /* 0..1 */
let sensitivity = 1.0; /* 0.1..3 */
function setup(){ createCanvas(windowWidth,windowHeight); colorMode(HSB,360,100,100); }
function draw(){
  background(230,45,9,22); noFill();
  let e=constrain(energy*sensitivity,0,1);
  for(let i=0;i<10;i++){
    stroke((frameCount*.8+i*24)%360,80,95,70); strokeWeight(1+e*4);
    let r=20+i*9+e*80;
    circle(width/2+sin(frameCount*.02+i)*e*20,height/2,r*2);
  }
  if(mouseIsPressed){ noStroke(); fill(45,20,100); circle(mouseX,mouseY,12+e*100); }
}'''


def build(info):
    guides = []
    l = Lesson(info, 'shader-buffers', 'Livecode: shader buffers and history',
               'Connected GLSL passes, one-frame history and an explicit fresh/history composite.', 'ꘇ-Livecode-Shader-Buffers.json')
    source = l.livecode('ꘇ fresh ink · GLSL', (0, 0), 'glsl', GLSL_SOURCE, {'speed': 1.0})
    history = l.node('GeneretiTextureFeedbackRef', 'ꘇ previous composite · Buffer A', (0, 720), width=384, height=256)
    warp = l.livecode('ꘇ Buffer A · warp / fade', (470, 720), 'glsl', GLSL_HISTORY, {'decay': .96})
    composite = l.node('GeneretiTextureComposite', 'ꘇ combine fresh ink + history', (940, 0), operation='add', opacity=1.0)
    display = l.livecode('ꘇ Image · final color pass', (1350, 0), 'glsl', GLSL_DISPLAY, {'contrast': 1.2})
    viewer = l.node('GeneretiLiveImagePreview', 'ꘇ final image', (1830, 0), preview_size=384)
    reference = json.dumps({'ref': composite['properties']['generetiLessonRef'], 'outputSlot': 0}, separators=(',', ':'))
    history['widgets_values'][0] = reference
    history['widgets_values_named']['reference'] = reference
    history['properties']['genereti_widget_values']['reference'] = reference
    for a, b, name in [(source, history, 'image'), (history, warp, 'image'), (source, composite, 'image'), (warp, composite, 'background'), (composite, display, 'image'), (display, viewer, 'image')]:
        l.wire(a, b, name)
    l.step('Make fresh ink', 'The first GLSL node paints moving RGB ink. Each Livecode node is a separate render pass. Change speed without rebuilding the shader.', source,
           'mainImage, iTime, iResolution and iChannel0 aliases are supported. Annotated float speed becomes a regular parameter and controls.value0 socket.', [l.set(source, 'controls.value0', .6)])
    l.step('Reference the end of the loop', 'Buffer A reads the previous composite. Its optional IMAGE input seeds frame one; it does not choose the history target. Pick the combine node in reference.', history,
           'Fresh → composite; previous composite → warp/fade → composite. The reference closes the loop with a one-tick delay, so there is no cyclic IMAGE wire.', [l.set(history, 'reference', reference)])
    l.step('Process the history buffer', 'The warp pass samples its IMAGE input as iChannel0 / u_image. It rotates, expands and fades yesterday’s pixels before they reach the composite.', warp,
           'Lower decay shortens trails. Here one input is one external buffer; internal Shadertoy A–D/Common tabs and four channel inputs are not implemented.', [l.set(warp, 'controls.value0', .90), l.connect(history, warp)])
    l.step('Combine fresh and old frames', 'Add fresh RGB ink to faded history. Display grading comes after the composite so it cannot amplify history each tick.', composite,
           'Screen is another useful blend. Over with an opaque black source would hide history. Do it restores additive routing.', [l.set(composite, 'operation', 'add'), l.connect(source, composite), l.connect(warp, composite, 'background')])
    l.step('Finish and interact', 'Increase contrast in the Image pass. Alt+W opens the actual interactive preview; Shift-click its overlay button or Alt+O keeps only the node output.', display,
           'IMAGE between Livecode nodes crosses separate browser runtimes. TOP operators keep their own GPU chain. Use dat.monitor on your actual patch rather than assuming a fixed frame rate.', [l.set(display, 'controls.value0', 1.6), l.connect(composite, display)])
    guides.append(l.save((1350, 730)))

    l = Lesson(info, 'p5-pipeline', 'Livecode: two p5 sketches, one image stream',
               'An interactive source feeds a mirrored tile processor using inputImage.', 'ꘇ-Livecode-P5-Pipeline.json')
    source = l.livecode('ꘇ p5 · interactive source', (0, 0), 'p5', P5_SOURCE, {'speed': 1.0})
    process = l.livecode('ꘇ p5 · mirrored tiles', (490, 0), 'p5', P5_PROCESS, {'tiles': 3.0})
    viewer = l.node('GeneretiLiveImagePreview', 'ꘇ tiled output', (980, 0), preview_size=384)
    l.wire(source, process)
    l.wire(process, viewer)
    l.step('Draw in the source', 'The left sketch paints animated colored dots. Press and move inside its output to paint a larger light spot. Its mouse is local to this source runtime.', source,
           'Use the output below the editor, Alt+W or Alt+O. Enable interaction in the overlay if you turned click-through on. Do it slows the animation, then try the mouse yourself.', [l.set(source, 'controls.value0', .5)], 'preview')
    l.step('Pass pixels to another sketch', 'Connect the source IMAGE to the processor image input. The processor receives inputImage, a p5.Image refreshed as frames arrive.', process,
           'inputImage is null before the first frame. It is an image, not the other sketch’s variables or canvas DOM. Do it reconnects the two sketches.', [l.connect(source, process)])
    l.step('Tile without recompiling', 'tiles is an annotated number. Change its regular control to resize the grid; the same image is drawn into alternating mirrored cells.', process,
           'The code rounds tiles to an integer. controls.value0 is the stable socket ID; tiles is its friendly label.', [l.set(process, 'controls.value0', 5.0)])
    l.step('Edit independent runtimes', 'Each sketch has its own setup, draw, frameCount and pointer. The downstream node receives images, not source code. Save keeps source text and wiring.', source,
           'Do it restores a leisurely source speed. You can add another Livecode p5 node and keep extending this image pipeline.', [l.set(source, 'controls.value0', .8)])
    l.step('Present the processed output', 'Open the viewer or processor as an overlay. Source interaction continues to appear in the tiled output; keep the source preview accessible when performing.', viewer,
           'Alt+W makes a floating view; Alt+O hides node chrome. Each node’s Queue capture freezes its current output; neither creates a shared p5 runtime.', [l.connect(process, viewer), l.set(process, 'controls.value0', 3.0)])
    guides.append(l.save((1470, 0)))

    l = Lesson(info, 'av-livecode', 'Livecode: sound analysis becomes visual control',
               'A quiet modular synth, RMS signal routing, spectrum/scope and an interactive p5 display.', 'ꘇ-Livecode-Audio-Visual.json')
    clock = l.node('GeneretiAudioTransport', 'ꘇ local music clock', (0, 0), (300, 200), bpm=96)
    seq = l.node('GeneretiAudioSequence', 'ꘇ notes', (0, 260), (350, 270), pattern='60 64 67 72 - 67 64 -')
    synth = l.node('GeneretiAudioSynth', 'ꘇ voice', (410, 0), (330, 640), voice='fm', level=.18)
    gain = l.node('GeneretiAudioGain', 'ꘇ balance / level', (820, 0), (300, 220), level=.8, pan=.2)
    out = l.node('GeneretiAudioOutput', 'ꘇ Start / Panic · sound', (1180, 0), (320, 260), level=.12)
    analyzer = l.node('GeneretiAudioAnalyze', 'ꘇ RMS / peak / bands', (820, 320), (340, 340), display_gain=10)
    scope = l.node('GeneretiAudioScope', 'ꘇ waveform', (0, 780), display_gain=12)
    spectrum = l.node('GeneretiAudioSpectrum', 'ꘇ spectrum', (400, 780), display_gain=1)
    xy = l.node('GeneretiAudioLissajous', 'ꘇ stereo geometry', (800, 780), display_gain=16)
    select = l.node('GeneretiChopSelect', 'ꘇ select rms', (1180, 360), (300, 240), pattern='rms')
    math = l.node('GeneretiChopMath', 'ꘇ sensitivity · RMS × 12', (1180, 710), (300, 350), operation='multiply', value=12)
    visual = l.livecode('ꘇ p5 · sound-reactive rings', (1570, 0), 'p5', P5_AUDIO, {'energy': 0.0, 'sensitivity': 1.0})
    for a, b, name, slot in [(clock, seq, 'clock', 0), (seq, synth, 'notes', 0), (synth, gain, 'input', 0), (gain, out, 'input', 0), (gain, analyzer, 'input', 0), (gain, scope, 'input', 0), (gain, spectrum, 'input', 0), (gain, xy, 'input', 0), (analyzer, select, 'input', 1), (select, math, 'input', 0), (math, visual, 'controls.value0', 1)]:
        l.wire(a, b, name, slot)
    l.step('Start sound explicitly', 'Press ▷ Start on mod.output at its low level. The lesson Play/Do it controls never unlock audio; this step waits for your own audio gesture.', out,
           'The music clock and sequence describe notes; the output activates the browser AudioContext. Panic stops it. Queue never plays sound.')
    l.step('Inspect the sound', 'scope shows stereo waveforms, spectrum shows frequency-bin magnitudes, and lissajous plots left against right. Display gain enlarges drawings without changing sound.', spectrum,
           'fft_size trades frequency detail for a longer analysis window. Do it sets 2048; all three taps analyze the running gain bus.', [l.set(spectrum, 'fft_size', 2048), l.set(scope, 'display_gain', 12)])
    l.step('Route RMS into p5', 'analyze.channels → chop.select rms → chop.math × 12 → energy. FLOAT is the last sample of the named control block. The p5 rings grow with sound level.', math,
           'This is control-rate analysis, not audio-rate DSP. energy is clamped to 0..1 in the annotated parameter. Do it restores the connection and increases sensitivity.', [l.set(select, 'pattern', 'rms'), l.set(math, 'value', 18), l.connect(math, visual, 'controls.value0', 1)])
    l.step('Add a pointer to the performance', 'Hold and move the pointer inside the p5 output. Light spots follow your mouse while ring size follows audio. Both interactions stay live in Alt+W / Alt+O.', visual,
           'Do it changes the unconnected sensitivity parameter. The connected energy default is overridden by RMS, so changing its local widget cannot defeat the wire.', [l.set(visual, 'controls.value1', 1.5)], 'preview')
    l.step('Explore stereo and stop', 'Adjust pan to tilt the lissajous line. Mono balance is not phase modulation. Press Panic on mod.output when finished; analysis and energy return to zero.', xy,
           'Do it only changes pan. Stop audio yourself. A future stereo effect can turn the diagonal into a loop; this demo preserves the actual channel relationship.', [l.set(gain, 'pan', -.45)])
    viewer = l.node('GeneretiLiveImagePreview', 'ꘇ audiovisual output', (2060, 0), preview_size=384)
    l.wire(visual, viewer)
    guides.append(l.save((1570, 750)))

    catalog_path = LESSONS / 'catalog.json'
    catalog = json.loads(catalog_path.read_text())
    keys = {g['id'] for g in guides}
    catalog = [g for g in catalog if g.get('id') not in keys] + guides
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--server', default='http://127.0.0.1:8001')
    args = parser.parse_args()
    with urllib.request.urlopen(args.server.rstrip('/') + '/object_info') as response:
        build(json.load(response))
