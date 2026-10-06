#!/usr/bin/env python3
"""Build small, model-free learning workflows from canonical node schemas."""
import copy
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
FLOWS = ROOT / 'integrations/comfyui_genereti/workflows'
LESSONS = ROOT / 'integrations/genereti_comfy_agent/web/lessons'
lab = json.loads((FLOWS / 'ꘇ-OpenTouch-Operators-and-Lessons.json').read_text())
drawing = json.loads((FLOWS / 'ꘇ-Drawing-Source.json').read_text())

def node(kind, number, title, position, size=(430, 620)):
    original = next(n for n in [*lab['nodes'], *drawing['nodes']] if n['type'] == kind)
    n = copy.deepcopy(original)
    n.update(id=number, title='ꘇ '+title, pos=list(position), size=list(size), order=number-1)
    for socket in n.get('inputs', []): socket['link'] = None
    for socket in n.get('outputs', []): socket['links'] = []
    return n

def document(n, text, mode='markdown'):
    n['inputs'] = [s for s in n['inputs'] if not s['name'].startswith('controls.')]
    n['widgets_values'] = [mode, 512, 384, True, text, '{}', 'Live']
    n['properties'] = {'Node name for S&R':'GeneretiLivecode',
        'generetiLivecodeLastGood': {'mode':mode, 'source':text},
        'generetiLivecodeParameters': {'values':{}, 'slots':{}},
        'genereti_widget_values': {'language':mode, 'width':512, 'height':384, 'auto_update':True, 'code':text, 'parameters':'{}'}}
    return n

def workflow(nodes, links=()):
    return {'last_node_id':max(n['id'] for n in nodes), 'last_link_id':len(links), 'nodes':nodes,
        'links':list(links), 'groups':[], 'config':{}, 'extra':{'ds':{'scale':0.65,'offset':[30,70]}}, 'version':0.4}

def write(path, value): path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')

