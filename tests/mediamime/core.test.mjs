import test from 'node:test';
import assert from 'node:assert/strict';
import { pointInPolygon, insideShape, shapeMetrics, ellipsePolygon, rectPolygon, polygonCentroid, cellsInside } from '../../integrations/genereti_comfy_mediamime/web/js/core/geometry.js';
import { bodyFrame, toFrame, fromFrame, resolvePoints } from '../../integrations/genereti_comfy_mediamime/web/js/core/frames.js';
import { resolveValue, restingValue } from '../../integrations/genereti_comfy_mediamime/web/js/core/values.js';
import { parseScore, defaultAction, regionsFromPoliplan, reconcile, simplify } from '../../integrations/genereti_comfy_mediamime/web/js/core/score.js';
import { RegionEngine, LOST_MS } from '../../integrations/genereti_comfy_mediamime/web/js/core/engine.js';
import { OutputHub, relayTransport, webMidi } from '../../integrations/genereti_comfy_mediamime/web/js/core/outputs.js';
import { puppetFrame, puppetFeatures, drumDance } from '../../integrations/genereti_comfy_mediamime/web/js/core/puppet.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const W = 640, H = 480;

const frame = (features, t) => ({ features, source: { id: 's', output_slot: 0, revision: 0, width: W, height: H, frame_timestamp_ms: t } });
const wrist = (x, y, extra = {}) => ({ 'pose.right_wrist.x': x, 'pose.right_wrist.y': y, 'pose.right_wrist.visibility': 1, ...extra });

const score = (regions, extra = {}) => parseScore({ version: 1, regions, ...extra });
const box = (id, x0, y0, x1, y1, more = {}) => ({ id, name: id, space: 'image', shape: { type: 'polygon', points: rectPolygon(x0, y0, x1, y1) }, tracker: { points: ['pose.right_wrist'], hysteresis: 0, ...more.tracker }, actions: more.actions ?? [] });

test('geometry: polygons, ellipses, strokes, metrics', () => {
  const sq = rectPolygon(0, 0, 1, 1);
  assert.ok(pointInPolygon(sq, 0.5, 0.5)); assert.ok(!pointInPolygon(sq, 1.5, 0.5));
  const ell = ellipsePolygon(0.5, 0.5, 0.2, 0.1);
  assert.ok(insideShape({ type: 'polygon', points: ell }, 0.5, 0.5)); assert.ok(!insideShape({ type: 'polygon', points: ell }, 0.5, 0.7));
  assert.ok(insideShape({ type: 'polyline', points: [[0, 0], [1, 0]], width: 0.1 }, 0.5, 0.04));
  assert.ok(!insideShape({ type: 'polyline', points: [[0, 0], [1, 0]], width: 0.1 }, 0.5, 0.2));
  assert.ok(insideShape({ type: 'polygon', points: sq }, 1.02, 0.5, 0.05));   // margin
  near(polygonCentroid(sq)[0], 0.5);
  const m = shapeMetrics({ type: 'polygon', points: rectPolygon(0.2, 0.2, 0.6, 0.4) }, 0.6, 0.3);
  near(m.nx, 1); near(m.ny, 0.5); assert.ok(m.dist > 0.8);
  assert.equal(cellsInside({ type: 'polygon', points: rectPolygon(0, 0, 0.5, 1) }, 4, 4).length, 8);
});

test('values: ranges, curves, constants, resting value', () => {
  near(resolveValue({ source: 'x', in: [0, 1], out: [0, 127] }, { nx: 0.5 }), 63.5);
  near(resolveValue({ source: 'speed', in: [0, 2], out: [10, 110], curve: 'exp' }, { speed: 1 }), 35);
  near(resolveValue({ source: 'speed', in: [0, 2], out: [0, 100] }, { speed: 9 }), 100);   // clamped
  assert.equal(resolveValue({ source: 'constant', value: 42 }, {}), 42);
  assert.equal(resolveValue(7, {}), 7);
  assert.equal(restingValue({ source: 'x', out: [5, 99] }), 5);
});

