// The inspector: what the selected region listens to (its tracker) and what it sends (its actions). It edits a copy of the
// region and hands every change to `commit`, which normalizes it and puts it in the score.
import { ACTION_TYPES, CURVES, TRIGGERS, VALUE_SOURCES, defaultAction, normalizeRegion } from '../core/score.js';
import { colorOf } from './stage.js';
import { h, noteName, num, select, text } from './dom.js';
import { landmarkPicker } from './picker.js';

const GLYPH = { midiNote: '♪', midiCc: '◐', osc: 'osc', ws: 'ws', event: '⚡' };
const TYPE_TITLE = { midiNote: 'MIDI note', midiCc: 'MIDI control change', osc: 'OSC message', ws: 'WebSocket message', event: 'Genereti event (livecode: __.events)' };
const TRIGGER_TITLE = {
  enter: 'once, when a landmark enters', exit: 'once, when it leaves', enterExit: 'on while inside (note on, then off)',
  inside: 'continuously while inside, at the rate below', hit: 'on entering, if the landmark was moving fast enough',
};
const SOURCE_TITLE = {
  constant: 'a fixed number', x: 'where the landmark is across the region (0–1)', y: 'where it is down the region (0–1)',
  distance: 'distance from the region’s edge, in region size', speed: 'how fast the landmark moves (heights, or torso lengths, per second)',
  depth: 'landmark depth (z)', coverage: 'how much of a coverage region the mask fills (0–1)',
};

/** A value: a constant, or a landmark measure mapped from a range to a range. */
function valueEditor(spec, onChange, { sources = VALUE_SOURCES } = {}) {
  const value = typeof spec === 'number' ? { source: 'constant', value: spec } : spec ?? { source: 'constant', value: 0 };
  const box = h('div', { class: 'mm-value' });
  const set = patch => onChange({ ...value, ...patch });
  box.append(select(value.source, sources, source => {
    const next = { ...value, source };
    if (source === 'constant') next.value = next.value ?? value.out?.[1] ?? 0;
    if (source === 'speed' && value.source !== 'speed') next.in = [0, 3];
    onChange(next);
  }, { title: SOURCE_TITLE[value.source] }));
  if (value.source === 'constant') {
    box.append(num(value.value ?? 0, v => set({ value: v }), { step: 'any' }));
  } else {
    const range = (key, label, title) => {
      const [a, b] = value[key];
      box.append(h('span', { class: 'mm-muted', title }, label), num(a, v => set({ [key]: [v, value[key][1]] }), { step: 'any' }), num(b, v => set({ [key]: [value[key][0], v] }), { step: 'any' }));
    };
    range('in', 'in', 'the measure’s range');
    range('out', '→', 'mapped to this range');
    box.append(select(value.curve ?? 'linear', CURVES, curve => set({ curve }), { title: 'curve' }));
  }
  return box;
}

const field = (label, control, title) => h('div', { class: 'mm-row', title }, h('label', {}, label), control);

