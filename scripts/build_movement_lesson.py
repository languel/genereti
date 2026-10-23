#!/usr/bin/env python3
"""Build a portable, selection-driven dance painting lesson; no media/models in Git."""
import argparse
import copy
import json
import urllib.request
from pathlib import Path
from build_livecode_lessons import Lesson, ROOT, LESSONS

PARAMS = dict(trail_seconds=18, smoothing=.45, brush_size=6, energy_gain=1.2,
              pigment=.58, motif_density=.7, palette_shift=0, source_opacity=.08,
              accumulate=False, show_landmarks=False)

def definition():
    measures = [dict(name=name, type='point', a='pose.'+point) for name,point in
                [('wristL','left_wrist'),('wristR','right_wrist'),('ankleL','left_ankle'),('ankleR','right_ankle')]]
    measures += [dict(name='torso',type='centroid',a='$bodyCenter'),dict(name='faceCenter',type='centroid',a='$faceCenter'),
                 dict(name='reach',type='distance',a='pose.left_wrist',b='pose.right_wrist'),
                 dict(name='pinchLGap',type='distance',a='hands.left.thumb_tip',b='hands.left.index_tip'),
                 dict(name='pinchRGap',type='distance',a='hands.right.thumb_tip',b='hands.right.index_tip'),
                 dict(name='fingersCross',type='crossing',a='hands.left.index_mcp',b='hands.left.index_tip',c='hands.right.index_mcp',d='hands.right.index_tip'),
                 dict(name='handL',type='hand',side='left'),dict(name='handR',type='hand',side='right'),
                 dict(name='mouth',type='mouth',threshold=.15),dict(name='eyes',type='eyes',threshold=.15),dict(name='gaze',type='gaze'),
                 dict(name='lookTarget',type='gaze_target',gaze='gaze',region='stage::center')]
    measures += [dict(name='zone'+side,type='inside',a='$bodyCenter',region='stage::'+region)
                 for side,region in [('L','left'),('R','right'),('Center','center')]]
    events = [dict(name=name,steps=[dict(feature=feature,op='>',value=.5,hold_ms=hold)],within_ms=1500,cooldown_ms=delay)
              for name,feature,hold,delay in [('fingers.cross','fingersCross.crossing',80,400),('mouth.opens','mouth.open',120,400),('eyeL.blinks','eyes.left.closed',60,250),('eyeR.blinks','eyes.right.closed',60,250),('stage.enter','zoneCenter.inside',150,350)]]
    contacts = [dict(name='pinch'+side,feature='pinch'+side+'Gap.distance',close=.04,open=.07,hold_ms=40,tap_ms=350,click_ms=700,cooldown_ms=200) for side in ['L','R']]
    return dict(version=1,locators=[dict(name='bodyCenter',points=['@pose.torso'],min_points=3),dict(name='faceCenter',points=['@face.face_oval'],min_points=8)],measures=measures,events=events,contacts=contacts)

