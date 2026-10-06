#!/usr/bin/env python3
"""Rebuild the painterly lesson, starter workflow and completed patch lesson source."""
import copy
import json
import uuid
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
FLOWS = ROOT / 'integrations/comfyui_genereti/workflows'
LESSONS = ROOT / 'integrations/genereti_comfy_agent/web/lessons'
REFS = {k: str(uuid.uuid5(uuid.NAMESPACE_URL, 'genereti:painterly:' + k)) for k in ['source','palette','grain','fresh','history','flow','displace','soften','cross','viewer']}
SPECS = {}
def spec(key, kind, title, position, widgets, size=(400, 600)):
    SPECS[key] = dict(kind='create-node', target=dict(nodeType=kind, ref=REFS[key]), title='ꘇ '+title, position=list(position), size=list(size), widgets=dict(genereti_delivery='Live', **widgets))
def target(key, **more): return dict(SPECS[key]['target'], **more)
def create(key): return copy.deepcopy(SPECS[key])
def wire(source, dest, port='image'): return dict(kind='connect', target=target(dest), source=target(source), output='image', input=port)
def set_value(key, widget, value): return dict(kind='set-widget', target=target(key, widget=widget, part='parameter'), value=value)
def cue(key, gesture):
    return dict(kind='pointer',target=target(key,widget='scale',part='parameter'),gesture=gesture,**{'from':[.3,.5],'to':[.65,.5] if gesture=='move' else [.3,.5]},path=[[.3,.5,0],[.5,.7,180],[.65,.5,350]] if gesture=='move' else [[.3,.5,0],[.3,.5,350]])
def drag(key, widget, start, end):
    return dict(kind='pointer', target=target(key, widget=widget, part='parameter'), gesture='drag', fromValue=start, value=end, **{'from':[.65,.5], 'to':[.3,.5]}, path=[[.65,.5,0],[.58,.48,160],[.45,.56,350],[.3,.5,650]])