test('frames: the body frame follows the body', () => {
  const f = puppetFeatures({ cx: 0.5, cy: 0.6, scale: 0.2 }, W, H);
  const fr = bodyFrame(f, W, H);
  near(fr.scale, 0.2 * H, 1e-3);
  const [u, v] = toFrame(fr, f['pose.left_shoulder.x'], f['pose.left_shoulder.y']);
  near(u, 0.5, 1e-6); near(v, 1, 1e-6);
  const [x, y] = fromFrame(fr, 0.3, -0.4);
  const [u2, v2] = toFrame(fr, x, y);
  near(u2, 0.3, 1e-9); near(v2, -0.4, 1e-9);
  // tilted and moved: the same body coordinates, other image coordinates
  const g = puppetFeatures({ cx: 0.3, cy: 0.5, scale: 0.15, tilt: 0.4 }, W, H);
  const fg = bodyFrame(g, W, H);
  const [u3, v3] = toFrame(fg, g['pose.left_shoulder.x'], g['pose.left_shoulder.y']);
  near(u3, 0.5, 1e-6); near(v3, 1, 1e-6);
});

test('frames: landmark specs, wildcards and virtual points', () => {
  const f = puppetFeatures({ hands: true, left: [0.8, 0.3], right: [-0.8, 0.3] }, W, H);
  assert.equal(resolvePoints(f, 'pose.left_wrist').length, 1);
  assert.deepEqual(resolvePoints(f, 'hands.*.index_tip').map(p => p.id), ['hands.0.index_tip', 'hands.1.index_tip']);
  const v = resolvePoints(f, 'virtual.belly', { virtual: { belly: { type: 'mid', of: ['pose.left_hip', 'pose.right_hip'] } } });
  assert.equal(v.length, 1);
  near(v[0].x, (f['pose.left_hip.x'] + f['pose.right_hip.x']) / 2);
  assert.equal(resolvePoints({ ...f, 'pose.left_wrist.visibility': 0.1 }, 'pose.left_wrist').length, 0);   // not confident
});

test('engine: entry, inside, exit in the image', () => {
  const e = new RegionEngine(score([box('r', 0.4, 0.4, 0.6, 0.6)]));
  const log = [];
  [[0.1, 0.5], [0.45, 0.5], [0.5, 0.5], [0.9, 0.5]].forEach(([x, y], i) => { for (const ev of e.tick(frame(wrist(x, y), 100 + i * 33), 100 + i * 33).events) log.push(ev.phase); });
  assert.deepEqual(log, ['entry', 'exit']);
});

test('engine: dwell holds the entry back, hysteresis holds the exit', () => {
  const e = new RegionEngine(score([box('r', 0.4, 0.4, 0.6, 0.6, { tracker: { dwell_ms: 100, hysteresis: 0.05 } })]));
  const phases = [];
  const run = (x, t) => e.tick(frame(wrist(x, 0.5), t), t).events.forEach(ev => phases.push(`${ev.phase}@${t}`));
  run(0.5, 0); run(0.5, 50); run(0.5, 120);        // inside for 120 ms: entry once the dwell is up
  run(0.62, 150);                                  // just outside, within the margin: still inside
  run(0.7, 180);                                   // outside by more than the margin: exit
  assert.deepEqual(phases, ['entry@120', 'exit@180']);
  const brief = new RegionEngine(score([box('r', 0.4, 0.4, 0.6, 0.6, { tracker: { dwell_ms: 100 } })]));
  const p2 = [];
  [[0.5, 0], [0.5, 50], [0.1, 60], [0.5, 70], [0.1, 120]].forEach(([x, t]) => brief.tick(frame(wrist(x, 0.5), t), t).events.forEach(ev => p2.push(ev.phase)));
  assert.deepEqual(p2, []);                        // never stayed 100 ms
});

test('engine: notes pair on entry and exit, and a lost source never leaves one hanging', () => {
  const act = { ...defaultAction('midiNote'), trigger: 'enterExit', channel: 2, note: 64, velocity: { source: 'constant', value: 90 } };
  const e = new RegionEngine(score([box('r', 0.4, 0.4, 0.6, 0.6, { actions: [act] })]));
  const out = [];
  [[0.1, 0], [0.5, 33], [0.9, 66]].forEach(([x, t]) => out.push(...e.tick(frame(wrist(x, 0.5), t), t).messages));
  assert.deepEqual(out.map(m => [m.kind, m.phase, m.channel, m.note, m.velocity]), [['midiNote', 'on', 2, 64, 90], ['midiNote', 'off', 2, 64, 0]]);
  // lost: the wrist vanishes while inside
  const e2 = new RegionEngine(score([box('r', 0.4, 0.4, 0.6, 0.6, { actions: [act] })]));
  const on = e2.tick(frame(wrist(0.5, 0.5), 0), 1000).messages;
  assert.equal(on.length, 1);
  assert.equal(e2.tick(null, 1000 + LOST_MS - 10).messages.length, 0);
  const lost = e2.tick(null, 1000 + LOST_MS + 10);
  assert.deepEqual(lost.messages.map(m => [m.phase, m.note]), [['off', 64]]);
  assert.equal(lost.events[0].reason, 'lost');
  // release() ends anything still held
  const e3 = new RegionEngine(score([box('r', 0.4, 0.4, 0.6, 0.6, { actions: [act] })]));
  e3.tick(frame(wrist(0.5, 0.5), 0), 0);
  assert.equal(e3.release().length, 1); assert.equal(e3.release().length, 0);
});