def build(base_url='http://localhost:8188'):
    info=json.load(urllib.request.urlopen(base_url+'/object_info'))
    l=Lesson(info,'movement-painting','Dance / movement painting',
             'One shared Holistic stream becomes ribbons, stitched steps, a moving loom, hand accents and face-driven ornament.',
             'ꘇ-Perception-07-Movement-Painting-Lesson.json')
    source=l.node('GeneretiMediaStream','ꘇ Dancer · + load a film · ▶ play',(0,0),(450,620))
    source['properties'].update(genereti_media_kind='video',genereti_media_url='',genereti_media_fps=15,genereti_media_speed=.75,genereti_media_size=640)
    provider=l.node('GeneretiPerceptionProvider','ꘇ One Holistic provider · danceBody',(500,0),(470,680),stream='danceBody',tasks='holistic',max_fps=15)
    provider['properties']['generetiProviderOverlay']=False
    measure=l.node('GeneretiPerceptionMeasures','ꘇ Movement vocabulary · locators + measures',(1020,0),(580,1250),stream='danceBody',selection_stream='movement',features='pose.left_wrist pose.right_wrist pose.left_ankle pose.right_ankle @pose.torso',min_confidence=.35,max_age_ms=500,definitions=json.dumps(definition(),ensure_ascii=False))
    measure['properties'].update(generetiSelectionMapOpen=True,generetiFeatureGrid=False,generetiFeatureUnderlayOpacity=.4)
    regions=l.node('GeneretiPerceptionRegions','ꘇ Stage zones · move / resize boxes',(500,760),(470,510),region_stream='stage',boxes=json.dumps({'version':1,'boxes':[{'name':'left','box':[0,0,.35,1]},{'name':'right','box':[.65,0,.35,1]},{'name':'center','box':[.3,.2,.4,.6]}]}))
    painter=l.livecode('ꘇ Dance / movement painting · R clears',(1660,0),'p5',(ROOT/'docs/examples/movement-painting.js').read_text(),PARAMS)
    painter['size']=[690,1000];painter['properties']['generetiP5']={'version':'2.3.4'}
    # Keep code controls editable; BOOLEAN sockets retain their actual types.
    for name,value in [('width',960),('height',720)]:
        painter['properties']['genereti_widget_values'][name]=value
        painter['widgets_values_named'][name]=value
        index=list(painter['widgets_values_named']).index(name)
        painter['widgets_values'][index]=value
    for port in painter['inputs']:
        if port.get('label') in ['accumulate','show_landmarks']:port['type']='BOOLEAN'
    inspector=l.node('GeneretiDatInspect','ꘇ Signal ledger · valid flags matter',(1020,1330),(580,390),format='json',limit=256)
    preview=l.node('GeneretiLiveImagePreview','ꘇ Movement painting · clean output',(2400,0),(700,580))
    for a,b,name,slot in [(source,provider,'image',0),(provider,measure,'image',0),(provider,regions,'image',0),(provider,painter,'image',0),(measure,inspector,'input',1),(painter,preview,'image',0)]:l.wire(a,b,name,slot)
    def param(name,value):return l.set(painter,'controls.value'+str(list(PARAMS).index(name)),value)
    l.step('Prepare the dancer','Use + on the film source to load a dance/movement film and press ▶. The local copy uses Serpentine Dance; try Sandow or a clear contemporary dancer when fabric hides joints.',source,'No camera, media playback, model download or inference is started by lesson actions. Camera users can replace the film source explicitly.')
    l.step('Start one shared Holistic stream','Press ▶ on the Holistic provider after its assets are installed (↓ downloads them if needed). It publishes danceBody with body, face and both hands. All other nodes reuse it.',provider,'The selected feature list never causes another model run. Clean image, observations and diagnostic overlay are separate outputs.')
    l.step('Check the source / landmark match','Turn on the source underlay and point IDs in the Measures viewer. Examine wrists, ankles and the torso. The anatomical map is a selection reference, not the detected pose.',measure,'Missing/occluded joints are unavailable; their strokes stop instead of jumping to (0,0). Lower confidence only after inspecting the source.',actions=[param('show_landmarks',True),param('source_opacity',.35)])
    l.step('Four pens, one moving loom','Run Livecode if it is not running. Teal/pink wrist ribbons, orange/blue ankle stitches and torso-centroid spokes weave the dancer\'s path into a paper-like painting.',painter,'Point positions place the pens; torso/face groups define centroids. Source and strokes share aspect-preserving framing.',actions=[param('source_opacity',.08),param('show_landmarks',False)])
    l.step('Change the gesture\'s handwriting','Compare direct following with soft interpolation. Adjust brush_size, energy_gain and pigment: faster movement widens ribbons, while slower movement makes fine lines.',painter,'Smoothing changes drawing motion, not the detector. Source timestamps, source-change checks and missing-point breaks protect the stroke.',actions=[param('smoothing',.7),param('brush_size',9),param('energy_gain',1.8)])
    l.step('Time as paint','Try a short trail, then switch accumulate on to keep the whole movement painting. Pause the film to hold the composition; R clears the ink layer.',painter,'A held source neither ages the paint nor advances event holds. A missing source preserves the last painting without inventing movement.',actions=[param('trail_seconds',5),param('accumulate',False)])
    l.step('Edit spatial zones','Move or resize the shared center/left/right boxes. Torso-in-zone measures bias color; entering the center adds a rosette. Observe stage::center in the ledger.',regions,'Editor zoom/pan affects navigation only. The boxes remain normalized to the complete source. Polygons/region layers can follow later.')
    l.step('Distance and segment geometry','Watch reach.distance between wrists: it opens/closes the torso halo. The two index-finger segments can trigger a crossing rosette when they intersect in 2D.',measure,'Distances use image-height units with aspect correction. Crossing is projected segment intersection, not proof of physical 3D contact.')
    l.step('Hands write accents','Open hands add petal ornaments; finger count shifts color. A fist lifts its wrist pen; thumbs gently turn the palette. Pinch a thumb/index pair, then release to stamp a click accent.',measure,'Geometric hand estimates are not trained gesture classes. Inspect handL.valid / handR.valid and adjust close/open/hold/cooldown. Serpentine fabric often hides hands; absence is not a fist.')
    l.step('Face signals without pretending','Mouth aperture enlarges brush/halo energy, blinks add face-centered ornaments, and iris-in-eye x gently biases color. The optional lookTarget stays invalid until empirical calibration ranges are supplied.',measure,'Iris tracking does not provide a reliable gaze target. Use a closer source for face details; the painting continues with body-only signals.')
    l.step('Author a new relation','Select a group on the map, save a locator with +, add a measure with ⊕ and bind A/B/C/D with ◎. Add a threshold event or contact envelope, or edit the shared JSON in {}.',measure,'The editor and script-like JSON produce the same saved plan. __.streams.read("movement").features reads values; __.events.on("pinchL.click", ...) subscribes to pulses.')
    l.step('Make your own movement painting','Try slower playback, stronger pigment, long accumulation, different zones or a different dancer. Turn off the source underlay and export the final PNG.',painter,'HTML/ZIP exports package the sketch, not the Comfy graph or MediaPipe streams. Record/provide those streams separately for a standalone replay.',actions=[param('trail_seconds',24),param('smoothing',.45),param('source_opacity',0),param('accumulate',True),param('motif_density',1)])
    guide=l.save((1660,1080))
    catalog_path=LESSONS/'catalog.json';catalog=json.loads(catalog_path.read_text());catalog=[x for x in catalog if x.get('id')!=guide['id']]+[guide];catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
    return l.filename

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--base-url',default='http://localhost:8188');args=parser.parse_args();print(build(args.base_url))
