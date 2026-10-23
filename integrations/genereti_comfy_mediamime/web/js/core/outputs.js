// Where messages go: Web MIDI (in the browser), OSC and a WebSocket relay (through Comfy's backend, which can send UDP), a
// WebSocket of your own, and Genereti's perception events (for livecode, `__.events.on('name', …)`). Transports are injected, so
// the hub is testable and the browser parts stay in their own functions below.

const status = { on: 0x90, off: 0x80, cc: 0xb0 };

export class OutputHub {
  /**
   * transports: { midi: { send(bytes) }, relay: { send(messages) }, ws: { send(object) }, events: { emit(event) } }, any may be missing.
   * outputs: the score's normalized outputs (enabled flags). timers: { set, clear } for the note lengths.
   */
  constructor(transports = {}, outputs = {}, timers = { set: (f, ms) => setTimeout(f, ms), clear: id => clearTimeout(id) }) {
    this.t = transports;
    this.outputs = outputs;
    this.timers = timers;
    this.held = new Map();    // `${channel}:${note}` → timer id, for notes with a length
    this.lastCc = new Map();
    this.sent = { midi: 0, osc: 0, ws: 0, events: 0 };
  }

  configure(outputs) { this.outputs = outputs; }

  midi(bytes) {
    if (!this.outputs.midi?.enabled || !this.t.midi) return;
    this.t.midi.send(bytes);
    this.sent.midi++;
  }

  noteOff(channel, note) {
    const k = `${channel}:${note}`;
    if (this.held.has(k)) { this.timers.clear(this.held.get(k)); this.held.delete(k); }
    this.midi([status.off | (channel - 1), note, 0]);
  }

  /** Route output messages from the engine. */
  send(messages) {
    const relay = [];
    for (const m of messages) {
      switch (m.kind) {
        case 'midiNote':
          if (m.phase === 'off') { this.noteOff(m.channel, m.note); break; }
          {
            const k = `${m.channel}:${m.note}`;
            if (this.held.has(k)) this.noteOff(m.channel, m.note);   // retrigger: end the old one first
            this.midi([status.on | (m.channel - 1), m.note, m.velocity]);
            if (m.length_ms > 0) this.held.set(k, this.timers.set(() => { this.held.delete(k); this.midi([status.off | (m.channel - 1), m.note, 0]); }, m.length_ms));
          }
          break;
        case 'midiCc': {
          const k = `${m.channel}:${m.cc}`;
          if (this.lastCc.get(k) === m.value) break;
          this.lastCc.set(k, m.value);
          this.midi([status.cc | (m.channel - 1), m.cc, m.value]);
          break;
        }
        case 'osc':
          if (this.outputs.osc?.enabled) relay.push({ ...m, host: this.outputs.osc.host, port: this.outputs.osc.port });
          break;
        case 'ws':
          if (this.outputs.ws?.enabled && this.t.ws) { this.t.ws.send({ type: 'mediamime', region: m.name, id: m.region, phase: m.phase, point: m.point, t: m.t, ...m.values, ...m.fields }); this.sent.ws++; }
          if (this.outputs.relay?.enabled) relay.push({ kind: 'broadcast', payload: { type: 'mediamime', region: m.name, id: m.region, phase: m.phase, point: m.point, t: m.t, ...m.values, ...m.fields } });
          break;
        case 'event':
          if (this.outputs.events?.enabled && this.t.events) { this.t.events.emit({ name: m.event, phase: m.phase, region: m.region, values: m.values, timestamp_ms: m.t, source: 'mediamime' }); this.sent.events++; }
          if (this.outputs.relay?.enabled) relay.push({ kind: 'broadcast', payload: { type: 'event', name: m.event, phase: m.phase, region: m.name, ...m.values, t: m.t } });
          break;
        default: break;
      }
    }
    const osc = relay.filter(m => m.kind === 'osc');
    if (relay.length && this.t.relay) { this.t.relay.send(relay); this.sent.osc += osc.length; }
  }

  /** Every note still sounding stops (a note with a length, or one the engine holds: pass its off messages to send()). */
  releaseAll() {
    for (const [k, id] of this.held) {
      this.timers.clear(id);
      const [channel, note] = k.split(':').map(Number);
      this.midi([status.off | (channel - 1), note, 0]);
    }
    this.held.clear();
    this.lastCc.clear();
  }
}

// ---- browser transports ----------------------------------------------------------------------------------------------

/** Web MIDI outputs: `ports()` lists them, `select(id | 'all')` chooses, `send(bytes)` writes to the choice. */
export function webMidi(nav = globalThis.navigator) {
  let access = null, choice = 'all';
  return {
    async connect() {
      if (!nav?.requestMIDIAccess) throw new Error('Web MIDI is not available in this browser');
      access = await nav.requestMIDIAccess({ sysex: false });
      return this.ports();
    },
    ports() { return access ? [...access.outputs.values()].map(o => ({ id: o.id, name: o.name })) : []; },
    select(id) { choice = id || 'all'; },
    get connected() { return Boolean(access); },
    send(bytes) {
      if (!access) return;
      for (const o of access.outputs.values()) if (choice === 'all' || o.id === choice || o.name === choice) o.send(bytes);
    },
    panic() {
      if (!access) return;
      for (const o of access.outputs.values()) if (choice === 'all' || o.id === choice || o.name === choice) for (let ch = 0; ch < 16; ch++) o.send([0xb0 | ch, 123, 0]);
    },
  };
}

/** Comfy's relay: OSC out as UDP, and a broadcast to WebSocket clients, batched. */
export function relayTransport(fetchImpl = globalThis.fetch, url = '/genereti/mediamime/emit', timers = { set: (f, ms) => setTimeout(f, ms) }) {
  let queue = [], scheduled = false;
  const flush = () => {
    scheduled = false;
    const batch = queue; queue = [];
    if (!batch.length) return;
    Promise.resolve(fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: batch }) })).catch(() => {});
  };
  return {
    send(messages) {
      queue.push(...messages.map(m => (m.kind === 'osc' ? { kind: 'osc', host: m.host, port: m.port, address: m.address, args: m.args } : m)));
      if (queue.length > 512) queue = queue.slice(-512);
      if (!scheduled) { scheduled = true; timers.set(flush, 16); }
    },
    flush,
  };
}

/** A WebSocket of your own: connects on demand, reconnects, drops while closed. */
export function wsTransport(WS = globalThis.WebSocket, timers = { set: (f, ms) => setTimeout(f, ms) }) {
  let socket = null, url = '', wanted = false, retry = 0;
  const open = () => {
    if (!wanted || !url) return;
    try {
      socket = new WS(url);
      socket.onopen = () => { retry = 0; };
      socket.onclose = () => { socket = null; if (wanted) timers.set(open, Math.min(8000, 500 * 2 ** retry++)); };
      socket.onerror = () => {};
    } catch { socket = null; }
  };
  return {
    configure(next, enabled) {
      if (next === url && enabled === wanted) return;
      wanted = enabled; url = next;
      try { socket?.close(); } catch { /* ignore */ }
      socket = null;
      if (wanted) open();
    },
    send(obj) { if (socket?.readyState === 1) socket.send(JSON.stringify(obj)); },
    get open() { return socket?.readyState === 1; },
  };
}
