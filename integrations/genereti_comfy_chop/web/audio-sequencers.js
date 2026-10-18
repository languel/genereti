// Step-sequencer panels: a drum grid and a piano roll. The node's `pattern` widget stays the source of truth
// (plain text), so patterns can be linked, copied and diffed; the canvases only edit that string.
import {segmented, knob, row, group, panelRoot, assemble, el, hiDPI, observe, color, alpha, setValue, getValue} from './audio-ui.js';
import {parseDrumPattern, formatDrumPattern, resizeRows, DRUM_ROWS, DRUM_LEVEL, parseNotePattern, formatNotePattern, noteName, isBlackKey, pitchWindow, snapToScale, clamp} from './audio-ui-core.js';

const DIVISIONS = [{value: 1, label: '¼', title: 'quarter notes'}, {value: 2, label: '⅛', title: 'eighth notes'}, {value: 3, label: '⅛t', title: 'eighth triplets'}, {value: 4, label: '1/16', title: 'sixteenth notes'}, {value: 6, label: '1/16t', title: 'sixteenth triplets'}, {value: 8, label: '1/32', title: 'thirty-second notes'}];
const LENGTHS = [8, 12, 16, 24, 32, 64];
const DEFAULT_DRUMS = 'kick:1000100010001000;snare:0000100000001000;hat:1010101010101010';
const button = (label, title, onclick) => { const b = el('button', {className: 'gap-btn', textContent: label, title, onclick}); b.type = 'button'; b.setAttribute('aria-label', title); b.onpointerdown = e => e.stopPropagation(); return b; };
const lengthButtons = (current, set) => {
  const wrap = el('div', {className: 'gap-seg', title: 'Pattern length in steps'}); wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', 'Pattern length');
  const bs = LENGTHS.map(n => { const b = el('button', {textContent: String(n), title: `${n} steps`}); b.type = 'button'; b.onclick = () => set(n); b.onpointerdown = e => e.stopPropagation(); wrap.append(b); return [n, b]; });
  return {el: wrap, refresh() { const c = current(); for (const [n, b] of bs) b.setAttribute('aria-pressed', String(n === c)); }};
};

/** Shared grid mechanics: paint a value over cells while dragging, with the first cell deciding paint vs erase. */
function paintDrag(canvas, locate, onStart, onCell, onEnd) {
  let drag = null;
  canvas.onpointerdown = e => {
    if (e.button !== 0) return; e.stopPropagation();
    const r = canvas.getBoundingClientRect(), hit = locate(e.clientX - r.left, e.clientY - r.top); if (!hit) return;
    canvas.setPointerCapture(e.pointerId); canvas.focus();
    drag = onStart(hit, e); if (drag) onCell(hit, drag, e);
  };
  canvas.onpointermove = e => {
    if (!drag) return; const r = canvas.getBoundingClientRect(), hit = locate(e.clientX - r.left, e.clientY - r.top, true);
    if (hit) onCell(hit, drag, e);
  };
  canvas.onpointerup = canvas.onpointercancel = () => { if (drag) onEnd?.(drag); drag = null; };
}