function actionCard(action, index, region, mutate, restructure) {
  const set = patch => mutate(r => Object.assign(r.actions[index], patch));
  const head = h('div', { class: 'mm-row' },
    h('b', { title: TYPE_TITLE[action.type] }, GLYPH[action.type]),
    select(action.trigger, TRIGGERS, trigger => set({ trigger }), { title: TRIGGER_TITLE[action.trigger] }),
    h('span', { class: 'grow' }),
    h('input', { type: 'checkbox', checked: action.enabled !== false, title: 'on', onChange: e => { set({ enabled: e.target.checked }); restructure(); } }),
    h('button', { title: 'remove', onClick: () => { mutate(r => r.actions.splice(index, 1)); restructure(); } }, '×'));
  const body = [];
  const showsSpeed = action.trigger === 'hit';
  switch (action.type) {
    case 'midiNote': {
      const name = h('span', { class: 'mm-muted' }, noteName(action.note));
      body.push(
        h('div', { class: 'mm-row' },
          h('label', { title: 'MIDI channel' }, 'ch'), num(action.channel, channel => set({ channel }), { min: 1, max: 16 }),
          h('label', { title: 'note number' }, 'note'), num(action.note, note => { set({ note }); name.textContent = noteName(note); }, { min: 0, max: 127 }), name,
          h('label', { title: 'note length in ms; 0 holds the note until the landmark leaves' }, 'len'), num(action.length_ms, length_ms => set({ length_ms }), { min: 0, step: 10 })),
        field('vel', valueEditor(action.velocity, velocity => { set({ velocity }); restructure(); }), 'velocity'),
      );
      break;
    }
    case 'midiCc':
      body.push(
        h('div', { class: 'mm-row' }, h('label', {}, 'ch'), num(action.channel, channel => set({ channel }), { min: 1, max: 16 }), h('label', {}, 'cc'), num(action.cc, cc => set({ cc }), { min: 0, max: 127 })),
        field('value', valueEditor(action.value, value => { set({ value }); restructure(); }), 'control value'),
      );
      break;
    case 'osc':
      body.push(
        field('addr', text(action.address, address => set({ address }), { title: '{region} is replaced by the region’s name', className: 'grow' })),
        ...action.args.map((arg, i) => h('div', { class: 'mm-row' },
          typeof arg === 'string' ? text(arg, v => mutate(r => { r.actions[index].args[i] = v; })) : valueEditor(arg, v => { mutate(r => { r.actions[index].args[i] = v; }); restructure(); }, { sources: VALUE_SOURCES }),
          h('button', { title: 'remove argument', onClick: () => { mutate(r => r.actions[index].args.splice(i, 1)); restructure(); } }, '×'))),
        h('button', { title: 'add an argument', onClick: () => { mutate(r => r.actions[index].args.push({ source: 'x', in: [0, 1], out: [0, 1], curve: 'linear' })); restructure(); } }, '+ arg'),
      );
      break;
    case 'ws':
      body.push(
        ...Object.entries(action.fields).map(([key, v]) => h('div', { class: 'mm-row' },
          text(key, next => { mutate(r => { const f = r.actions[index].fields; const val = f[key]; delete f[key]; f[next] = val; }); restructure(); }, { title: 'field name', className: 'grow' }),
          typeof v === 'string' ? text(v, next => mutate(r => { r.actions[index].fields[key] = next; })) : valueEditor(v, next => { mutate(r => { r.actions[index].fields[key] = next; }); restructure(); }),
          h('button', { title: 'remove field', onClick: () => { mutate(r => { delete r.actions[index].fields[key]; }); restructure(); } }, '×'))),
        h('button', { title: 'add a field to the message (x, y, distance, speed are always sent)', onClick: () => { mutate(r => { r.actions[index].fields[`field${Object.keys(r.actions[index].fields).length + 1}`] = { source: 'x', in: [0, 1], out: [0, 1], curve: 'linear' }; }); restructure(); } }, '+ field'),
      );
      break;
    case 'event':
      body.push(field('name', text(action.name, name => set({ name }), { title: 'livecode: __.events.on(name, …)', className: 'grow' })));
      break;
    default: break;
  }
  const timing = h('div', { class: 'mm-row' },
    h('label', { title: 'ignore triggers closer than this (ms)' }, 'cooldown'), num(action.cooldown_ms, cooldown_ms => set({ cooldown_ms }), { min: 0, step: 10 }),
    action.trigger === 'inside' ? [h('label', { title: 'minimum time between continuous messages (ms)' }, 'rate'), num(action.rate_ms, rate_ms => set({ rate_ms }), { min: 10, step: 10 })] : null,
    showsSpeed ? [h('label', { title: 'least speed for a hit (heights per second)' }, 'min speed'), num(action.min_speed, min_speed => set({ min_speed }), { min: 0, step: 0.05 })] : null);
  return h('div', { class: `mm-card${action.enabled === false ? ' off' : ''}` }, head, ...body, timing);
}