test('engine: a hit needs speed, and the speed is the velocity', () => {
  const act = { ...defaultAction('midiNote'), trigger: 'hit', min_speed: 0.5, velocity: { source: 'speed', in: [0, 4], out: [20, 120] }, length_ms: 80, cooldown_ms: 0 };
  const run = xs => {
    const e = new RegionEngine(score([box('r', 0.4, 0.4, 0.6, 0.6, { actions: [act] })]));
    const out = [];
    xs.forEach((x, i) => out.push(...e.tick(frame(wrist(x, 0.5), i * 33), i * 33).messages));
    return out;
  };
  assert.equal(run([0.39, 0.3945, 0.399, 0.4035, 0.408]).length, 0);              // drifting in: no hit
  const fast = run([0.1, 0.2, 0.3, 0.45]);                                       // striking in
  assert.equal(fast.length, 1);
  assert.ok(fast[0].velocity > 60, `velocity ${fast[0].velocity}`);
  assert.equal(fast[0].length_ms, 80);
});

test('engine: cc follows the point inside, and rests at its minimum on exit', () => {
  const act = { ...defaultAction('midiCc'), trigger: 'enterExit', cc: 7, value: { source: 'x', in: [0, 1], out: [10, 110] } };
  const e = new RegionEngine(score([box('r', 0.4, 0.4, 0.6, 0.6, { actions: [act] })]));
  const msgs = [];
  [0.5, 0.58, 0.9].forEach((x, i) => msgs.push(...e.tick(frame(wrist(x, 0.5), i * 33), i * 33).messages));
  assert.deepEqual(msgs.map(m => [m.kind, m.cc, m.value]), [['midiCc', 7, 60], ['midiCc', 7, 10]]);
  const cont = { ...act, trigger: 'inside', rate_ms: 50 };
  const e2 = new RegionEngine(score([box('r', 0.4, 0.4, 0.6, 0.6, { actions: [cont] })]));
  const vals = [];
  [0.42, 0.45, 0.5, 0.55, 0.58].forEach((x, i) => e2.tick(frame(wrist(x, 0.5), i * 33), i * 33).messages.forEach(m => vals.push(m.value)));
  assert.ok(vals.length >= 2 && vals.length < 5, `${vals.length} messages at rate 50ms over 132ms`);
  assert.ok(vals.at(-1) > vals[0]);
});

test('engine: body-space regions travel with the body', () => {
  const belly = { id: 'belly', name: 'belly', space: 'body', shape: { type: 'polygon', points: ellipsePolygon(0, 0.45, 0.3, 0.25) }, tracker: { points: ['pose.right_wrist'], hysteresis: 0 }, actions: [{ ...defaultAction('event'), trigger: 'enterExit', name: 'belly' }] };
  const run = (state) => {
    const e = new RegionEngine(score([belly]));
    const phases = [];
    e.tick(puppetFrame({ ...state, right: [-0.95, -0.1] }, 0, W, H), 0);
    for (let k = 1; k <= 8; k++) { const f = e.tick(puppetFrame({ ...state, right: [-0.95 + (0.95 * k) / 4, -0.1 + (0.55 * k) / 4] }, k * 33, W, H), k * 33); f.events.forEach(ev => phases.push(ev.phase)); }
    return phases;
  };
  assert.deepEqual(run({ cx: 0.5, cy: 0.6, scale: 0.2 }), ['entry', 'exit']);        // the hand sweeps across the belly
  assert.deepEqual(run({ cx: 0.25, cy: 0.5, scale: 0.12, tilt: 0.5 }), ['entry', 'exit']);   // another place, size and tilt
});

