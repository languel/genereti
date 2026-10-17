// Body drum particles. ꘇ mediamime publishes the "mime" stream (zones and their activity) and a "mime" event for
// every hit; the Holistic provider publishes the dancer's landmarks as "dancer".
// Hits burst into sparks at the struck point, sized by the strike speed and colored by the region.
// Fast hands and feet trail sparks of their own. Zones are drawn faintly, following the body.
let source_opacity = 0.55; /* 0..1 step:0.05 */
let burst_size = 60; /* 0..300 step:5 */
let trail_emission = 1.2; /* 0..6 step:0.1 */
let gravity = 0.18; /* -1..1 step:0.01 */
let drag = 0.04; /* 0..0.3 step:0.005 */
let life_seconds = 1.6; /* 0.2..6 step:0.1 */
let glow = 0.8; /* 0..2 step:0.05 */
let show_zones = true; /* toggle */
const particles = [], hits = [], last = new Map();
const hueOf = name => { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
function setup() {
  createCanvas(windowWidth, windowHeight); colorMode(HSB, 360, 100, 100, 1); noStroke();
  __.events.on('mime', e => { if (e.phase === 'entry') { hits.push(e); if (hits.length > 64) hits.shift(); } });
}
function spawn(x, y, hue, n, speed) {
  for (let i = 0; i < n && particles.length < 4000; i++) {
    const a = random(TWO_PI), v = random(.5, 1) * (1.5 + speed * 9);
    particles.push({ x, y, vx: cos(a) * v, vy: sin(a) * v - speed * 2, life: 1, hue: (hue + random(-18, 18) + 360) % 360, size: random(1.5, 4) * (1 + speed) });
  }
}
function draw() {
  background(0, 0, 4);
  const dancer = __.streams.read('dancer', 500), mime = __.streams.read('mime', 500), f = dancer?.features;
  const iw = inputImage?.width || dancer?.source?.width || width, ih = inputImage?.height || dancer?.source?.height || height;
  const fit = Math.min(width / iw, height / ih), fw = iw * fit, fh = ih * fit, ox = (width - fw) / 2, oy = (height - fh) / 2;
  const at = (x, y) => [ox + x * fw, oy + y * fh];
  if (inputImage && source_opacity > 0) { tint(0, 0, 100, source_opacity); image(inputImage, ox, oy, fw, fh); noTint(); }
  if (show_zones && mime?.regions) for (const r of mime.regions) {
    if (!r.polygon) continue; const hue = hueOf(r.name);
    stroke(hue, 60, 100, r.active ? .9 : .25); strokeWeight(r.active ? 3 : 1); r.active ? fill(hue, 70, 100, .18) : noFill();
    beginShape(); for (const [x, y] of r.polygon) vertex(...at(x, y)); r.kind === 'wire' ? endShape() : endShape(CLOSE);
  }
  noStroke();
  while (hits.length) { const e = hits.shift(); if (!Number.isFinite(e.x)) continue; const [x, y] = at(e.x, e.y); spawn(x, y, hueOf(e.region), burst_size * (.4 + (e.speed ?? 0)), e.speed ?? .3); }
  // Hands and feet trail sparks with their speed.
  const dt = Math.min(.1, deltaTime / 1000);
  for (const name of ['pose.left_index', 'pose.right_index', 'pose.left_foot_index', 'pose.right_foot_index']) {
    const x = f?.[name + '.x'], y = f?.[name + '.y'];
    if (!Number.isFinite(x) || !Number.isFinite(y) || (f[name + '.visibility'] ?? 1) < .4) { last.delete(name); continue; }
    const p = at(x, y), q = last.get(name); last.set(name, p);
    if (!q || dancer?.held) continue;
    const speed = Math.hypot(p[0] - q[0], p[1] - q[1]) / fh / Math.max(dt, .001);
    const n = Math.floor(trail_emission * Math.min(6, speed * 2));
    for (let i = 0; i < n; i++) { const k = random(); spawn(q[0] + (p[0] - q[0]) * k, q[1] + (p[1] - q[1]) * k, name.includes('left') ? 168 : 335, 1, Math.min(.6, speed * .2)); }
  }
  blendMode(ADD);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vx *= 1 - drag; p.vy = p.vy * (1 - drag) + gravity; p.x += p.vx; p.y += p.vy; p.life -= dt / life_seconds;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    fill(p.hue, 70, 100, p.life * .8); circle(p.x, p.y, p.size * (1 + glow * p.life));
    fill(p.hue, 20, 100, p.life * glow * .25); circle(p.x, p.y, p.size * 4 * glow);
  }
  blendMode(BLEND);
}
function keyPressed() { if (key === 'r' || key === 'R') particles.length = 0; }