// ---- Drum grid ----
export function drumSequencerPanel({node, resize}) {
  const root = panelRoot(), parts = [];
  const add = c => { parts.push(c); return c.el; };
  let rows = [], error = '', playhead = -1, last = '';
  const ROW_H = 22, LABEL_W = 58;
  const canvas = el('canvas', {className: 'gap-plot', tabIndex: 0, title: 'Click or drag to draw hits · Shift: accent · Alt: ghost · row name: mute · right-click name: remove'});
  canvas.style.cursor = 'crosshair'; canvas.style.touchAction = 'none';
  const read = () => { try { rows = parseDrumPattern(String(getValue(node, 'pattern', DEFAULT_DRUMS))); error = ''; } catch (e) { error = e.message; } };
  const write = () => { const text = formatDrumPattern(rows); setValue(node, 'pattern', text); last = null; draw(); };
  const stepCount = () => rows[0]?.steps.length ?? 16;
  const geometry = () => { const w = Math.max(200, canvas.getBoundingClientRect().width || 400), n = stepCount(); return {w, n, cw: (w - LABEL_W) / n}; };
  const height = () => rows.length * ROW_H + 6;
  const draw = () => {
    read(); const {w, n, cw} = geometry(), h = height(), key = JSON.stringify([getValue(node, 'pattern', ''), w, playhead, error]); if (key === last) return; last = key;
    panel.height = h + 108;
    const g = hiDPI(canvas, w, h), c = color(canvas);
    if (error) { g.fillStyle = alpha(c, .7); g.font = '11px system-ui'; g.fillText(error, 8, 16); return; }
    g.font = '10px system-ui'; g.textBaseline = 'middle';
    rows.forEach((r, ri) => {
      const y = 3 + ri * ROW_H;
      g.fillStyle = alpha(c, r.muted ? .3 : .75); g.textAlign = 'left'; g.fillText(r.name + (r.muted ? ' ✕' : ''), 4, y + ROW_H / 2);
      for (let i = 0; i < n; i++) {
        const x = LABEL_W + i * cw, v = r.steps[i], beat = i % 4 === 0;
        g.fillStyle = alpha(c, beat ? .1 : .05); g.fillRect(x + 1, y + 1, cw - 2, ROW_H - 2);
        if (i === playhead) { g.fillStyle = alpha(c, .13); g.fillRect(x + 1, y + 1, cw - 2, ROW_H - 2); }
        if (v) {
          const level = {1: .72, 2: 1, 3: .3}[v], inset = v === 3 ? 6 : 3;
          g.fillStyle = alpha(c, r.muted ? level * .35 : level); g.fillRect(x + 2, y + inset, cw - 4, ROW_H - inset * 2);
          if (v === 2) { g.fillStyle = alpha(c, .9); g.fillRect(x + 2, y + 1, cw - 4, 2); }
        }
      }
    });
    if (playhead >= 0) { g.fillStyle = alpha(c, .35); g.fillRect(LABEL_W + playhead * cw, 1, cw, 2); }
  };
  const locate = (x, y, clampToGrid) => {
    const {n, cw} = geometry(), ri = Math.floor((y - 3) / ROW_H);
    if (ri < 0 || ri >= rows.length) return clampToGrid && drag0 ? {ri: drag0.ri, i: clamp(Math.floor((x - LABEL_W) / cw), 0, n - 1)} : null;
    if (x < LABEL_W) return clampToGrid ? null : {ri, label: true};
    return {ri, i: clamp(Math.floor((x - LABEL_W) / cw), 0, n - 1)};
  };
  let drag0 = null;
  paintDrag(canvas, locate, (hit, e) => {
    if (hit.label) { rows[hit.ri].muted = !rows[hit.ri].muted; write(); return null; }
    const cur = rows[hit.ri].steps[hit.i], want = e.shiftKey ? 2 : e.altKey ? 3 : 1;
    drag0 = {ri: hit.ri, value: cur === want ? 0 : want}; return drag0;
  }, (hit, d) => {
    if (hit.label) return;
    const from = d.prev ?? hit.i; let changed = false;
    for (let i = Math.min(from, hit.i); i <= Math.max(from, hit.i); i++) if (rows[hit.ri].steps[i] !== d.value) { rows[hit.ri].steps[i] = d.value; changed = true; }
    d.prev = hit.i; if (changed) write();
  }, () => { drag0 = null; });
  canvas.oncontextmenu = e => {
    e.preventDefault(); e.stopPropagation();
    const r = canvas.getBoundingClientRect(), ri = Math.floor((e.clientY - r.top - 3) / ROW_H);
    if (e.clientX - r.left < LABEL_W && ri >= 0 && ri < rows.length && rows.length > 1) { rows.splice(ri, 1); write(); resize?.(); }
  };

  const clear = () => { for (const r of rows) r.steps.fill(0); write(); };
  const randomize = () => {
    const density = Number(node.properties?.genereti_density ?? .3);
    for (const r of rows) {
      const base = r.name === 'kick' ? .22 : r.name === 'hat' || r.name === 'openhat' ? .5 : .18;
      r.steps = r.steps.map((_, i) => Math.random() < (i % 4 === 0 ? Math.min(.9, base + density) : base * density * 2) ? (Math.random() < .15 ? 2 : Math.random() < .12 ? 3 : 1) : 0);
    }
    write();
  };
  const rotate = d => { for (const r of rows) { const n = r.steps.length; r.steps = r.steps.map((_, i) => r.steps[(i - d + n) % n]); } write(); };
  const addRow = el('select', {title: 'Add a drum row'}); addRow.className = 'gap-btn'; addRow.style.cssText += ';font:inherit;color:inherit;background:transparent;border:0;padding:3px';
  const refreshAdd = () => { addRow.replaceChildren(el('option', {value: '', textContent: '+ row'})); for (const name of Object.keys(DRUM_ROWS)) if (!rows.some(r => r.name === name)) addRow.append(el('option', {value: name, textContent: name})); addRow.style.display = rows.length >= 16 || addRow.options.length < 2 ? 'none' : ''; };
  addRow.onchange = () => { if (addRow.value) { rows.push({name: addRow.value, note: DRUM_ROWS[addRow.value], steps: Array(stepCount()).fill(0), muted: false}); write(); resize?.(); } addRow.value = ''; };
  addRow.onpointerdown = e => e.stopPropagation();
  const length = lengthButtons(stepCount, n => { rows = resizeRows(rows, n); write(); });
  const bar = row(add(segmented(node, {name: 'division', title: 'Step length', options: DIVISIONS})), add(length), button('↺', 'Rotate left', () => rotate(-1)), button('↻', 'Rotate right', () => rotate(1)), button('⚄', 'Randomize', randomize), button('✕', 'Clear', clear), addRow,
    add(knob(node, {name: 'velocity', label: 'level', min: 0, max: 1, size: 26, step: .01})));
  bar.style.alignItems = 'center';
  root.append(bar, canvas);
  observe(canvas, () => { last = null; draw(); });
  const panel = {...assemble(root, parts), height: 150, width: 470, paint(step) { if (step !== playhead) { playhead = step; draw(); } }, refresh() { for (const c of parts) c.refresh?.(); draw(); refreshAdd(); }};
  read(); panel.height = height() + 108; refreshAdd(); queueMicrotask(draw);
  return panel;
}