test('engine: the drum dance plays the pads in order', () => {
  const dance = drumDance({ period: 400 });
  const pads = [
    ['belly', 0.0, 0.42, 36], ['thighL', 0.3, -0.5, 38], ['thighR', -0.3, -0.5, 40], ['chest', 0.0, 0.85, 42], ['shoulderL', 0.5, 1.02, 44], ['shoulderR', -0.5, 1.02, 46],
  ];
  const regions = pads.map(([id, u, v, note]) => ({
    id, name: id, space: 'body', shape: { type: 'polygon', points: ellipsePolygon(u, v, 0.2, 0.2) },
    tracker: { points: ['pose.left_wrist', 'pose.right_wrist'], hysteresis: 0.02 },
    actions: [{ ...defaultAction('midiNote'), trigger: 'hit', min_speed: 0.3, note, cooldown_ms: 100, length_ms: 60 }],
  }));
  const e = new RegionEngine(score(regions));
  const hits = [];
  for (let t = 0; t < 400 * 6; t += 20) {
    const w = dance.at(t);
    for (const m of e.tick(puppetFrame({ cx: 0.5, cy: 0.62, scale: 0.2, ...w }, t, W, H), t).messages) if (m.kind === 'midiNote') hits.push(m.note);
  }
  assert.deepEqual(hits, [36, 38, 40, 42, 44, 46]);
});

test('engine: mask coverage triggers a region', () => {
  const r = { id: 'c', name: 'c', space: 'image', shape: { type: 'polygon', points: rectPolygon(0, 0, 0.5, 1) }, tracker: { kind: 'coverage', threshold: 0.3, points: [] }, actions: [{ ...defaultAction('event'), trigger: 'enterExit', name: 'left half' }] };
  const e = new RegionEngine(score([r]));
  const mask = fill => ({ width: 8, height: 8, data: Uint8Array.from({ length: 64 }, (_, i) => (fill(i % 8, Math.floor(i / 8)) ? 255 : 0)) });
  const phases = [];
  [[() => false, 0], [x => x < 4, 33], [x => x < 4, 66], [() => false, 99]].forEach(([f, t]) => e.tick({ ...frame({}, t), mask: mask(f) }, t).events.forEach(ev => phases.push(ev.phase)));
  assert.deepEqual(phases, ['entry', 'exit']);
});

test('outputs: bytes, note lengths, retrigger, cc dedupe', () => {
  const sent = [], timers = [];
  const hub = new OutputHub({ midi: { send: b => sent.push(b) } }, { midi: { enabled: true } }, { set: (f, ms) => timers.push([f, ms]) || timers.length, clear: () => {} });
  hub.send([{ kind: 'midiNote', phase: 'on', channel: 3, note: 60, velocity: 100, length_ms: 80 }]);
  assert.deepEqual(sent, [[0x92, 60, 100]]);
  assert.equal(timers[0][1], 80);
  timers[0][0]();
  assert.deepEqual(sent.at(-1), [0x82, 60, 0]);
  hub.send([{ kind: 'midiNote', phase: 'on', channel: 1, note: 40, velocity: 90, length_ms: 500 }, { kind: 'midiNote', phase: 'on', channel: 1, note: 40, velocity: 95, length_ms: 500 }]);
  assert.deepEqual(sent.slice(-3), [[0x90, 40, 90], [0x80, 40, 0], [0x90, 40, 95]]);
  hub.send([{ kind: 'midiCc', channel: 1, cc: 1, value: 64 }, { kind: 'midiCc', channel: 1, cc: 1, value: 64 }, { kind: 'midiCc', channel: 1, cc: 1, value: 65 }]);
  assert.deepEqual(sent.slice(-2), [[0xb0, 1, 64], [0xb0, 1, 65]]);
  hub.releaseAll();
  assert.deepEqual(sent.at(-1), [0x80, 40, 0]);
  const off = new OutputHub({ midi: { send: b => sent.push(b) } }, { midi: { enabled: false } });
  const n = sent.length; off.send([{ kind: 'midiCc', channel: 1, cc: 2, value: 1 }]);
  assert.equal(sent.length, n);
});

