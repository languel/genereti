// The homunculus as a picker: click the joints a region listens to. The body on the left (pose landmarks), a hand on the right
// (hands.* matches whichever hand is found). The selection is a list of landmark specs, also editable as text.
import { bodyFigure, handFigure } from '../core/homunculus.js';
import { h, text } from './dom.js';

function figureSvg(figure, viewBox, onPick) {
  const svg = h('svg:svg', { viewBox, preserveAspectRatio: 'xMidYMid meet' });
  const lines = figure.edges.map(([a, b]) => h('svg:line', { x1: figure.joints[a].u, y1: -figure.joints[a].v, x2: figure.joints[b].u, y2: -figure.joints[b].v }));
  const dots = figure.joints.map(j => {
    const c = h('svg:circle', { cx: j.u, cy: -j.v, r: 0.055, 'data-id': j.id });
    c.append(h('svg:title', {}, j.id));
    c.addEventListener('click', () => onPick(j.id));
    return c;
  });
  svg.append(...lines, ...dots);
  return { svg, dots };
}

export function landmarkPicker(onChange) {
  let points = [];
  const body = figureSvg(bodyFigure(), '-1.45 -2.3 2.9 4.35', id => toggle(id));
  const hand = figureSvg(handFigure(), '-1.1 -1.5 2.2 1.75', id => toggle(id));
  const input = text('', value => { points = value.split(/\s+/).filter(Boolean); paint(); onChange(points); }, { title: 'Landmarks, separated by spaces. * matches any: hands.*.index_tip, pose.*_wrist is not supported; virtual.name for a virtual point.', className: 'grow' });
  input.style.width = '100%';
  const toggle = id => {
    points = points.includes(id) ? points.filter(p => p !== id) : [...points, id];
    paint();
    onChange(points);
  };
  const paint = () => {
    for (const dot of [...body.dots, ...hand.dots]) dot.classList.toggle('sel', points.includes(dot.getAttribute('data-id')));
    if (document.activeElement !== input) input.value = points.join(' ');
  };
  const el = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, h('div', { class: 'mm-picker' }, body.svg, hand.svg), input);
  return { el, set(next) { points = [...next]; paint(); } };
}