authoring = {'format': 'genereti-guide',
 'version': 1,
 'id': 'lesson-authoring',
 'title': 'Make a tutorial with Genereti',
 'summary': 'Record selections and actions, add hints, replay demonstrations and export a guided lesson.',
 'steps': [{'title': 'A lesson is a workflow document',
            'text': 'The dat.lesson node holds your guide JSON in CodeMirror. Its toolbar runs the learner '
                    'dialogue and exports the document. The learner dialogue only navigates the lesson.',
            'target': {'nodeType': 'GeneretiDatLesson', 'part': 'code', 'widget': 'guide'},
            'hint': 'Use Focus to locate the tool, then follow the step instructions.'},
           {'title': 'Give your lesson an identity',
            'text': 'Change the title in the sample guide JSON. Use a unique id when you make another '
                    'lesson, and keep format genereti-guide and version 1. All steps need a title and text.',
            'target': {'nodeType': 'GeneretiDatLesson', 'part': 'code', 'widget': 'guide'},
            'check': {'kind': 'changed-widget'},
            'hint': 'Use Focus to locate the tool, then follow the step instructions.'},
           {'title': 'Describe a learner action',
            'text': 'Edit the first step text to give a concrete action and explain what should change. '
                    'Narration is plain text; it never executes scripts or starts devices.',
            'target': {'nodeType': 'GeneretiDatLesson', 'part': 'code', 'widget': 'guide'},
            'check': {'kind': 'changed-widget'},
            'hint': 'Use Focus to locate the tool, then follow the step instructions.'},
           {'title': 'Record a demonstration',
            'text': 'On dat.lesson press ● Record tutorial actions. Add or remove a node, select the texture expression node, edit '
                    'its code or width/height, and connect nodes. Click/drag gestures are visual cues; '
                    'values and connections are semantic actions. Device start, queue and arbitrary UI '
                    'clicks are not replayed. The starting patch, node layout and titles are recorded too.',
            'target': {'nodeType': 'GeneretiDatLesson', 'part': 'toolbar'},
            'hint': 'The filled circle starts recording. It does not run a learner guide.'},
           {'title': 'Split the recording into teaching steps',
            'text': 'Press + New recorded step after a coherent action. Then select another tool and type '
                    'into its field. Press ✓ Stop recording and append steps to put your recording in the '
                    'lesson JSON. Existing authored steps stay intact.',
            'target': {'nodeType': 'GeneretiDatLesson', 'part': 'toolbar'},
            'hint': 'Use one step per idea. Intermediate slider values are coalesced; finish a gesture '
                    'before pressing +.'},
           {'title': 'Add a hint and review the actions',
            'text': 'Each recorded step has editable title, text, hint, target and actions. Replace draft '
                    'narration with a learner task; hint should explain a recovery path. type-text reveals '
                    'text progressively; pointer cues visualize clicks and drags at normalized locations.',
            'target': {'nodeType': 'GeneretiDatLesson', 'part': 'code', 'widget': 'guide'},
            'hint': 'Add "hint": "Try changing the frequency first" inside a step. Hint never runs actions.'},
           {'title': 'Try Hint and Do it',
            'text': 'Run your guide. Hint reveals advice. Do it replays only the current step, visibly types '
                    'committed text, changes real parameter values and restores recorded wiring. Next stays '
                    'learner-controlled. Play all replays successive steps and pauses at manual instructions. Source auto-update is paused while typing; a recorded Livecode Run '
                    'compiles afterward. Audio/capture stays explicitly activated.',
            'target': {'nodeType': 'GeneretiDatLesson', 'part': 'toolbar'},
            'hint': 'The sample lesson already includes Hint and Do it examples. Run authored lesson '
                    'replaces this authoring tour with your draft.'},
           {'title': 'Focus a real tool',
            'text': 'Targets use stable internal node types. Record captures a persistent ref and nodeId so '
                    'two tools of the same type remain distinct. part can be node, code, preview, toolbar or '
                    'parameter; widget names a parameter or editor.',
            'target': {'nodeType': 'GeneretiTextureExpression', 'part': 'code', 'widget': 'expression'},
            'hint': 'Use Focus to locate the tool, then follow the step instructions.'},
           {'title': 'Try the check yourself',
            'text': 'Change this texture expression. A changed-widget check compares its value to the value '
                    'at step entry, then enables Next. Learners can skip checks; this does not grade '
                    'artistic quality.',
            'target': {'nodeType': 'GeneretiTextureExpression', 'part': 'code', 'widget': 'expression'},
            'check': {'kind': 'changed-widget'},
            'hint': 'Use Focus to locate the tool, then follow the step instructions.'},
           {'title': 'Export from the author toolbar',
            'text': 'Use Document export on dat.lesson for Markdown, standalone HTML, or Print / Save as '
                    'PDF. Use {} for editable lesson JSON. Save the Comfy workflow separately to keep its '
                    'nodes and wiring. Exports are deliberately outside the learner dialogue.',
            'target': {'nodeType': 'GeneretiDatLesson', 'part': 'toolbar'},
            'hint': 'Use Focus to locate the tool, then follow the step instructions.'},
           {'title': 'Run and share your draft',
            'text': 'Press Run authored lesson on dat.lesson to register and play your edited guide. That '
                    'replaces this walkthrough with your own learner dialogue. Stop ends playback without '
                    'undoing edits. Sharing the workflow supplies the actual tools; sharing HTML/PDF '
                    'supplies static notes.',
            'target': {'nodeType': 'GeneretiDatLesson', 'part': 'toolbar'},
            'hint': 'Use Focus to locate the tool, then follow the step instructions.'}]}
sample = {'format': 'genereti-guide',
 'version': 1,
 'id': 'my-first-texture-lesson',
 'title': 'My first texture lesson',
 'summary': 'A short lesson with hints, recorded typing and playback you can customize.',
 'steps': [{'title': 'Make a different pattern',
            'text': 'Change x*8 to x*4 and watch the image.',
            'target': {'nodeType': 'GeneretiTextureExpression', 'part': 'code', 'widget': 'expression'},
            'check': {'kind': 'changed-widget'},
            'hint': 'Edit the expression yourself, or use Do it to watch an example appear.',
            'actions': [{'kind': 'pointer',
                         'target': {'nodeType': 'GeneretiTextureExpression', 'nodeId': 2, 'part': 'code'},
                         'gesture': 'click',
                         'from': [0.5, 0.4]},
                        {'kind': 'type-text',
                         'target': {'nodeType': 'GeneretiTextureExpression',
                                    'nodeId': 2,
                                    'part': 'code',
                                    'widget': 'expression'},
                         'value': '(sin(x * 12 + t) + cos(y * 12 - t)) / 2'}]},
           {'title': 'Present your texture',
            'text': 'Select the image preview and press Alt+W to open its overlay. Hover outside an edge to '
                    'reveal the controls.',
            'target': {'nodeType': 'GeneretiLiveImagePreview', 'part': 'toolbar'},
            'check': {'kind': 'overlay-open'}},
           {'title': 'Type a teaching note',
            'text': 'Do it types into a real DAT field. Try writing your own note afterward.',
            'hint': 'The dat.text editor stores ordinary workflow text.',
            'target': {'nodeType': 'GeneretiDatText', 'nodeId': 4, 'part': 'code', 'widget': 'text'},
            'actions': [{'kind': 'type-text',
                         'target': {'nodeType': 'GeneretiDatText',
                                    'nodeId': 4,
                                    'part': 'code',
                                    'widget': 'text'},
                         'value': '# A recorded lesson\n'
                                  '\n'
                                  'Selections focus tools. Actions demonstrate changes.\n'
                                  '\n'
                                  'Try it yourself, ask for a hint, or use Do it.'}]}]}