export function createInspector({ commit, remove }) {
  const el = h('div', { class: 'mm-side-inspector', style: { display: 'flex', flexDirection: 'column', gap: '6px' } });
  const picker = landmarkPicker(points => mutate(r => { r.tracker.points = points; }));
  let region = null, ctx = { regions: [], select() {} };

  /** Edit a copy and commit it; the form is redrawn only when the structure changes (`restructure`). */
  function mutate(fn) {
    if (!region) return;
    const draft = structuredClone(region);
    fn(draft);
    try { region = normalizeRegion(draft); } catch (error) { return; }
    commit(region);
  }
  const restructure = () => render();

  function render() {
    el.replaceChildren();
    if (!region) {
      el.append(h('div', { class: 'mm-muted', style: { padding: '8px' } }, '◌'));
      return;
    }
    const r = region;
    const head = h('div', { class: 'mm-card' },
      h('div', { class: 'mm-row' },
        h('i', { style: { width: '10px', height: '10px', borderRadius: '50%', background: colorOf(r), display: 'inline-block' } }),
        text(r.name, name => { mutate(d => { d.name = name; }); }, { className: 'grow', title: 'name; also the default event and OSC name' }),
        h('input', { type: 'checkbox', checked: r.enabled, title: 'on', onChange: e => mutate(d => { d.enabled = e.target.checked; }) }),
        h('button', { title: 'forget this region’s settings (the drawing stays)', onClick: () => remove?.(r.id) }, '⌫')),
      h('div', { class: 'mm-row' },
        select(r.space, [['image', 'image'], ['body', 'body'], ['hand.0', 'hand 1'], ['hand.1', 'hand 2']], space => { mutate(d => { d.space = space; }); }, { title: 'image: fixed on the picture. body / hand: follows the person’s torso or hand' }),
        select(r.tracker.kind, [['point', 'landmarks'], ['coverage', 'mask']], kind => { mutate(d => { d.tracker.kind = kind; }); restructure(); }, { title: 'landmarks: points on the body trigger it. mask: the silhouette filling the region (needs a mask)' })));
    const tracker = h('div', { class: 'mm-card' });
    if (r.tracker.kind === 'point') {
      picker.set(r.tracker.points);
      tracker.append(picker.el);
      tracker.append(h('div', { class: 'mm-row' },
        h('label', { title: 'ignore landmarks less visible than this' }, 'conf'), num(r.tracker.min_confidence, v => mutate(d => { d.tracker.min_confidence = v; }), { min: 0, max: 1, step: 0.05 }),
        h('label', { title: 'how far past the edge a landmark must go to leave, in region units' }, 'margin'), num(r.tracker.hysteresis, v => mutate(d => { d.tracker.hysteresis = v; }), { min: 0, max: 1, step: 0.005 }),
        h('label', { title: 'time inside before it counts (ms)' }, 'dwell'), num(r.tracker.dwell_ms, v => mutate(d => { d.tracker.dwell_ms = v; }), { min: 0, step: 10 })));
    } else {
      tracker.append(h('div', { class: 'mm-row' },
        h('label', { title: 'fraction of the region the silhouette must fill' }, 'fill'), num(r.tracker.threshold, v => mutate(d => { d.tracker.threshold = v; }), { min: 0, max: 1, step: 0.05 }),
        h('label', {}, 'dwell'), num(r.tracker.dwell_ms, v => mutate(d => { d.tracker.dwell_ms = v; }), { min: 0, step: 10 })));
    }
    const adders = h('div', { class: 'mm-row' }, ACTION_TYPES.map(type => h('button', {
      title: `add: ${TYPE_TITLE[type]}`,
      onClick: () => { mutate(d => { d.actions.push(defaultAction(type, d.name)); }); restructure(); },
    }, `+ ${GLYPH[type]}`)));
    el.append(head, tracker, ...r.actions.map((a, i) => actionCard(a, i, r, mutate, restructure)), adders);
  }

  return {
    el,
    /** Show a region (a copy). Called again for the same region after outside changes: the form is only redrawn when it differs. */
    show(next, context) {
      ctx = context ?? ctx;
      const same = next && region && next.id === region.id && JSON.stringify(next) === JSON.stringify(region);
      region = next ? structuredClone(next) : null;
      if (!same) render();
    },
  };
}
