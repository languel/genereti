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
panel.append(input,heading,controls,capture,footer);
parking.append(panel);
const header=document.querySelector('header');header.className='host-header';
header.querySelector('.brand').remove();
const notice=document.createElement('span');notice.id='hostNotice';notice.hidden=true;notice.setAttribute('role','status');header.querySelector('.header-actions').append(notice);
const link=header.querySelector('a');link.textContent='↗';link.title='Open clean output / projector window';link.setAttribute('aria-label','Open clean output window');
window.generetiHostNodes={panel,header,toolbar:document.getElementById('toolbar'),parking};
// The editor's file input is distinct from Genereti's media upload input.
document.getElementById('source').value='editor';
await import('./app.js');
document.getElementById('source').dispatchEvent(new Event('change',{bubbles:true}));
await import('/vendor/excalidraw/editor.js');
