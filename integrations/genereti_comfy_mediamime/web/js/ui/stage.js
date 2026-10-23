// The stage: the picture and the person's landmarks underneath, the Poliplan overlay (a transparent editor) in the middle, and the
// activity of the regions on top. Two views of one document: the IMAGE board (video, regions in image space) and the BODY board
// (the homunculus: the figure in torso units, regions that follow the person). One camera for all three layers:
// screen = world × z + (x, y), the convention the editor's overlay mode shares.
import { BODY_BOARD, HAND_EDGES, POSE_EDGES, bodyFigure, bodyToWorld } from '../core/homunculus.js';
import { bodyFrame, fromFrame, frameFor, pointOf, toFrame } from '../core/frames.js';
import { POSE_NAMES, HAND_NAMES } from '../core/puppet.js';

const MARGIN = 24;
const COLORS = ['#ff6b6b', '#ffd166', '#06d6a0', '#4cc9f0', '#b185ff', '#ff9f68', '#7bd88f', '#f78fb3'];

export const colorOf = (region, i = 0) => region.color || COLORS[Math.abs(hash(region.id) + i) % COLORS.length];
function hash(text) { let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0; return h; }

/** The camera that frames a world rectangle in a viewport, with a margin. */
export function fitCamera(rect, width, height, margin = MARGIN) {
  const z = Math.max(0.01, Math.min((width - 2 * margin) / rect.w, (height - 2 * margin) / rect.h));
  return { x: (width - rect.w * z) / 2 - rect.x * z, y: (height - rect.h * z) / 2 - rect.y * z, z };
}

/** A region's outline as world points for the current view, or null when it is not drawn there. */
export function worldShape(region, view, { board, body, source, features }) {
  const pts = region.shape.points;
  if (view === 'image') {
    if (region.space === 'image') return pts.map(([x, y]) => [x * board.width, y * board.height]);
    if (!source || !features) return null;
    const fr = frameFor(region.space, features, source.width, source.height, region.tracker.min_confidence);
    return fr ? pts.map(([u, v]) => { const [x, y] = fromFrame(fr, u, v); return [x * board.width, y * board.height]; }) : null;
  }
  return region.space === 'body' ? pts.map(([u, v]) => bodyToWorld(body, u, v)) : null;
}

/** World metres per normalized length for polyline widths. */
const widthScale = (region, view, board) => (view === 'image' ? board.width : BODY_BOARD.scale);