// ---- Piano roll (monophonic note sequence) ----
export function noteSequencerPanel({node}) {
  const root = panelRoot(), parts = [];
  const add = c => { parts.push(c); return c.el; };
  let steps = [], error = '', playhead = -1, last = '', win = {low: 48, high: 71};
  const LABEL_W = 34, ROW_H = 9;
  const canvas = el('canvas', {className: 'gap-plot', tabIndex: 0, title: 'Click or drag to draw notes · Alt or right-click: rest · wheel: scroll pitch'});
  canvas.style.cursor = 'crosshair'; canvas.style.touchAction = 'none';
  const read = () => { try { steps = parseNotePattern(String(getValue(node, 'pattern', '60'))); error = ''; } catch (e) { error = e.message; } };
  const write = () => { setValue(node, 'pattern', formatNotePattern(steps)); last = null; draw(); };
  const music = () => window.generetiPerformance?.document?.music;
  const snapOn = () => node.properties?.genereti_snap_scale === true;
  const pitches = () => win.high - win.low + 1;
  const geometry = () => { const w = Math.max(220, canvas.getBoundingClientRect().width || 420), n = steps.length || 16; return {w, n, cw: (w - LABEL_W) / n}; };
  const height = () => Math.min(pitches(), 36) * ROW_H + 4;
  const draw = () => {
    read(); const {w, n, cw} = geometry(), key = JSON.stringify([getValue(node, 'pattern', ''), w, playhead, error, win, snapOn()]); if (key === last) return; last = key;
    const h = height(), g = hiDPI(canvas, w, h), c = color(canvas);
    if (error) { g.fillStyle = alpha(c, .7); g.font = '11px system-ui'; g.fillText(error, 8, 16); return; }
    const rowsN = Math.min(pitches(), 36), top = win.high; g.font = '8px system-ui'; g.textBaseline = 'middle';
    for (let r = 0; r < rowsN; r++) {
      const p = top - r, y = 2 + r * ROW_H;
      g.fillStyle = alpha(c, isBlackKey(p) ? .09 : .035); g.fillRect(LABEL_W, y, w - LABEL_W, ROW_H);
      if (p % 12 === 0) { g.fillStyle = alpha(c, .55); g.textAlign = 'left'; g.fillText(noteName(p), 3, y + ROW_H / 2); g.fillStyle = alpha(c, .15); g.fillRect(LABEL_W, y + ROW_H - .5, w - LABEL_W, 1); }
    }
    for (let i = 0; i < n; i++) { const x = LABEL_W + i * cw; if (i % 4 === 0) { g.fillStyle = alpha(c, .1); g.fillRect(x, 2, 1, rowsN * ROW_H); } if (i === playhead) { g.fillStyle = alpha(c, .12); g.fillRect(x, 2, cw, rowsN * ROW_H); } }
    steps.forEach((p, i) => { if (p < win.low || p > win.high) { if (p >= 0) { g.fillStyle = alpha(c, .5); g.fillRect(LABEL_W + i * cw + 1, p > win.high ? 0 : h - 2, cw - 2, 2); } return; } const y = 2 + (top - p) * ROW_H; g.fillStyle = c; g.fillRect(LABEL_W + i * cw + 1, y + 1, cw - 2, ROW_H - 2); });
    g.fillStyle = alpha(c, .4); g.font = '9px system-ui'; g.textAlign = 'left';
  };
  const locate = (x, y, clampToGrid) => {
    const {n, cw} = geometry(), i = Math.floor((x - LABEL_W) / cw); if (!clampToGrid && (x < LABEL_W || i < 0 || i >= n)) return null;
    const rowsN = Math.min(pitches(), 36), r = clamp(Math.floor((y - 2) / ROW_H), 0, rowsN - 1);
    return {i: clamp(i, 0, n - 1), pitch: win.high - r};
  };
  const place = (hit, d) => {
    const m = music(), from = d.prev ?? hit; let changed = false;
    const lo = Math.min(from.i, hit.i), hi = Math.max(from.i, hit.i);
    for (let i = lo; i <= hi; i++) {
      const t = hi === lo ? 1 : (i - from.i) / (hit.i - from.i), raw = Math.round(from.pitch + (hit.pitch - from.pitch) * (hit.i === from.i ? 1 : t));
      const pitch = d.rest ? -1 : snapOn() && m ? snapToScale(raw, m.root ?? 0, m.degrees) : raw;
      if (steps[i] !== pitch) { steps[i] = pitch; changed = true; }
    }
    d.prev = hit; if (changed) write();
  };
  paintDrag(canvas, locate, (hit, e) => { const m = music(), pitch = snapOn() && m ? snapToScale(hit.pitch, m.root ?? 0, m.degrees) : hit.pitch; return {rest: e.altKey || steps[hit.i] === pitch}; }, place);
  canvas.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); const r = canvas.getBoundingClientRect(), hit = locate(e.clientX - r.left, e.clientY - r.top); if (hit) { steps[hit.i] = -1; write(); } };
  canvas.onwheel = e => { e.preventDefault(); e.stopPropagation(); shiftWindow(Math.sign(e.deltaY) * -3); };
  const shiftWindow = d => { const span = win.high - win.low; win = {low: clamp(win.low + d, 0, 127 - span), high: clamp(win.low + d, 0, 127 - span) + span}; last = null; draw(); };

  const transpose = d => { steps = steps.map(p => p < 0 ? p : clamp(p + d, 0, 127)); win = pitchWindow(steps, pitches()); write(); };
  const randomize = () => {
    const m = music(), root = m?.root ?? 0, degrees = m?.degrees ?? [0, 2, 3, 5, 7, 8, 10], span = [win.low + 6, Math.min(win.high - 2, win.low + 18)];
    let prev = 0;
    steps = steps.map((_, i) => { if (Math.random() < (i % 4 === 0 ? .1 : .3)) return -1; const raw = Math.round(span[0] + Math.random() * (span[1] - span[0]) * .5 + prev * .5); prev = (raw - span[0]) / Math.max(1, span[1] - span[0]); return snapToScale(raw, root, degrees); });
    write();
  };
  const resizeSteps = n => { const old = steps; steps = Array.from({length: n}, (_, i) => old[i % old.length] ?? -1); write(); };
  const length = lengthButtons(() => steps.length, resizeSteps);
  const snapBtn = button('♯', 'Snap drawn notes to the project scale', () => { node.properties ??= {}; node.properties.genereti_snap_scale = !snapOn(); snapBtn.setAttribute('aria-pressed', String(snapOn())); last = null; draw(); });
  const bar = row(add(segmented(node, {name: 'division', title: 'Step length', options: DIVISIONS})), add(length),
    button('−12', 'Down an octave', () => transpose(-12)), button('−1', 'Down a semitone', () => transpose(-1)), button('+1', 'Up a semitone', () => transpose(1)), button('+12', 'Up an octave', () => transpose(12)),
    button('⇄', 'Reverse', () => { steps.reverse(); write(); }), button('⚄', 'Randomize within the project scale', randomize), button('✕', 'Clear', () => { steps = steps.map(() => -1); write(); }), snapBtn,
    add(knob(node, {name: 'gate', label: 'gate', min: .05, max: .95, size: 26, step: .01})), add(knob(node, {name: 'velocity', label: 'vel', min: 0, max: 1, size: 26, step: .01})));
  bar.style.alignItems = 'center';
  root.append(bar, canvas);
  observe(canvas, () => { last = null; draw(); });
  const panel = {...assemble(root, parts), height: 330, width: 520, paint(step) { if (step !== playhead) { playhead = step; draw(); } },
    refresh() { for (const c of parts) c.refresh?.(); snapBtn.setAttribute('aria-pressed', String(snapOn())); const text = String(getValue(node, 'pattern', '')); if (text !== panel._text) { panel._text = text; read(); if (!error) { const used = steps.filter(p => p >= 0); if (used.some(p => p < win.low || p > win.high)) win = pitchWindow(steps); } } draw(); }};
  read(); win = pitchWindow(steps); panel.height = height() + 110; snapBtn.setAttribute('aria-pressed', String(snapOn())); queueMicrotask(draw);
  return panel;
}
