# mediamime

Mediamime inside Genereti: draw trigger zones over a live perception stream and
send what happens in them as `__` events, MIDI, OSC, WebSocket messages and note
channels for Genereti instruments. It reads an existing provider stream (default
`body`); it starts no camera and runs no model.

The editor is **Poliplan** with two boards:

- **stage**: the live image underneath (connect the provider's clean `image`),
  with the skeleton, hitter points and, if a segmentation `mask` is connected,
  the body outline. Marks here stay in image coordinates.
- **body**: the **homunculus**, a schematic figure facing you (the performer's
  left on your right). Marks here are anchored to the nearest bone (head, torso,
  upper arm, forearm, hand, thigh, shin, foot) and follow the performer: they
  appear dashed on the stage, moving with the body. This is how the body itself
  becomes the instrument, as in Laurie Anderson's drum suit.

Draw closed shapes for **zones**, lines for **tripwires** and points for small
round **targets**. Each new mark becomes a region with an event and a note; edit
it in the side panel. ▭ and ☺ frame the stage and body boards.

**Hitters** are the landmarks that strike a region: presets (index fingers,
wrists, hands, feet, head, whole pose) or selectors such as `pose.left_index`
or `@hands.left.all`. A body zone ignores hitters from its own limb, so a zone
on the left forearm can only be struck by the right hand. On the stage, the
**Body (segmentation)** preset fires when the masked body covers more than the
threshold fraction of the zone.

**Triggers** (per action): `enter`, `exit`, `enter + exit` (note on/off, latched
CC), `while inside` (every 120 ms), and `cross` for tripwires. Cooldown consumes
a re-entry that comes too soon, and hold requires time inside before entry.
A lost stream releases every active zone (notes off); a paused source holds them.

**Values** for velocities, CCs, OSC and WebSocket: `speed` (strike speed),
`normX` / `normY` (position in the zone), `distance` (from its centre),
`coverage`, `count`, `x` / `y` or a constant. MIDI velocity sources map to 32–127.

**Actions**

- **__ event**: `__.events.on(name, e => …)` in Livecode. `{region}` and
  `{phase}` are replaced in names. Every entry, exit and crossing also emits a
  catch-all event named after `publish` (default `mime`) with `region`, `x`, `y`,
  `speed`, `hitter`.
- **MIDI note / CC**: press **MIDI** to connect Web MIDI (all outputs, or the
  named port). Notes are also published, whether or not MIDI is connected, as
  channels `chC.noteN` on the `channels` output: connect it to **mod.drumkit**
  or **mod.synth** (36 kick, 38 snare, others hats on the drum kit). Use
  **chop.select** with `ch10.*` / `ch1.*` to give each instrument its notes.
- **OSC**: arm **OSC**; messages go to `127.0.0.1:port` only, as
  `address value gate` floats.
- **WebSocket**: **WS** connects to the URL; messages are JSON with `stream`,
  `address`, `value`, `region`, `phase`, `x`, `y`, `speed`.

Press **▶** to evaluate; nothing fires before. **test ▶** fires one region by
hand, and the activity list shows what was sent. Outputs: `channels` CHOP
(`name.active`, `.x`, `.y`, `.speed`, `.coverage`, `.count`, `.hits`, held notes),
`events` DAT (recent entries, exits and crossings), and `overlay` IMAGE (zones and
hits on transparency, for projection). The `publish` stream carries the same
channels plus the live zone polygons:

```js
const mime = __.streams.read('mime');           // features, regions[{name, polygon, active}]
__.events.on('mime', e => burst(e.x, e.y, e.speed));
__.events.on('drum.chest', e => { /* one strike */ });
```

The score (Poliplan document, regions and outputs) is saved in the workflow;
**↓/↑** export and import it as JSON. Coordinates are normalized to the source
image, origin top-left; body zones are placed from bone frames each frame and
need their bone's two landmarks.