export function createStage() {
  const el = document.createElement('div');
  el.className = 'mm-stage';
  const base = document.createElement('canvas');
  const layer = document.createElement('div');
  layer.className = 'mm-layer';
  const fx = document.createElement('canvas');
  fx.className = 'mm-fx';
  el.append(base, layer, fx);

  const stage = {
    el, layer,
    view: 'image',
    cam: { x: 0, y: 0, z: 1 },
    auto: true,
    board: { width: 1000, height: 750 },
    body: { id: 'body', x: 1300, y: 0, width: BODY_BOARD.width, height: BODY_BOARD.height },
    scene: { frame: null, features: null, source: null, regions: [], snapshot: {}, selected: null, showSkeleton: true },
    onCamera: null,
    size: { width: 1, height: 1, dpr: 1 },
  };

  const rectOf = view => (view === 'image' ? { x: 0, y: 0, w: stage.board.width, h: stage.board.height } : { x: stage.body.x, y: stage.body.y, w: BODY_BOARD.width, h: BODY_BOARD.height });

  stage.fit = () => {
    stage.auto = true;
    stage.cam = fitCamera(rectOf(stage.view), stage.size.width, stage.size.height);
    stage.onCamera?.(stage.cam);
  };
  stage.setView = view => { stage.view = view === 'body' ? 'body' : 'image'; stage.fit(); };
  /** The editor's own pan or zoom: the layers follow it. */
  stage.follow = cam => {
    if (!cam || ![cam.x, cam.y, cam.z].every(Number.isFinite)) return;
    stage.auto = false;
    stage.cam = { x: cam.x, y: cam.y, z: cam.z };
  };
  stage.resize = () => {
    const box = el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    stage.size = { width: Math.max(1, box.width), height: Math.max(1, box.height), dpr };
    for (const canvas of [base, fx]) {
      canvas.width = Math.round(stage.size.width * dpr);
      canvas.height = Math.round(stage.size.height * dpr);
    }
    if (stage.auto) stage.fit();
  };
  const observer = new ResizeObserver(() => stage.resize());
  observer.observe(el);

  /** World → screen, for placing DOM next to a world point. */
  stage.toScreen = ([x, y]) => [x * stage.cam.z + stage.cam.x, y * stage.cam.z + stage.cam.y];

  const transform = ctx => {
    const { dpr } = stage.size, { x, y, z } = stage.cam;
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * x, dpr * y);
  };
  const pixel = () => 1 / (stage.cam.z || 1);   // one screen pixel in world units

  // ---- the layer under the editor ----------------------------------------------------------------------------------------

  const skeleton = (ctx, features, place, scale) => {
    if (!features) return;
    const line = Math.max(1.5 * pixel(), 0.004 * scale);
    ctx.lineCap = 'round';
    const pose = POSE_NAMES.map(name => {
      const p = pointOf(features, `pose.${name}`, 0.3);
      return p ? place(p) : null;
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = line;
    ctx.beginPath();
    for (const [a, b] of POSE_EDGES) if (pose[a] && pose[b]) { ctx.moveTo(...pose[a]); ctx.lineTo(...pose[b]); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const p of pose) if (p) { ctx.beginPath(); ctx.arc(p[0], p[1], line * 1.6, 0, 6.2832); ctx.fill(); }
    for (let h = 0; h < 4; h++) {
      const hand = HAND_NAMES.map(name => { const p = pointOf(features, `hands.${h}.${name}`, 0); return p ? place(p) : null; });
      if (!hand[0]) continue;
      ctx.strokeStyle = 'rgba(120,220,255,0.7)';
      ctx.beginPath();
      for (const [a, b] of HAND_EDGES) if (hand[a] && hand[b]) { ctx.moveTo(...hand[a]); ctx.lineTo(...hand[b]); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(120,220,255,0.95)';
      for (const p of hand) if (p) { ctx.beginPath(); ctx.arc(p[0], p[1], line, 0, 6.2832); ctx.fill(); }
    }
  };

  const drawBase = () => {
    const ctx = base.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, base.width, base.height);
    transform(ctx);
    const { scene } = stage;
    if (stage.view === 'image') {
      const { width: W, height: H } = stage.board;
      ctx.fillStyle = '#0b0c0e';
      ctx.fillRect(0, 0, W, H);
      if (scene.frame) ctx.drawImage(scene.frame, 0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = pixel();
      ctx.strokeRect(0, 0, W, H);
      if (scene.showSkeleton) skeleton(ctx, scene.features, p => [p.x * W, p.y * H], W);
      return;
    }
    const { body } = stage;
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(body.x, body.y, BODY_BOARD.width, BODY_BOARD.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = pixel();
    ctx.strokeRect(body.x, body.y, BODY_BOARD.width, BODY_BOARD.height);
    // A grid in torso units, the hips and the shoulder line marked.
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    for (let u = -1.5; u <= 1.5; u += 0.5) { const [x0, y0] = bodyToWorld(body, u, -2.3), [x1, y1] = bodyToWorld(body, u, 2.1); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
    for (let v = -2; v <= 2; v += 0.5) { const [x0, y0] = bodyToWorld(body, -1.5, v), [x1, y1] = bodyToWorld(body, 1.5, v); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    for (const v of [0, 1]) { const [x0, y0] = bodyToWorld(body, -1.5, v), [x1, y1] = bodyToWorld(body, 1.5, v); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
    ctx.stroke();
    // The canonical figure, faint.
    const fig = bodyFigure();
    const at = fig.joints.map(j => bodyToWorld(body, j.u, j.v));
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 3 * pixel() + 2;
    ctx.beginPath();
    for (const [a, b] of fig.edges) { ctx.moveTo(...at[a]); ctx.lineTo(...at[b]); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (const p of at) { ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, 6.2832); ctx.fill(); }
    // The person, in the figure's space.
    if (scene.features && scene.source) {
      const fr = bodyFrame(scene.features, scene.source.width, scene.source.height, 0.3);
      if (fr) skeleton(ctx, scene.features, p => bodyToWorld(body, ...toFrame(fr, p.x, p.y)), BODY_BOARD.scale * 2);
    }
  };

  // ---- the layer over the editor -----------------------------------------------------------------------------------------

  const path = (ctx, pts, closed) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (closed) ctx.closePath();
  };

  const drawFx = () => {
    const ctx = fx.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, fx.width, fx.height);
    transform(ctx);
    const { scene } = stage;
    const env = { board: stage.board, body: stage.body, source: scene.source, features: scene.features };
    scene.regions.forEach((region, i) => {
      if (region.enabled === false) return;
      const pts = worldShape(region, stage.view, env);
      if (!pts) return;
      const state = scene.snapshot[region.id];
      const activity = state?.activity ?? 0;
      const color = colorOf(region, 0);
      const polygon = region.shape.type === 'polygon';
      const selected = scene.selected === region.id;
      if (activity > 0.02) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, 0.18 + 0.5 * activity);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        if (polygon) { path(ctx, pts, true); ctx.fill(); }
        else { ctx.lineWidth = region.shape.width * widthScale(region, stage.view, stage.board) * 2; ctx.lineJoin = ctx.lineCap = 'round'; path(ctx, pts, false); ctx.stroke(); }
        ctx.restore();
      }
      if (selected || activity > 0.02) {
        ctx.save();
        ctx.strokeStyle = selected ? '#ffffff' : color;
        ctx.globalAlpha = selected ? 0.9 : activity;
        ctx.lineWidth = (selected ? 2 : 1.5) * pixel();
        if (selected) ctx.setLineDash([6 * pixel(), 4 * pixel()]);
        path(ctx, pts, polygon);
        ctx.stroke();
        ctx.restore();
      }
      // The name, near the first point, so a region can be told apart in perform mode.
      if (region.name) {
        const [x, y] = pts[0];
        ctx.save();
        ctx.font = `${12 * pixel()}px system-ui, sans-serif`;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fillText(region.name, x + 4 * pixel(), y - 4 * pixel());
        ctx.restore();
      }
    });
    // The landmarks that are tracking: a ring where they are, filled when inside.
    for (const [id, state] of Object.entries(scene.snapshot)) {
      const region = scene.regions.find(r => r.id === id);
      if (!region || region.enabled === false) continue;
      for (const p of state.points ?? []) {
        let wx, wy;
        if (stage.view === 'image') [wx, wy] = [p.x * stage.board.width, p.y * stage.board.height];
        else if (scene.source && scene.features) {
          const fr = bodyFrame(scene.features, scene.source.width, scene.source.height, 0.3);
          if (!fr) continue;
          [wx, wy] = bodyToWorld(stage.body, ...toFrame(fr, p.x, p.y));
        } else continue;
        ctx.beginPath();
        ctx.arc(wx, wy, (p.inside ? 7 : 4) * pixel() + (p.inside ? 0 : 0), 0, 6.2832);
        ctx.lineWidth = 1.5 * pixel();
        ctx.strokeStyle = colorOf(region);
        ctx.stroke();
        if (p.inside) { ctx.fillStyle = colorOf(region); ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1; }
      }
    }
  };

  stage.draw = () => { drawBase(); drawFx(); };
  stage.destroy = () => observer.disconnect();
  /** The composite the stage shows, minus the editor: for the live IMAGE output. */
  stage.compose = (width = 640) => {
    const height = Math.max(1, Math.round(width * stage.size.height / stage.size.width));
    const out = document.createElement('canvas');
    out.width = width; out.height = height;
    const ctx = out.getContext('2d');
    ctx.drawImage(base, 0, 0, width, height);
    ctx.drawImage(fx, 0, 0, width, height);
    return out;
  };
  return stage;
}
