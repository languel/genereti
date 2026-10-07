// Adapted from Underscores. See UNDERSCORES-LICENSE and README.md.
// Timeline clip selection is kept independent of React so pointer, shift-click,
// and block-selection paths share the same ordering and modifier semantics.
export const updateTimelineClipSelection = (
  clipOrder = [],
  selectedIds = [],
  anchorId = "",
  clipId = "",
  { shiftKey = false, toggle = false } = {},
) => {
  const order = [...new Set((Array.isArray(clipOrder) ? clipOrder : []).filter(Boolean))];
  const current = [...new Set((Array.isArray(selectedIds) ? selectedIds : []).filter(Boolean))];
  if (!clipId || !order.includes(clipId)) return [];

  if (shiftKey && anchorId && order.includes(anchorId)) {
    const start = order.indexOf(anchorId);
    const end = order.indexOf(clipId);
    const range = order.slice(Math.min(start, end), Math.max(start, end) + 1);
    return toggle ? [...new Set([...current, ...range])] : range;
  }

  if (toggle) {
    return current.includes(clipId)
      ? current.filter(id => id !== clipId)
      : [...current, clipId];
  }
  return [clipId];
};