lesson = node('GeneretiDatLesson',1,'author your lesson',(0,0),(510,790));lesson['widgets_values']=[json.dumps(sample,ensure_ascii=False,indent=2),'Live']
lesson['properties']['generetiOperatorText']={'guide':lesson['widgets_values'][0]}
texture = node('GeneretiTextureExpression',2,'learner exercise',(580,0));preview = node('GeneretiLiveImagePreview',3,'learner output',(1100,0),(410,620))
texture['outputs'][0]['links']=[1];preview['inputs'][0]['link']=1
notes = node('GeneretiDatText',4,'authoring notes · export here too',(0,870),(700,540));notes['widgets_values']=[(ROOT/'docs/opentouch-lessons.md').read_text(),'Live']
author_flow=workflow([lesson,texture,preview,notes],[[1,2,0,3,0,'IMAGE']])
write(FLOWS/'ꘇ-Tutorial-Authoring.json',author_flow);write(LESSONS/'authoring.json',author_flow)

p5 = document(node('GeneretiLivecode',1,'interactive p5 · Alt+O / Alt+W',(0,0)),'''let clicks = 0;
function setup(){ createCanvas(windowWidth, windowHeight); }
function draw(){
  clear(); fill(235); noStroke(); textSize(24);
  text("Clicks: " + clicks, 24, 40);
  circle(mouseX, mouseY, 30);
}
function mousePressed(){ clicks++; }
''','p5')
md = document(node('GeneretiLivecode',2,'scrollable document · Alt+W',(500,0)), '# Interactive document\n\nOpen an overlay with **Alt+W**. Select text and scroll inside the document.\n\nMath stays sharp: $E=mc^2$.\n\n'+ '\n\n'.join(f'## Section {i}\n\nA native document view, rather than a bitmap. Texture capture still uses the configured resolution.' for i in range(1,13)))
draw = node('GeneretiDrawing',3,'draw over the graph · Shift-click overlay',(1000,0),(540,650))
view_guide = {'format':'genereti-guide','version':1,'id':'interactive-output-views','title':'Interactive output views',
    'summary':'Present a working sketch or document without losing interaction.', 'steps':[
        {'title':'Use the sketch','text':'Click the p5 output; its click counter changes. The moving circle follows your pointer.', 'target':{'nodeType':'GeneretiLivecode','part':'preview'}},
        {'title':'Hide just the node chrome','text':'Select p5 and press Alt+O, or Shift-click its overlay button. Only output remains. Hover just outside an edge to reveal its opacity and stacking controls. The restore glyph brings the chrome back.', 'target':{'nodeType':'GeneretiLivecode','part':'node'}},
        {'title':'Move it into an overlay','text':'Restore the node, then press Alt+W or click the overlay button normally. The same sketch moves into an interactive overlay.', 'target':{'nodeType':'GeneretiLivecode','part':'toolbar'}, 'check':{'kind':'overlay-open'}},
        {'title':'Arrange two views','text':'Open the scrollable document overlay too. Hover a view and use Cmd+[ / ] for backward/forward, or Cmd+Shift+[ / ] for back/front. The bar has the same controls; Shift-click a stacking arrow for back/front. Code editors keep their own bracket shortcuts.'},
        {'title':'Annotate and present','text':'The drawing node keeps the active editor in both views. Alt+Shift+O toggles click-through. Alt+F fills an overlay inside Comfy; Alt+P hides graph/code and Alt+Shift+Z hides the outer Comfy shell. Native browser fullscreen remains separate.', 'target':{'nodeType':'GeneretiDrawing','part':'preview'}}]}
view_lesson=node('GeneretiDatLesson',4,'run this mini guide',(0,740),(700,540));view_lesson['widgets_values']=[json.dumps(view_guide,ensure_ascii=False,indent=2),'Live']
write(FLOWS/'ꘇ-Interactive-Output-Views.json',workflow([p5,md,draw,view_lesson]))
catalog=json.loads((LESSONS/'catalog.json').read_text());catalog=[g for g in catalog if g['id'] not in {authoring['id'],view_guide['id']}]+[authoring,view_guide]
write(LESSONS/'catalog.json',catalog)
write(LESSONS/'views.json',workflow([p5,md,draw,view_lesson]))
print('Built tutorial-authoring and interactive-output demos')
