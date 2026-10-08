import {icon} from './icons.js';
import {installMonitor} from './performance.js';
// Move the existing control nodes into native Excalidraw panels once, retaining
// their IDs, event handlers, presets, capture and export contracts.
const parking=document.getElementById('hostControlsParking');
// Dialogs need a visible ancestor even while legacy engine canvases are parked.
document.body.append(document.getElementById('helpDialog'));
const panel=document.createElement('div');panel.className='host-panel';
const input=document.querySelector('.surface:not(.output-surface)');
input.querySelector('#drawingHost').hidden=true;
input.querySelector('#expandDrawing').hidden=true;
const controls=document.querySelector('.controls');
const capture=document.createElement('details');capture.innerHTML='<summary>Capture & export</summary>';
capture.append(document.querySelector('.output-actions'));
capture.querySelector('#full').textContent='Fullscreen workspace';
capture.querySelector('#full').title='Maximize the Excalidraw workspace; use the output arrow for a clean projector view';
const metrics=document.querySelector('.output-surface .surface-head');
const heading=document.createElement('div');heading.className='host-metrics';heading.append(document.getElementById('model'),metrics.querySelector('.stats')||metrics.lastElementChild);
const footer=document.querySelector('footer');
const view=document.createElement('details');view.className='host-output-view';
view.innerHTML='<summary>Output view</summary><label title="Lock the output over the input artboard; switch off to restore its previous placement"><input id="overlayOutput" type="checkbox" role="switch"> Draw over output</label><select id="overlayInputOrder" aria-label="Overlay input order" title="Choose whether raw input strokes are visible over the generated result"><option value="above">Input above output</option><option value="below">Input below output</option></select><label title="Composite the chosen Excalidraw frame, including live source and drawings"><input id="frameInputMode" type="checkbox" role="switch"> Frame input</label><select id="inputFrameSelect" aria-label="Input frame" hidden></select><label title="Show frame titles on the canvas"><input id="outputLabels" type="checkbox" role="switch"> Frame labels</label>';
panel.append(input,heading,view,controls,capture);installMonitor(panel);panel.append(footer);
parking.append(panel);
const header=document.querySelector('header');header.className='host-header';
header.querySelector('.brand').remove();
const notice=document.createElement('span');notice.id='hostNotice';notice.hidden=true;notice.setAttribute('role','status');notice.innerHTML=icon('alert');header.querySelector('.header-actions').append(notice);
const status=header.querySelector('#status');status.textContent='';status.title='Connecting to local model';status.setAttribute('aria-label',status.title);status.tabIndex=0;
const run=header.querySelector('#run');run.innerHTML=icon('play');run.title='Start live generation (Alt + Space)';run.setAttribute('aria-label','Start live generation');run.setAttribute('aria-pressed','false');
const help=header.querySelector('#help');help.innerHTML=icon('help');help.title='Help';help.setAttribute('aria-label','Help');
const link=header.querySelector('a');link.innerHTML=icon('output');link.title='Open clean output / projector window';link.setAttribute('aria-label','Open clean output window');
const toolbar=document.getElementById('toolbar');
for(const [id,glyph,label] of [['theme','moon','Switch to dark mode (Shift + Alt + D)'],['stroke','stroke','Stroke color (S)'],['fill','fill','Fill color (G)'],['fit','fit','Fit workspace'],['open','open','Open drawing'],['drawingSave','save','Save drawing']]){const button=toolbar.querySelector('#'+id);button.innerHTML=icon(glyph);button.title=label;button.setAttribute('aria-label',label);}
const overlayButton=document.createElement('button');overlayButton.id='overlayOutputButton';overlayButton.title='Draw over output';overlayButton.setAttribute('aria-label','Draw over output');overlayButton.setAttribute('aria-pressed','false');overlayButton.innerHTML=icon('overlay');toolbar.append(overlayButton);
const live=toolbar.querySelector('#liveEdits'),liveLabel=live.closest('label');live.setAttribute('aria-label','Update while drawing');liveLabel.classList.add('host-live-toggle');liveLabel.title='Update while drawing';liveLabel.replaceChildren(live);liveLabel.insertAdjacentHTML('beforeend',icon('live'));
// These are native DOM controls inside a React canvas. Keep their pointer
// gestures out of Excalidraw's canvas handlers, which can remount Footer tunnels
// between pointerdown and pointerup and swallow the ensuing click.
for(const node of [panel,header,toolbar])for(const type of ['pointerdown','pointerup','mousedown','mouseup'])node.addEventListener(type,event=>event.stopPropagation());
window.generetiHostNodes={panel,header,toolbar,parking};
// The editor's file input is distinct from Genereti's media upload input.
document.getElementById('source').value='editor';
await import('./app.js');
document.getElementById('source').dispatchEvent(new Event('change',{bubbles:true}));
await import('/vendor/excalidraw/editor.js');