test('outputs: osc and websocket go to the relay in a batch, events to perception', () => {
  const relayed = [], events = [], ws = [];
  const hub = new OutputHub({ relay: { send: m => relayed.push(...m) }, events: { emit: e => events.push(e) }, ws: { send: o => ws.push(o) } },
    { osc: { enabled: true, host: '127.0.0.1', port: 9000 }, ws: { enabled: true, url: 'ws://x' }, relay: { enabled: true }, events: { enabled: true } });
  hub.send([
    { kind: 'osc', address: '/belly', args: [0.5, 1], t: 1 },
    { kind: 'event', event: 'belly', phase: 'entry', region: 'belly', values: { x: 0.5 }, t: 1 },
    { kind: 'ws', name: 'belly', region: 'belly', phase: 'entry', point: 'p', values: { x: 0.1 }, fields: { a: 1 }, t: 1 },
  ]);
  assert.equal(relayed.filter(m => m.kind === 'osc')[0].port, 9000);
  assert.equal(relayed.filter(m => m.kind === 'broadcast').length, 2);
  assert.equal(events[0].name, 'belly'); assert.equal(ws[0].type, 'mediamime');
  const posts = [];
  const rt = relayTransport((url, init) => { posts.push(JSON.parse(init.body)); return Promise.resolve(); }, '/x', { set: f => f() });
  rt.send([{ kind: 'osc', address: '/a', args: [1], host: 'h', port: 1 }]);
  assert.equal(posts[0].messages[0].address, '/a');
});

test('outputs: web midi picks ports', async () => {
  const written = [];
  const out = (id, name) => ({ id, name, send: b => written.push([id, b]) });
  const nav = { requestMIDIAccess: async () => ({ outputs: new Map([['a', out('a', 'IAC')], ['b', out('b', 'Synth')]]) }) };
  const m = webMidi(nav);
  assert.deepEqual((await m.connect()).map(p => p.name), ['IAC', 'Synth']);
  m.send([1, 2, 3]); assert.equal(written.length, 2);
  m.select('b'); m.send([4, 5, 6]); assert.deepEqual(written.at(-1), ['b', [4, 5, 6]]); assert.equal(written.length, 3);
});

test('score: parse, limits, defaults', () => {
  assert.equal(parseScore('').regions.length, 0);
  assert.throws(() => parseScore({ version: 2 }), /version 1/);
  const s = parseScore({ version: 1, regions: [{ id: 'a', shape: { points: rectPolygon(0, 0, 1, 1) }, actions: [{ type: 'midiNote', note: 300, channel: 99 }] }] });
  assert.equal(s.regions[0].actions[0].note, 127); assert.equal(s.regions[0].actions[0].channel, 16);
  assert.throws(() => parseScore({ version: 1, regions: [{ id: 'bad', shape: { points: [[0, 0]] } }] }), /3 points/);
  assert.equal(parseScore({ version: 1, regions: [{ id: 'a', shape: { points: rectPolygon(0, 0, 1, 1) } }, { id: 'a', shape: { points: rectPolygon(0, 0, 1, 1) } }] }).regions.length, 1);
});

test('score: regions from a Poliplan document, reconciled', () => {
  const doc = { elements: [
    { id: 'p1', role: 'plane', closed: true, points: [[100, 100], [300, 100], [300, 300], [100, 300]].map(p => [...p, 0, 0.5]), label: 'pad' },
    { id: 'l1', role: 'line', points: [[0, 0], [500, 0]].map(p => [...p, 0, 0.5]) },
    { id: 'n1', role: 'note', points: [[1, 1, 0, 0.5]] },
    { id: 'b1', role: 'plane', closed: true, board: 'body', points: [[300, 480], [400, 480], [400, 380], [300, 380]].map(p => [...p, 0, 0.5]) },
  ] };
  const x = regionsFromPoliplan(doc, { image: { width: 1000, height: 500 }, body: { id: 'body', origin: [350, 480], scale: 200 } });
  assert.deepEqual(x.map(r => [r.id, r.space, r.shape.type]), [['p1', 'image', 'polygon'], ['l1', 'image', 'polyline'], ['b1', 'body', 'polygon']]);
  near(x[0].shape.points[0][0], 0.1); near(x[0].shape.points[0][1], 0.2);
  near(x[2].shape.points[0][0], -0.25); near(x[2].shape.points[0][1], 0);
  let s = reconcile(parseScore(null), x);
  assert.equal(s.regions.length, 3); assert.equal(s.regions[0].name, 'pad');
  s.regions[0].actions.push(defaultAction('midiNote'));
  s = reconcile(s, x.slice(0, 2));
  assert.equal(s.regions.length, 2); assert.equal(s.regions[0].actions.length, 1);
  assert.equal(simplify([[0, 0], [0.5, 0.0001], [1, 0]], 0.01).length, 2);
});
