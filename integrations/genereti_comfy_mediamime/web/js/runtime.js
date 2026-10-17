// The runtime: reads the stream, runs the engine, routes what it sends. One per node; it starts and stops with the node's
// transport and always ends every note it started.
import { RegionEngine } from './core/engine.js';
import { OutputHub, relayTransport, webMidi, wsTransport } from './core/outputs.js';
import { drumDance, puppetFrame } from './core/puppet.js';

export const PUPPET = 'puppet';
const PUPPET_SIZE = [640, 480];
const DERIVED_MS = 33;
const slug = name => String(name || 'region').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'region';

export function createRuntime({ score, getMask = () => null, onTick = () => {}, onStatus = () => {}, owner, fetchApi = (...a) => fetch(...a), perception = () => globalThis.generetiPerception }) {
  const engine = new RegionEngine(score);
  const midi = webMidi();
  const relay = relayTransport(fetchApi);
  const ws = wsTransport();
  const hub = new OutputHub({ midi, relay, ws, events: { emit: e => perception()?.events.emit(e) } }, score.outputs);
  const puppet = { mode: 'drum', period: 480, state: { cx: 0.5, cy: 0.62, scale: 0.17, tilt: 0, left: null, right: null, hands: true }, dance: drumDance({ period: 480 }) };
  const runtime = {
    engine, hub, midi, puppet,
    running: false,
    events: [],          // the most recent events, for the log and the python node
    channels: {},        // region activity, for CHOP consumers
    last: null,          // the last tick's result
    frame: null,
  };
  let timer = 0, unsubscribe = null, claimed = new Set(), derivedAt = 0;

  const claim = name => {
    const streams = perception()?.streams;
    if (!streams || !name) return null;
    if (claimed.has(name)) return streams;
    try { streams.claim(name, owner); claimed.add(name); return streams; } catch { return null; }
  };
  const release = name => { perception()?.streams.remove(name, owner); claimed.delete(name); };

  const resultFor = (frame, task, features, model) => ({
    version: 1, task, source: { ...frame.source }, coordinates: { origin: 'top-left', space: 'normalized-image', x: 'right', y: 'down', mirrored: false },
    model: { id: model, version: 1, runtime: 'mediamime', backend: 'browser' }, completed_at_ms: performance.now(), age_ms: 0, timings_ms: {}, features,
  });

  runtime.setPuppet = patch => {
    Object.assign(puppet, patch);
    if (patch.period) puppet.dance = drumDance({ period: patch.period });
  };

  /** A puppet frame at time t, published as the stream named `puppet` so other nodes can read it too. */
  function puppetStep(now) {
    const [W, H] = PUPPET_SIZE;
    let pose = {};
    if (puppet.mode === 'drum') pose = puppet.dance.at(now);
    const state = { ...puppet.state, ...(puppet.mode === 'manual' ? {} : pose) };
    const frame = puppetFrame(state, now, W, H);
    const streams = claim(PUPPET);
    streams?.update(PUPPET, owner, resultFor(frame, 'pose+hands', frame.features, 'puppet'), 'running');
    return frame;
  }

  function readFrame(now) {
    const name = engine.score.streams.primary;
    if (name === PUPPET) return puppetStep(now);
    const r = perception()?.streams.read(name, 500);
    return r ? { features: r.features, source: r.source, held: r.held } : null;
  }

  function derive(frame, regions) {
    const name = engine.score.streams.derived;
    if (!name || name === engine.score.streams.primary) return;
    const features = { 'regions.active': 0 };
    const channels = {};
    for (const region of engine.score.regions) {
      const s = regions[region.id];
      const key = slug(region.name);
      const active = s?.active ? 1 : 0;
      const first = s?.points?.find(p => p.inside) ?? s?.points?.[0];
      features['regions.active'] += active;
      Object.assign(features, { [`region.${key}.active`]: active, [`region.${key}.activity`]: s?.activity ?? 0 });
      channels[`${key}.active`] = active;
      channels[`${key}.activity`] = s?.activity ?? 0;
      if (first) {
        Object.assign(features, { [`region.${key}.x`]: first.x, [`region.${key}.y`]: first.y, [`region.${key}.speed`]: first.speed ?? 0 });
        channels[`${key}.speed`] = first.speed ?? 0;
      }
      if (s?.coverage != null) { features[`region.${key}.coverage`] = s.coverage; channels[`${key}.coverage`] = s.coverage; }
    }
    runtime.channels = channels;
    const now = performance.now();
    if (frame && now - derivedAt >= DERIVED_MS) {
      derivedAt = now;
      const streams = claim(name);
      streams?.update(name, owner, resultFor({ source: { ...frame.source, frame_timestamp_ms: now } }, 'regions', features, 'mediamime'), 'running');
    }
  }

  let stepping = false;
  function step() {
    if (stepping) return;   // our own stream updates call back into the subscription
    stepping = true;
    try { tick(); } finally { stepping = false; }
  }

  function tick() {
    const now = performance.now();
    const frame = readFrame(now);
    if (frame) frame.mask = getMask();
    runtime.frame = frame;
    const out = runtime.engine.tick(frame, now);
    if (out.messages.length) hub.send(out.messages);
    if (out.events.length) {
      runtime.events.push(...out.events);
      if (runtime.events.length > 200) runtime.events.splice(0, runtime.events.length - 200);
    }
    derive(frame, out.regions);
    runtime.last = out;
    onTick(out, frame);
  }

  runtime.step = step;

  runtime.setScore = next => {
    const wasRunning = runtime.running;
    if (wasRunning) runtime.silence();
    engine.set(next);
    hub.configure(next.outputs);
    if (runtime.running) ws.configure(next.outputs.ws.url, next.outputs.ws.enabled);
    midi.select(next.outputs.midi.port);
  };

  /** Every note that was started ends. */
  runtime.silence = () => {
    const off = engine.release(performance.now());
    if (off.length) hub.send(off);
    hub.releaseAll();
  };

  runtime.connectMidi = async () => {
    try {
      const ports = await midi.connect();
      midi.select(engine.score.outputs.midi.port);
      onStatus(ports.length ? '' : 'No MIDI outputs found');
      return ports;
    } catch (error) { onStatus(error.message); return []; }
  };

  runtime.start = () => {
    if (runtime.running) return;
    runtime.running = true;
    ws.configure(engine.score.outputs.ws.url, engine.score.outputs.ws.enabled);
    if (engine.score.outputs.midi.enabled && !midi.connected) runtime.connectMidi();
    timer = setInterval(step, 16);
    unsubscribe = perception()?.streams.subscribe(name => { if (name === engine.score.streams.primary) step(); });
  };

  runtime.stop = () => {
    if (!runtime.running) return;
    runtime.running = false;
    clearInterval(timer);
    unsubscribe?.();
    unsubscribe = null;
    runtime.silence();
    engine.reset();
    for (const name of [...claimed]) release(name);
    ws.configure('', false);
    runtime.last = null;
    onTick({ events: [], messages: [], regions: {} }, null);
  };

  runtime.panic = () => { runtime.silence(); midi.panic(); };
  runtime.dispose = () => { runtime.stop(); };

  /** A snapshot for the python node: recent events and the channels. */
  runtime.capture = () => ({ events: runtime.events.slice(-200).map(e => ({ t: Math.round(e.t), phase: e.phase, region: e.name, point: e.point, ...e.metrics })), channels: runtime.channels });
  return runtime;
}
