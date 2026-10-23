// Geometry for the poliplan input layer, in world units.

/** Fit a picture of w × h inside a board rectangle without cropping or stretching, centred (world units). */
export function fitContain(w, h, rect) {
  if (!(w > 0) || !(h > 0) || !(rect?.width > 0) || !(rect?.height > 0)) return {x: rect?.x ?? 0, y: rect?.y ?? 0, width: 0, height: 0};
  const scale = Math.min(rect.width / w, rect.height / h);
  const width = w * scale, height = h * scale;
  return {x: rect.x + (rect.width - width) / 2, y: rect.y + (rect.height - height) / 2, width, height};
}
