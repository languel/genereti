// Plane geometry for regions. Pure functions on [[x, y], …] polygons and polylines; no DOM, no Comfy.

/** Even-odd point in polygon. */
export function pointInPolygon(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi) inside = !inside;
  }
  return inside;
}

export function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Distance to a polyline (closed: the last point joins the first). */
export function distToPolyline(points, x, y, closed = false) {
  let best = Infinity;
  const n = points.length;
  if (n === 1) return Math.hypot(x - points[0][0], y - points[0][1]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = points[i], b = points[(i + 1) % n];
    best = Math.min(best, distToSegment(x, y, a[0], a[1], b[0], b[1]));
  }
  return best;
}

export function polygonBounds(points) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of points) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/** The area centroid (falls back to the vertex mean for a degenerate polygon). */
export function polygonCentroid(points) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [x0, y0] = points[j], [x1, y1] = points[i], c = x0 * y1 - x1 * y0;
    a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
  }
  if (Math.abs(a) < 1e-12) return [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length];
  return [cx / (3 * a), cy / (3 * a)];
}

export const ellipsePolygon = (cx, cy, rx, ry, angle = 0, n = 48) => Array.from({ length: n }, (_, i) => {
  const t = (i / n) * Math.PI * 2, x = rx * Math.cos(t), y = ry * Math.sin(t);
  return [cx + x * Math.cos(angle) - y * Math.sin(angle), cy + x * Math.sin(angle) + y * Math.cos(angle)];
});

export const rectPolygon = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/**
 * Is the point in the shape? shape: { type: 'polygon', points } or { type: 'polyline', points, width } (a stroke of that
 * width). margin grows the shape (used for exit hysteresis: a point must leave by this much).
 */
export function insideShape(shape, x, y, margin = 0) {
  const pts = shape.points;
  if (!pts?.length) return false;
  if (shape.type === 'polyline') return distToPolyline(pts, x, y) <= (shape.width ?? 0.02) / 2 + margin;
  if (pts.length < 3) return distToPolyline(pts, x, y) <= (shape.width ?? 0.02) / 2 + margin;
  if (pointInPolygon(pts, x, y)) return true;
  return margin > 0 && distToPolyline(pts, x, y, true) <= margin;
}

/** Where the point is within the shape: nx, ny in 0..1 over its bounds, dist 0 at the centroid to 1 at the farthest vertex. */
export function shapeMetrics(shape, x, y) {
  const pts = shape.points, b = polygonBounds(pts), [cx, cy] = polygonCentroid(pts);
  let far = 0;
  for (const [px, py] of pts) far = Math.max(far, Math.hypot(px - cx, py - cy));
  const clamp = v => Math.max(0, Math.min(1, v));
  return {
    nx: clamp(b.w > 1e-9 ? (x - b.x0) / b.w : 0.5),
    ny: clamp(b.h > 1e-9 ? (y - b.y0) / b.h : 0.5),
    dist: clamp(far > 1e-9 ? Math.hypot(x - cx, y - cy) / far : 0),
  };
}

/** A polygon's cells on a w×h grid (the cell centres inside it), as flat indexes: for mask coverage. */
export function cellsInside(shape, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (insideShape(shape, (i + 0.5) / w, (j + 0.5) / h)) out.push(j * w + i);
  return out;
}
