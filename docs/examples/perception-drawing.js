// Four body-driven pens. Livecode exposes these annotated values as controls.
let trail_seconds = 3; /* 0..20 step:0.1 */
let smoothing = 0.35; /* 0..1 step:0.01 */
let source_opacity = 0.8; /* 0..1 step:0.05 */
let stroke_width = 3; /* 1..12 step:0.5 */
const pens = [
  {name: 'pose.left_wrist', color: '#63dfc5'},
  {name: 'pose.right_wrist', color: '#ff729e'},
  {name: 'pose.left_ankle', color: '#ffe274'},
  {name: 'pose.right_ankle', color: '#78aaff'},
].map(p => ({...p, point: null, trail: []}));
let clock = 0, revision = '', lastFrame = null;
function setup() { createCanvas(windowWidth, windowHeight); }
function resetTrails() {
  for (const pen of pens) { pen.point = null; pen.trail = []; }
}
function draw() {
  const dt = Math.min(Math.max(deltaTime / 1000, 0), 0.1);
  // Held observations remain readable even after their original timestamp ages.
  const record = __.streams.read('selected', Infinity);
  const valid = record && (record.held || record.age_ms <= 500);
  const source = record?.source;
  const key = JSON.stringify([source?.id, source?.output_slot, source?.revision,
    source?.width, source?.height, record?.selection?.names]);
  const frame = source?.frame_timestamp_ms;
  if (key !== revision || (Number.isFinite(frame) && frame < lastFrame)) {
    resetTrails(); revision = key; lastFrame = null;
  }
  const advancing = valid && !record.held;
  if (advancing) clock += dt;
  const blend = smoothing <= 0 ? 1 : 1 - Math.exp(-dt / (0.015 + smoothing * smoothing * 0.75));
  for (const pen of pens) {
    const x = record?.features?.[pen.name + '.x'];
    const y = record?.features?.[pen.name + '.y'];
    if (!valid || !Number.isFinite(x) || !Number.isFinite(y)) {
      pen.point = null; // Missing/reacquired joints never bridge a gap.
    } else if (!record.held || !pen.point) {
      const target = {x, y};
      const jump = pen.point && Math.hypot(x - pen.point.x, y - pen.point.y) > 0.3;
      if (!pen.point || jump) pen.point = {...target};
      else {
        pen.point.x += (x - pen.point.x) * blend;
        pen.point.y += (y - pen.point.y) * blend;
      }
      if (advancing) pen.trail.push({...pen.point, t: clock, start: jump || !pen.trail.length || pen.broken});
    }
    pen.broken = !pen.point;
    while (pen.trail.length && (clock - pen.trail[0].t > trail_seconds || pen.trail.length > 1300)) pen.trail.shift();
    if (trail_seconds <= 0) pen.trail = [];
  }
  if (Number.isFinite(frame)) lastFrame = frame;
  background('#10131d');
  const sourceImage = inputImage;
  const iw = sourceImage?.width || source?.width || width;
  const ih = sourceImage?.height || source?.height || height;
  const scale = Math.min(width / iw, height / ih);
  const fw = iw * scale, fh = ih * scale, ox = (width - fw) / 2, oy = (height - fh) / 2;
  if (sourceImage) {
    tint(255, source_opacity * 255); image(sourceImage, ox, oy, fw, fh); noTint();
  } else {
    // Cobalt and orange cut-paper stage while waiting for a source.
    noStroke(); fill('#2451a4'); rect(30, 30, width - 60, height - 60);
    fill('#ed913d'); triangle(width * .5, 40, width - 60, height * .55, 60, height * .55);
  }
  for (const pen of pens) {
    strokeWeight(stroke_width);
    for (let i = 1; i < pen.trail.length; i++) {
      const a = pen.trail[i - 1], b = pen.trail[i];
      if (b.start) continue;
      const ink = color(pen.color);
      ink.setAlpha(255 * Math.max(0, 1 - (clock - b.t) / Math.max(.001, trail_seconds)));
      stroke(ink); line(ox + a.x * fw, oy + a.y * fh, ox + b.x * fw, oy + b.y * fh);
    }
    if (pen.point) {
      stroke('#ffffff'); strokeWeight(1); fill(pen.color);
      circle(ox + pen.point.x * fw, oy + pen.point.y * fh, Math.max(6, stroke_width * 2.5));
    }
  }
}
function keyPressed() { if (key === 'r' || key === 'R') resetTrails(); }
