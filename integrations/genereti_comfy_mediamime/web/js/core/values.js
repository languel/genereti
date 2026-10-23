// Values: how a number from the body (where it is in a region, how fast it moves) becomes a MIDI value, an OSC argument…

const clamp01 = v => Math.max(0, Math.min(1, v));
const curves = {
  linear: t => t,
  exp: t => t * t,
  log: t => Math.sqrt(t),
  smooth: t => t * t * (3 - 2 * t),
};

/** The raw number a source names: x, y (0..1 over the region), distance (0 centre … 1 edge), speed, depth, coverage. */
export function rawFor(source, metrics) {
  switch (source) {
    case 'x': return metrics.nx ?? 0;
    case 'y': return metrics.ny ?? 0;
    case 'distance': return metrics.dist ?? 0;
    case 'speed': return metrics.speed ?? 0;
    case 'depth': return metrics.z ?? 0;
    case 'coverage': return metrics.coverage ?? 0;
    default: return 0;
  }
}

/** spec: a number, or { source, in, out, curve, value }. Returns the mapped number (not rounded). */
export function resolveValue(spec, metrics) {
  if (typeof spec === 'number') return spec;
  if (!spec || typeof spec !== 'object') return 0;
  if (spec.source === 'constant') return spec.value ?? 0;
  const [a, b] = spec.in ?? [0, 1], [c, d] = spec.out ?? [0, 127];
  const t = clamp01((rawFor(spec.source, metrics) - a) / ((b - a) || 1e-9));
  return c + (curves[spec.curve] ?? curves.linear)(t) * (d - c);
}

/** The value a spec has when the body is gone from the region (its output minimum): for the "off" of an enter/exit pair. */
export function restingValue(spec) {
  if (typeof spec === 'number') return spec;
  if (spec?.source === 'constant') return spec.value ?? 0;
  return spec?.out?.[0] ?? 0;
}

export const midi7 = v => Math.max(0, Math.min(127, Math.round(v)));