PALETTE = 'mix(0.06+0.26*step(0.5,c)+0.07*step(1.5,c),0.95-0.43*step(0.5,c)-0.40*step(1.5,c),floor(clamp(v,0,0.999)*8)/7)'
base = dict(algorithm='simplex', dimensions=3, width=512, height=320, scale=3, seed=9, z=0, time=0, speed=.02, octaves=2, lacunarity=2, gain=.5, color='Grayscale')
spec('source','GeneretiTextureNoise','top.noise · broad pigment field',(0,0),base,(400,780))
spec('palette','GeneretiTextureExpression','top.expression · warm / cool pigment',(470,0),dict(expression=PALETTE,width=512,height=320,time=0),(400,660))
spec('grain','GeneretiTextureNoise','top.noise · fine pigment grain',(0,880),dict(base,algorithm='value',dimensions=2,scale=96,seed=21,speed=0,octaves=1),(400,780))
spec('fresh','GeneretiTextureComposite','top.composite · fresh pigment',(470,880),dict(operation='add',opacity=.055))
spec('history','GeneretiTextureFeedbackRef','top.feedbackref · previous painted frame',(940,0),dict(reference='',width=512,height=320))
spec('flow','GeneretiTextureNoise','top.noise · slow brush flow',(940,880),dict(base,scale=5,seed=31,speed=.012,color='RGB'),(400,780))
spec('displace','GeneretiTextureDisplace','top.displace · brush the old paint',(1410,0),dict(amount_x=.01,amount_y=.01,center=.5))
spec('soften','GeneretiTextureFilter','top.filter · soften pigment',(1880,0),dict(operation='blur',amount=.7))
spec('cross','GeneretiTextureComposite','top.composite · painted result / REF TARGET',(2350,0),dict(operation='cross',opacity=.06))
spec('viewer','GeneretiLiveImagePreview','painterly canvas',(2820,0),dict(preview_size=512),(500,600))
steps = []
def step(title, text, hint, key, actions): steps.append(dict(title=title,text=text,hint=hint,target=target(key,part='node'),actions=actions))
step('Grow a broad noise field','Start with 3D simplex noise: x/y make the field, the slowly moving third coordinate animates it. Scale changes the size of the pigment regions. Do it builds this step; Play remaining builds the whole patch.','Choose Live, 512 × 320, simplex, 3 dimensions, scale 3, speed 0.02. The cursor paths here are authored demonstrations; Record captures your own paths.','source',[create('source'),cue('source','move'),cue('source','click'),set_value('source','scale',2),drag('source','scale',2,3)])
step('Color and grain the fresh paint','The expression maps grayscale noise to eight warm/cool pigment bands. Fine value noise is added at low opacity. Image is A; background is B: add gives B + opacity × A.','Connect broad noise → expression. Connect palette → composite background, fine grain → image. Opacity 0.055 keeps the grain subtle. c selects RGB; v is the incoming component.','fresh',[create('palette'),wire('source','palette'),dict(kind='type-text',target=target('palette',widget='expression',part='code'),value=PALETTE),create('grain'),create('fresh'),wire('grain','fresh'),wire('palette','fresh','background')])
step('Prepare a delayed frame and brush flow','feedbackref is a delay, not a composite. Its IMAGE input seeds the first frame. Its output must feed a processing chain to influence the result. Leave reference empty until we make the final target. A colored noise map supplies different red/green displacement directions.','Connect fresh pigment → feedbackref image. Make another simplex noise with RGB color, scale 5 and speed 0.012. The reference target comes in step 5.','history',[create('history'),wire('fresh','history'),create('flow')])
step('Process the previous paint','Move the delayed frame with the flow map, then soften it with a small blur. These processors sit inside the feedback loop, so their effect accumulates each frame.','feedbackref → displace image; RGB noise → displace displacement; displace → blur. Start with X/Y 0.01 and radius 0.7 pixels.','displace',[create('displace'),wire('history','displace'),wire('flow','displace','displacement'),create('soften'),wire('displace','soften')])
step('Close the loop with a reference','Crossfade fresh pigment (image A) with processed history (background B). At opacity 0.06 the result is 6% fresh + 94% old. Set feedbackref reference to the final composite named REF TARGET. That dashed logical link reads the previous completed frame; no cyclic IMAGE cable is needed. Referencing the fresh source instead would only delay it.','Wire fresh → final composite image, blur → background. In feedbackref’s picker choose “painted result / REF TARGET”. The final composite is the target, not the seed. Use the reset arrow to clear history.','history',[create('cross'),wire('fresh','cross'),wire('soften','cross','background'),set_value('history','reference',json.dumps(dict(ref=REFS['cross'],outputSlot=0),separators=(',',':'))),set_value('cross','opacity',.15),drag('cross','opacity',.15,.06)])
step('Present and record a variation','Open the canvas overlay with Alt-W; Alt-F fills the browser window. Increase fresh opacity for faster renewal, reduce it for longer brush memory. Change flow scale/speed for different marks. Record on dat.lesson captures named parameter changes and cursor paths; + separates steps, Stop saves them. Review its JSON before exporting or sharing.','Select the viewer for Alt-W. In the lesson toolbar press Record, drag a float parameter, hover between controls and click; stop recording and replay the new step. Audio, camera and screen capture remain manual.','viewer',[create('viewer'),wire('cross','viewer'),dict(kind='select',target=target('viewer'))])
guide=dict(format='genereti-guide',version=1,id='painterly-noise-feedback',title='Paint with noise and reference feedback',summary='A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition. Model-free pigment, grain and brush-flow feedback; includes Hint, Do it and cursor demonstrations.',steps=steps)
def save(path,obj): path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
save(LESSONS/'painterly-guide.json',guide)
starter=json.loads((LESSONS/'feedback-av.json').read_text())
lesson=starter['nodes'][0];source=json.dumps(guide,ensure_ascii=False,indent=2)
lesson.update(id=1,title='ꘇ painterly feedback · build / record / play',pos=[0,0],size=[720,800])
lesson['widgets_values'][0]=source
lesson['widgets_values_named']={'guide':source}
lesson['properties']['generetiOperatorText']={'guide':source}
starter.update(nodes=[lesson],links=[],groups=[],last_node_id=1,last_link_id=0,extra={'ds':{'scale':.8,'offset':[80,100]}})
starter.pop('id',None);starter.pop('revision',None)
save(FLOWS/'ꘇ-Painterly-Feedback-Tutorial.json',starter);save(LESSONS/'painterly.json',starter)
patch_path=FLOWS/'ꘇ-Painterly-Feedback-Patch.json'
if patch_path.exists():
    patch=json.loads(patch_path.read_text());old=next((n for n in patch['nodes'] if n['type']=='GeneretiDatLesson'),None)
    if old:
        old['widgets_values'][0]=source;old['widgets_values_named']={'guide':source};old['properties']['generetiOperatorText']={'guide':source}
    history=next(n for n in patch['nodes'] if n['type']=='GeneretiTextureFeedbackRef')
    reference=json.dumps(dict(ref=REFS['cross'],outputSlot=0),separators=(',',':'))
    history['widgets_values'][0]=reference
    history['widgets_values_named']['reference']=reference
    history['properties']['genereti_widget_values']['reference']=reference
    save(patch_path,patch)
catalog=json.loads((LESSONS/'catalog.json').read_text());catalog=[g for g in catalog if g['id']!=guide['id']]+[guide];save(LESSONS/'catalog.json',catalog)
print('Packaged painterly guide and starter')
