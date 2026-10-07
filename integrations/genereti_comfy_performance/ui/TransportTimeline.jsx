// Adapted from Underscores. See UNDERSCORES-LICENSE and README.md.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createTimelineTicks, followTimelineViewRange, formatTimelinePosition, snapTimelineTime } from "../web/core/transport.js";
import { updateTimelineClipSelection } from "../web/core/timelineSelection.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const snapLevelFromPointer = event => event.metaKey ? (event.shiftKey ? "minor" : "major") : null;

const TransportTimeline = memo(function TransportTimeline({
  duration,
  currentTime,
  clock,
  visible,
  revision,
  displayMode,
  fps,
  tempo,
  signature,
  loopEnabled,
  loopStart,
  loopEnd,
  onSeek,
  onSeekCommit = onSeek,
  onLoopEnabledChange,
  onLoopChange,
  automationKeys = [],
  walkthroughMarkers = [],
  followPlayhead = true,
  arrangementLanes = [],
  arrangementTakes = [],
  timelineMode = "objects",
  timelineTracks = [],
  timelineClips = [],
  selectedElementIds = {},
  selectedClipId = "",
  onClipSelect = () => {},
  onClipEdit = () => {},
  onClipDelete = () => {},
  onTakePatch = () => {},
  onTakeDelete = () => {},
  onTimelineClipDrop = () => {},
  onTimelineClipEdit = () => {},
  onTimelineClipDelete = () => {},
  onTimelineUndo = () => false,
  onTimelineRedo = () => false,
  onTimelineTrackPatch = () => {},
  onTimelineTrackMove = () => {},
}) {
  const timelineRef = useRef(null);
  const trackRef = useRef(null);
  const zoomRef = useRef(null);
  const dragRef = useRef(null);
  const selectionDragRef = useRef(null);
  const selectionAnchorRef = useRef("");
  const selectedClipIdsRef = useRef(selectedClipId ? [selectedClipId] : []);
  const selectionInteractionRef = useRef(null);
  const laneScrollRef = useRef(null);
  const [expandedTakeIds, setExpandedTakeIds] = useState(() => new Set());
  const [arrangementLabelsCollapsed, setArrangementLabelsCollapsed] = useState(false);
  const [clipPreviewTimings, setClipPreviewTimings] = useState(() => new Map());
  const [dropTrackId, setDropTrackId] = useState("");
  const [selectedClipIds, setSelectedClipIds] = useState(() => selectedClipId ? [selectedClipId] : []);
  const [selectionRect, setSelectionRect] = useState(null);
  const authoredDuration = Math.max(0.001, Number(duration) || 0.001);
  const previousDurationRef = useRef(authoredDuration);
  const [trackWidth, setTrackWidth] = useState(768);
  const [viewRange, setViewRange] = useState(() => ({ start: 0, end: authoredDuration }));
  const currentTimeValue = Math.max(0, Number(currentTime) || 0);
  // Follow mode may need to look beyond the authored score end. Keep that
  // extension local to the timeline so a live transport never loses its
  // playhead when a score's static duration has been reached.
  const safeDuration = Math.max(
    authoredDuration,
    followPlayhead ? currentTimeValue : 0,
    followPlayhead ? Number(viewRange.end) || 0 : 0,
  );
  const viewStart = clamp(viewRange.start, 0, safeDuration);
  const viewEnd = clamp(Math.max(viewStart + Number.EPSILON, viewRange.end), 0, safeDuration);
  const viewDuration = Math.max(Number.EPSILON, viewEnd - viewStart);
  const options = useMemo(() => ({ fps, tempo, signature }), [fps, tempo, signature]);
  const ticks = useMemo(() => createTimelineTicks(safeDuration, 12, {
    mode: displayMode,
    fps,
    tempo,
    signature,
    rangeStart: viewStart,
    rangeEnd: viewEnd,
    pixelWidth: trackWidth,
  }), [displayMode, fps, safeDuration, signature, tempo, trackWidth, viewEnd, viewStart]);
  const arrangementRows = useMemo(() => {
    const knownTakeIds = new Set(arrangementTakes.map(take => take.id));
    const rows = [];
    arrangementTakes.forEach(take => {
      const clips = arrangementLanes.flatMap(lane => lane.clips
        .filter(clip => clip.takeId === take.id)
        .map(clip => ({ ...clip, elementId: lane.elementId, elementLabel: lane.label })));
      if (!clips.length) return;
      rows.push({ kind: "take", id: take.id, label: take.name || "Take", take, clips });
      if (expandedTakeIds.has(take.id)) {
        arrangementLanes.forEach(lane => {
          const laneClips = lane.clips.filter(clip => clip.takeId === take.id);
          if (laneClips.length) rows.push({ kind: "object", id: `${take.id}:${lane.elementId}`, takeId: take.id, ...lane, clips: laneClips });
        });
      }
    });
    arrangementLanes.forEach(lane => {
      const clips = lane.clips.filter(clip => !clip.takeId || !knownTakeIds.has(clip.takeId));
      if (clips.length) rows.push({ kind: "object", id: `standalone:${lane.elementId}`, ...lane, clips });
    });
    return rows;
  }, [arrangementLanes, arrangementTakes, expandedTakeIds]);
  const timelineRows = useMemo(() => timelineTracks
    .map(track => ({ ...track, clips: timelineClips
      .filter(clip => clip.trackId === track.id)
      .sort((left, right) => (Number(left.timing?.start) || 0) - (Number(right.timing?.start) || 0) || left.id.localeCompare(right.id)) }))
    .filter(track => track.clips.length || timelineMode === "clips"), [timelineClips, timelineMode, timelineTracks, revision]);

  const clipSelectionIndex = useMemo(() => {
    const order = [];
    const elementByClipId = new Map();
    const sourceRows = timelineMode === "clips" ? timelineRows : arrangementRows;
    sourceRows.forEach(row => {
      // The take row is an aggregate overview. Once expanded, its child rows
      // are the canonical visual owners of those clips and the aggregate must
      // not add a second copy to the selection order.
      if (row.kind === "take" && expandedTakeIds.has(row.id)) return;
      row.clips.forEach(clip => {
        if (elementByClipId.has(clip.id)) return;
        order.push(clip.id);
        elementByClipId.set(clip.id, clip.elementId || row.elementId || "");
      });
    });
    return { order, elementByClipId };
  }, [arrangementRows, expandedTakeIds, timelineMode, timelineRows]);

  selectedClipIdsRef.current = selectedClipIds;
  const selectedClipSet = useMemo(() => new Set(selectedClipIds), [selectedClipIds]);

  const handleTimelineKeyDown = useCallback((event) => {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.isComposing && event.key.toLowerCase() === "z") {
      const changed = event.shiftKey ? onTimelineRedo() : onTimelineUndo();
      if (changed) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    const target = event.target;
    if (target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
    const clipButton = target?.closest?.("[data-clip-id]");
    if (target?.closest?.("button") && !clipButton) return;
    const focusedClipId = clipButton?.dataset?.clipId || "";
    const selected = [...new Set([
      ...selectedClipIdsRef.current,
      ...(focusedClipId ? [focusedClipId] : []),
    ])].filter(id => clipSelectionIndex.elementByClipId.has(id));
    if (!selected.length) return;
    event.preventDefault();
    event.stopPropagation();
    if (timelineMode === "clips") {
      selected.forEach((id, index) => onTimelineClipDelete(id, { commitToHistory: index === 0 }));
    } else {
      selected.forEach(id => {
        const elementId = clipSelectionIndex.elementByClipId.get(id);
        if (elementId) onClipDelete(elementId, id);
      });
    }
  }, [clipSelectionIndex, onClipDelete, onTimelineClipDelete, onTimelineRedo, onTimelineUndo, timelineMode]);

  const commitClipSelection = useCallback((ids, { additive = false, primaryClipId = "" } = {}) => {
    const requested = new Set(Array.isArray(ids) ? ids : []);
    const current = selectedClipIdsRef.current;
    const next = clipSelectionIndex.order.filter(id => requested.has(id) || (additive && current.includes(id)));
    const primary = primaryClipId && next.includes(primaryClipId) ? primaryClipId : next.at(-1) || "";
    const elementIds = [...new Set(next.map(id => clipSelectionIndex.elementByClipId.get(id)).filter(Boolean))];
    selectionAnchorRef.current = primaryClipId || primary;
    setSelectedClipIds(next);
    const primaryElementId = primary ? clipSelectionIndex.elementByClipId.get(primary) || "" : "";
    onClipSelect(primaryElementId, primary, { clipIds: next, elementIds });
  }, [clipSelectionIndex, onClipSelect]);

  const selectClip = useCallback((event, clipId) => {
    if (event.button !== 0) return false;
    const next = updateTimelineClipSelection(
      clipSelectionIndex.order,
      selectedClipIdsRef.current,
      selectionAnchorRef.current,
      clipId,
      { shiftKey: event.shiftKey, toggle: event.metaKey || event.ctrlKey },
    );
    commitClipSelection(next, { primaryClipId: clipId });
    return true;
  }, [clipSelectionIndex, commitClipSelection]);

  selectionInteractionRef.current = { commitClipSelection, clipSelectionIndex };

  useEffect(() => {
    setSelectedClipIds(current => {
      const next = clipSelectionIndex.order.filter(id => current.includes(id));
      return next.length === current.length && next.every((id, index) => id === current[index]) ? current : next;
    });
  }, [clipSelectionIndex]);

  useEffect(() => {
    if (!selectedClipId) {
      setSelectedClipIds(current => current.length ? [] : current);
      return;
    }
    setSelectedClipIds(current => current.includes(selectedClipId) ? current : [selectedClipId]);
  }, [selectedClipId]);

  useEffect(() => {
    const selectedId = Object.keys(selectedElementIds || {}).find(id => selectedElementIds[id]);
    if (!selectedId) return;
    const takeIds = arrangementLanes
      .find(lane => lane.elementId === selectedId)?.clips
      .map(clip => clip.takeId)
      .filter(Boolean) || [];
    if (takeIds.length) setExpandedTakeIds(previous => new Set([...previous, ...takeIds]));
    const frame = requestAnimationFrame(() => {
      laneScrollRef.current?.querySelector?.(`[data-element-id="${CSS.escape(selectedId)}"]`)
        ?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [arrangementLanes, selectedElementIds]);

  useEffect(() => {
    const selectionRectFor = (startX, startY, endX, endY) => {
      const trackRect = trackRef.current?.getBoundingClientRect();
      if (!trackRect) return null;
      return {
        left: Math.min(startX, endX) - trackRect.left,
        top: Math.min(startY, endY) - trackRect.top,
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
      };
    };
    const handleMove = event => {
      const drag = selectionDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 3;
      if (!moved && !drag.active) return;
      drag.active = true;
      setSelectionRect(selectionRectFor(drag.startX, drag.startY, event.clientX, event.clientY));
    };
    const handleRelease = event => {
      const drag = selectionDragRef.current;
      if (!drag || (event?.pointerId != null && drag.pointerId !== event.pointerId)) return;
      const active = drag.active;
      const selection = selectionInteractionRef.current;
      if (active && selection) {
        const left = Math.min(drag.startX, drag.latestX || drag.startX);
        const right = Math.max(drag.startX, drag.latestX || drag.startX);
        const top = Math.min(drag.startY, drag.latestY || drag.startY);
        const bottom = Math.max(drag.startY, drag.latestY || drag.startY);
        const ids = [];
        laneScrollRef.current?.querySelectorAll?.("[data-clip-id]").forEach(node => {
          const bounds = node.getBoundingClientRect();
          if (bounds.right > left && bounds.left < right && bounds.bottom > top && bounds.top < bottom) {
            const id = node.dataset.clipId;
            if (id && !ids.includes(id)) ids.push(id);
          }
        });
        selection.commitClipSelection(ids, { additive: drag.additive, primaryClipId: ids.at(-1) || "" });
      } else if (!drag.additive && selection) {
        selection.commitClipSelection([]);
      }
      try {
        if (drag.captureTarget?.hasPointerCapture?.(drag.pointerId)) {
          drag.captureTarget.releasePointerCapture(drag.pointerId);
        }
      } catch {
        // Pointer capture may already be released by the browser.
      }
      selectionDragRef.current = null;
      setSelectionRect(null);
    };
    const handlePointerMove = event => {
      const drag = selectionDragRef.current;
      if (drag && drag.pointerId === event.pointerId) {
        drag.latestX = event.clientX;
        drag.latestY = event.clientY;
      }
      handleMove(event);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") handleRelease();
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handleRelease);
    window.addEventListener("pointercancel", handleRelease);
    window.addEventListener("blur", handleRelease);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handleRelease);
      window.removeEventListener("pointercancel", handleRelease);
      window.removeEventListener("blur", handleRelease);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return undefined;
    const updateWidth = () => setTrackWidth(Math.max(1, node.getBoundingClientRect().width));
    updateWidth();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(updateWidth) : null;
    observer?.observe(node);
    window.addEventListener("resize", updateWidth);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  useEffect(() => {
    const previousDuration = previousDurationRef.current;
    previousDurationRef.current = authoredDuration;
    setViewRange(previous => {
      const wasFit = previous.start <= 1e-9 && Math.abs(previous.end - previousDuration) <= Math.max(1e-9, previousDuration * 1e-6);
      if (wasFit) return { start: 0, end: authoredDuration };
      const width = Math.min(authoredDuration, Math.max(1 / Math.max(1, fps), previous.end - previous.start));
      const start = clamp(previous.start, 0, Math.max(0, authoredDuration - width));
      return { start, end: start + width };
    });
  }, [authoredDuration, fps]);

  useEffect(() => {
    if (!followPlayhead) return;
    setViewRange(previous => followTimelineViewRange(previous, currentTime, safeDuration, true));
  }, [currentTime, followPlayhead, safeDuration]);

  const interactionRef = useRef(null);
  interactionRef.current = {
    fps,
    displayMode,
    loopEnd,
    loopStart,
    onClipEdit,
    onLoopChange,
    onSeek,
    onSeekCommit,
    onTimelineClipEdit,
    safeDuration,
    signature,
    tempo,
    viewEnd,
    viewStart,
  };

  const timeFromPointer = useCallback(clientX => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect?.width) return 0;
    return clamp(viewStart + (clientX - rect.left) / rect.width * viewDuration, viewStart, viewEnd);
  }, [viewDuration, viewEnd, viewStart]);

  useEffect(() => {
    const releaseDrag = event => {
      const drag = dragRef.current;
      if (!drag || (event?.pointerId != null && drag.pointerId !== event.pointerId)) return;
      if (drag.kind === "playhead" && Number.isFinite(drag.time)) {
        interactionRef.current.onSeekCommit(drag.time);
      }
      if (drag.kind?.startsWith?.("clip-") && drag.latestTiming) {
        if (drag.timelineClip) {
          interactionRef.current.onTimelineClipEdit(drag.clipId, drag.latestTiming);
        } else {
          interactionRef.current.onClipEdit(drag.elementId, drag.clipId, drag.latestTiming, { commitToHistory: true });
        }
        setClipPreviewTimings(previous => {
          const next = new Map(previous);
          next.delete(drag.clipId);
          return next;
        });
      }
      try {
        if (drag.captureTarget?.hasPointerCapture?.(drag.pointerId)) {
          drag.captureTarget.releasePointerCapture(drag.pointerId);
        }
      } catch {
        // Pointer capture may already be released by the browser.
      }
      dragRef.current = null;
    };
    const handleMove = event => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const {
        fps: currentFps,
        loopEnd: currentLoopEnd,
        loopStart: currentLoopStart,
        onLoopChange: changeLoop,
        onSeek: seek,
        safeDuration: currentDuration,
      } = interactionRef.current;
      if (drag.kind.startsWith("zoom-")) {
        const rect = zoomRef.current?.getBoundingClientRect();
        if (!rect?.width) return;
        const delta = (event.clientX - drag.clientX) / rect.width * currentDuration;
        const minimumWidth = Math.max(1 / Math.max(1, currentFps), currentDuration / 1000);
        if (drag.kind === "zoom-pan") {
          const width = drag.end - drag.start;
          const start = clamp(drag.start + delta, 0, Math.max(0, currentDuration - width));
          setViewRange({ start, end: start + width });
        } else if (drag.kind === "zoom-start") {
          setViewRange({ start: clamp(drag.start + delta, 0, drag.end - minimumWidth), end: drag.end });
        } else if (drag.kind === "zoom-end") {
          setViewRange({ start: drag.start, end: clamp(drag.end + delta, drag.start + minimumWidth, currentDuration) });
        }
        return;
      }
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect?.width) return;
      const currentViewStart = interactionRef.current.viewStart;
      const currentViewEnd = interactionRef.current.viewEnd;
      const currentViewDuration = currentViewEnd - currentViewStart;
      const rawTime = clamp(currentViewStart + (event.clientX - rect.left) / rect.width * currentViewDuration, currentViewStart, currentViewEnd);
      if (drag.kind.startsWith("clip-")) {
        const delta = (event.clientX - drag.clientX) / rect.width * currentViewDuration;
        const snapLevel = snapLevelFromPointer(event);
        const snap = value => snapLevel
          ? snapTimelineTime(value, currentDuration, interactionRef.current.displayMode, interactionRef.current, snapLevel)
          : value;
        const minimumDuration = 1 / Math.max(1, currentFps);
        const original = drag.timing;
        let timing = original;
        if (drag.kind === "clip-body") {
          const start = Math.max(0, snap(original.start + delta));
          timing = { ...original, start, startValue: `${start} s` };
        } else if (drag.kind === "clip-start") {
          const end = original.start + original.duration;
          const start = clamp(snap(original.start + delta), 0, end - minimumDuration);
          const removed = start - original.start;
          const duration = end - start;
          timing = {
            ...original,
            start,
            startValue: `${start} s`,
            duration,
            durationValue: `${duration} s`,
            sourceOffset: Math.max(0, original.sourceOffset + removed * original.rate),
            ...(event.altKey ? { rate: original.duration * original.rate / duration } : {}),
          };
        } else if (drag.kind === "clip-end") {
          const end = Math.max(original.start + minimumDuration, snap(original.start + original.duration + delta));
          const duration = end - original.start;
          timing = {
            ...original,
            duration,
            durationValue: `${duration} s`,
            ...(event.altKey ? { rate: original.duration * original.rate / duration } : {}),
          };
        }
        drag.latestTiming = timing;
        setClipPreviewTimings(previous => new Map(previous).set(drag.clipId, timing));
        return;
      }
      // The playhead has a generous label-sized target. Preserve where within
      // that target it was grabbed so the marker does not jump under the
      // pointer before the user begins dragging.
      const offsetTime = drag.kind === "playhead" ? (drag.playheadOffset || 0) : 0;
      const offsetRawTime = clamp(rawTime + offsetTime, currentViewStart, currentViewEnd);
      const snapLevel = snapLevelFromPointer(event);
      const time = snapLevel && drag.kind !== "loop-range"
        ? snapTimelineTime(offsetRawTime, currentDuration, interactionRef.current.displayMode, interactionRef.current, snapLevel)
        : offsetRawTime;
      if (drag.kind === "playhead") {
        drag.time = time;
        seek(time);
      } else if (drag.kind === "loop-start") {
        changeLoop(Math.min(time, currentLoopEnd - 1 / currentFps), currentLoopEnd);
      } else if (drag.kind === "loop-end") {
        changeLoop(currentLoopStart, Math.max(time, currentLoopStart + 1 / currentFps));
      } else if (drag.kind === "loop-range") {
        const width = drag.end - drag.start;
        const rawStart = clamp(time - drag.offset, 0, Math.max(0, currentDuration - width));
        const nextStart = snapLevel
          ? clamp(snapTimelineTime(rawStart, currentDuration, interactionRef.current.displayMode, interactionRef.current, snapLevel), 0, Math.max(0, currentDuration - width))
          : rawStart;
        changeLoop(nextStart, nextStart + width);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") releaseDrag();
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", releaseDrag);
    window.addEventListener("pointercancel", releaseDrag);
    window.addEventListener("blur", releaseDrag);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", releaseDrag);
      window.removeEventListener("pointercancel", releaseDrag);
      window.removeEventListener("blur", releaseDrag);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const beginDrag = (event, drag) => {
    if (event.button !== 0) return false;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      ...drag,
      pointerId: event.pointerId,
      captureTarget: event.currentTarget,
    };
    return true;
  };

  const fitWholeTimeline = useCallback(() => setViewRange({ start: 0, end: safeDuration }), [safeDuration]);
  const fitLoop = useCallback(() => {
    if (loopEnd <= loopStart) return;
    const minimumWidth = Math.max(1 / Math.max(1, fps), safeDuration / 1000);
    const start = clamp(loopStart, 0, Math.max(0, safeDuration - minimumWidth));
    const end = clamp(loopEnd, start + minimumWidth, safeDuration);
    setViewRange({
      start,
      end,
    });
  }, [fps, loopEnd, loopStart, safeDuration]);
  const beginZoomDrag = (event, kind) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    if (event.metaKey) {
      event.preventDefault();
      fitWholeTimeline();
      return;
    }
    if (event.altKey) {
      event.preventDefault();
      fitLoop();
      return;
    }
    beginDrag(event, {
      kind,
      clientX: event.clientX,
      start: viewStart,
      end: viewEnd,
    });
  };

  const startPlayheadDrag = event => {
    if (event.button !== 0) return;
    timelineRef.current?.focus?.({ preventScroll: true });
    const rawTime = timeFromPointer(event.clientX);
    const snapLevel = snapLevelFromPointer(event);
    const time = snapLevel ? snapTimelineTime(rawTime, safeDuration, displayMode, options, snapLevel) : rawTime;
    if (event.shiftKey) {
      onLoopEnabledChange(true);
      onLoopChange(time, Math.min(safeDuration, time + Math.max(1 / fps, safeDuration * 0.01)));
      beginDrag(event, { kind: "loop-end" });
      return;
    }
    onSeek(time);
    beginDrag(event, { kind: "playhead", time });
  };

  const startBlockSelection = event => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    timelineRef.current?.focus?.({ preventScroll: true });
    selectionDragRef.current = {
      pointerId: event.pointerId,
      captureTarget: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      latestX: event.clientX,
      latestY: event.clientY,
      additive: event.shiftKey || event.metaKey || event.ctrlKey,
      active: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const grabExistingPlayhead = event => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const rawTime = timeFromPointer(event.clientX);
    beginDrag(event, {
      kind: "playhead",
      time: livePositionRef.current,
      // The hit target intentionally extends over the frame label, which is
      // offset to the right of the line. Holding this offset keeps a label
      // drag anchored to the current playhead until it is moved.
      playheadOffset: livePositionRef.current - rawTime,
    });
  };

  const percentInView = time => (time - viewStart) / viewDuration * 100;
  // The continuously moving playhead does not need to reconcile clip/ruler DOM.
  // React handles edits/follow-range updates; rAF touches only these two elements.
  const livePositionRef=useRef(currentTime);livePositionRef.current=currentTime;
  useEffect(()=>{
    if(!clock)return;
    let frame=0;
    const paint=()=>{if(!visible||visible()){const t=clock.read().seconds;livePositionRef.current=t;const percent=(t-viewStart)/viewDuration*100,show=t>=viewStart&&t<=viewEnd;for(const el of trackRef.current?.querySelectorAll('.iannix-timeline-playhead,.iannix-timeline-playhead-hitbox')??[]){el.style.left=`${percent}%`;el.style.visibility=show?'visible':'hidden';}const label=trackRef.current?.querySelector('.iannix-timeline-playhead span');if(label){const next=formatTimelinePosition(t,'frame',options);if(label.textContent!==next)label.textContent=next;}}frame=requestAnimationFrame(paint);};
    frame=requestAnimationFrame(paint);return()=>cancelAnimationFrame(frame);
  },[clock,viewStart,viewDuration,viewEnd,options,visible]);
  const playheadVisible = currentTime >= viewStart && currentTime <= viewEnd;
  const playheadPercent = percentInView(currentTime);
  const visibleLoopStart = clamp(loopStart, viewStart, viewEnd);
  const visibleLoopEnd = clamp(loopEnd, viewStart, viewEnd);
  const loopVisible = loopEnabled && visibleLoopEnd > visibleLoopStart;
  const loopStartPercent = percentInView(visibleLoopStart);
  const loopEndPercent = percentInView(visibleLoopEnd);
  const zoomStartPercent = viewStart / safeDuration * 100;
  const zoomEndPercent = viewEnd / safeDuration * 100;
  const readTimelineDrop = (event, type) => {
    try {
      const value = event.dataTransfer.getData(type);
      return value ? JSON.parse(value) : null;
    } catch { return null; }
  };
  const handleTimelineDrop = (event, trackId) => {
    event.preventDefault();
    event.stopPropagation();
    setDropTrackId("");
    const historyAction = readTimelineDrop(event, "application/x-underscores-history-action");
    const source = readTimelineDrop(event, "application/x-underscores-timeline-source");
    const elementIds = readTimelineDrop(event, "application/x-underscores-elements");
    const payload = historyAction
      ? { source: "history", historyAction }
      : source || (Array.isArray(elementIds) && elementIds.length ? { source: "element", elementIds } : null);
    if (payload) onTimelineClipDrop(payload, timeFromPointer(event.clientX), trackId);
  };
  const renderTimelineClip = (clip, row) => {
    const timing = clipPreviewTimings.get(clip.id) || clip.timing || {};
    const start = Math.max(0, Number(timing.start) || 0);
    const duration = timing.durationMode === "hold"
      ? Math.max(1 / Math.max(1, fps), safeDuration - start)
      : Math.max(1 / Math.max(1, fps), Number(timing.duration) || 0);
    const end = start + duration;
    if (end < viewStart || start > viewEnd) return null;
    const selected = selectedClipSet.has(clip.id) || selectedClipId === clip.id;
    const beginClipDrag = (event, kind) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      // Keep keyboard editing owned by the timeline after a clip click. If we
      // leave focus on the last toolbar button, Backspace/Delete is consumed
      // by the browser or canvas instead of deleting the selected clip.
      timelineRef.current?.focus?.({ preventScroll: true });
      selectClip(event, clip.id);
      beginDrag(event, {
        kind,
        timelineClip: true,
        elementId: clip.elementId || "",
        clipId: clip.id,
        clientX: event.clientX,
        timing: { ...timing, start, duration, sourceOffset: Math.max(0, Number(timing.sourceOffset) || 0), rate: Math.max(0.0001, Number(timing.rate) || 1) },
      });
    };
    return <button
      type="button"
      key={`${row.id}:${clip.id}`}
      className={`iannix-arrangement-clip timeline-clip${selected ? " selected" : ""}${timing.loopMode === "loop" ? " loop" : ""}`}
      style={{ left: `${percentInView(Math.max(start, viewStart))}%`, width: `${Math.max(0.2, percentInView(Math.min(end, viewEnd)) - percentInView(Math.max(start, viewStart)))}%` }}
      data-clip-id={clip.id}
      onPointerDown={event => beginClipDrag(event, "clip-body")}
      onDoubleClick={event => { event.stopPropagation(); onTimelineClipEdit(clip.id, { ...timing, loopMode: timing.loopMode === "loop" ? "once" : "loop" }); }}
      title={`${clip.label || row.name} · ${formatTimelinePosition(start, displayMode, options)}`}
      aria-label={`${clip.label || row.name} clip`}
      aria-pressed={selected}
    >
      <i className="iannix-arrangement-clip-handle start" onPointerDown={event => beginClipDrag(event, "clip-start")} />
      <span>{clip.label || row.name}</span>
      <i className="iannix-arrangement-clip-handle end" onPointerDown={event => beginClipDrag(event, "clip-end")} />
    </button>;
  };
  const showArrangement = timelineMode !== "clips" && arrangementRows.length;
  const showTimeline = timelineMode === "clips" && timelineRows.length;
  const renderArrangementClip = (clip, row) => {
    const timing = clipPreviewTimings.get(clip.id) || clip.timing || {};
    const start = Math.max(0, Number(timing.start) || 0);
    const duration = timing.durationMode === "hold"
      ? Math.max(1 / Math.max(1, fps), safeDuration - start)
      : Math.max(1 / Math.max(1, fps), Number(timing.duration) || 0);
    const end = start + duration;
    if (end < viewStart || start > viewEnd) return null;
    const visibleStart = Math.max(start, viewStart);
    const visibleEnd = Math.min(end, viewEnd);
    const elementId = clip.elementId || row.elementId;
    const selected = selectedClipSet.has(clip.id) || selectedClipId === clip.id;
    const label = row.kind === "take" ? (clip.elementLabel || row.label) : row.label;
    const beginClipDrag = (event, kind) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      timelineRef.current?.focus?.({ preventScroll: true });
      selectClip(event, clip.id);
      beginDrag(event, {
        kind,
        elementId,
        clipId: clip.id,
        clientX: event.clientX,
        timing: {
          ...timing,
          start,
          duration,
          sourceOffset: Math.max(0, Number(timing.sourceOffset) || 0),
          rate: Math.max(0.0001, Number(timing.rate) || 1),
        },
      });
    };
    return (
      <button
        type="button"
        key={`${row.id}:${clip.id}`}
        className={`iannix-arrangement-clip${selected ? " selected" : ""}${timing.loopMode === "loop" ? " loop" : ""}`}
        style={{ left: `${percentInView(visibleStart)}%`, width: `${Math.max(0.2, percentInView(visibleEnd) - percentInView(visibleStart))}%` }}
        data-clip-id={clip.id}
        onPointerDown={event => beginClipDrag(event, "clip-body")}
        onDoubleClick={event => {
          event.stopPropagation();
          onClipEdit(elementId, clip.id, { ...timing, loopMode: timing.loopMode === "loop" ? "once" : "loop" }, { commitToHistory: true });
        }}
        title={`${label} · ${formatTimelinePosition(start, displayMode, options)}`}
        aria-label={`${label} clip`}
        aria-pressed={selected}
      >
        <i className="iannix-arrangement-clip-handle start" onPointerDown={event => beginClipDrag(event, "clip-start")} />
        <span>{label}</span>
        <i className="iannix-arrangement-clip-handle end" onPointerDown={event => beginClipDrag(event, "clip-end")} />
      </button>
    );
  };
  return (
    <div
      ref={timelineRef}
      className={`iannix-timeline${showArrangement || showTimeline ? " has-arrangement" : ""}${timelineMode === "clips" ? " clip-mode" : ""}${arrangementLabelsCollapsed ? " arrangement-labels-collapsed" : ""}`}
      style={{ "--arrangement-label-width": arrangementLabelsCollapsed ? "30px" : timelineMode === "clips" ? "160px" : "116px" }}
      aria-label="Score timeline"
      tabIndex={-1}
      onKeyDown={handleTimelineKeyDown}
    >
      <div className="iannix-timeline-ruler">
        {(showArrangement || showTimeline) ? <button
          type="button"
          className="iannix-arrangement-label-toggle"
          onClick={() => setArrangementLabelsCollapsed(value => !value)}
          aria-label={arrangementLabelsCollapsed ? "Expand arrangement labels" : "Collapse arrangement labels"}
          title={arrangementLabelsCollapsed ? "Expand arrangement labels" : "Collapse arrangement labels"}
        >{arrangementLabelsCollapsed ? "›" : "‹"}</button> : null}
        {ticks.map(tick => (
          <div className={`iannix-timeline-tick ${tick.major ? "major" : "minor"}`} key={tick.time} style={{ left: `${tick.percent}%` }}>
            {tick.showLabel !== false ? <span>{formatTimelinePosition(tick.time, displayMode, options)}</span> : null}
          </div>
        ))}
      </div>
      <div
        ref={trackRef}
        className="iannix-timeline-track"
        onPointerDown={startPlayheadDrag}
        title="Drag to seek · Command-drag snaps units · Command-Shift snaps subunits · Shift-drag marks a loop · Shift-click clips to extend selection"
      >
        {ticks.map(tick => <i className={`iannix-timeline-gridline ${tick.major ? "major" : "minor"}`} key={tick.time} style={{ left: `${tick.percent}%` }} />)}
        {showTimeline ? <div ref={laneScrollRef} className="iannix-arrangement-lanes" onPointerDown={event => event.stopPropagation()}>
          {timelineRows.map(row => (
            <div className={`iannix-arrangement-row timeline-track ${dropTrackId === row.id ? "drop-target" : ""}`} key={row.id} data-track-id={row.id}>
              <div className="iannix-arrangement-row-label timeline-track-label">
                <input aria-label={`Timeline track ${row.name}`} value={row.name} onChange={event => onTimelineTrackPatch(row.id, { name: event.target.value })} onPointerDown={event => event.stopPropagation()} />
                <span className="timeline-track-actions" onPointerDown={event => event.stopPropagation()}>
                  <button type="button" onClick={() => onTimelineTrackMove(row.id, -1)} title="Move track earlier" aria-label={`Move ${row.name} earlier`}>↑</button>
                  <button type="button" onClick={() => onTimelineTrackMove(row.id, 1)} title="Move track later" aria-label={`Move ${row.name} later`}>↓</button>
                  <button type="button" className={row.muted ? "active" : ""} onClick={() => onTimelineTrackPatch(row.id, { muted: !row.muted })} title={row.muted ? "Unmute track" : "Mute track"} aria-label={`${row.muted ? "Unmute" : "Mute"} ${row.name}`}>M</button>
                  <button type="button" className={row.solo ? "active" : ""} onClick={() => onTimelineTrackPatch(row.id, { solo: !row.solo })} title={row.solo ? "Unsolo track" : "Solo track"} aria-label={`${row.solo ? "Unsolo" : "Solo"} ${row.name}`}>S</button>
                </span>
              </div>
              <div className="iannix-arrangement-row-track" onPointerDown={startBlockSelection} onDragOver={event => { event.preventDefault(); setDropTrackId(row.id); }} onDragLeave={() => setDropTrackId(current => current === row.id ? "" : current)} onDrop={event => handleTimelineDrop(event, row.id)} aria-label={`Drop clips on ${row.name}`} title={`Drop history actions or canvas objects on ${row.name}`}>
                {row.clips.map(clip => renderTimelineClip(clip, row))}
              </div>
            </div>
          ))}
        </div> : showArrangement ? <div ref={laneScrollRef} className="iannix-arrangement-lanes" onPointerDown={event => event.stopPropagation()}>
          {arrangementRows.map(row => (
            <div className={`iannix-arrangement-row ${row.kind}`} key={row.id} data-element-id={row.elementId || undefined}>
              <div className="iannix-arrangement-row-label">
                {row.kind === "take" ? <button
                  type="button"
                  onClick={() => setExpandedTakeIds(previous => {
                    const next = new Set(previous);
                    if (next.has(row.id)) next.delete(row.id); else next.add(row.id);
                    return next;
                  })}
                  title={expandedTakeIds.has(row.id) ? "Collapse take" : "Expand take"}
                  aria-expanded={expandedTakeIds.has(row.id)}
                ><span className="iannix-arrangement-take-chevron">{expandedTakeIds.has(row.id) ? "▾" : "▸"}</span><span className="iannix-arrangement-take-label">{row.label}</span></button> : <span className="iannix-arrangement-object-label">{row.label}</span>}
                {row.kind === "take" ? <span className="iannix-arrangement-take-actions">
                  <button type="button" className={row.take.muted ? "active" : ""} onClick={() => onTakePatch(row.id, { muted: !row.take.muted })} title="Mute take">M</button>
                  <button type="button" className={row.take.solo ? "active" : ""} onClick={() => onTakePatch(row.id, { solo: !row.take.solo })} title="Solo take">S</button>
                  <button type="button" onClick={() => onTakeDelete(row.id)} title="Delete take">×</button>
                </span> : null}
              </div>
              <div className="iannix-arrangement-row-track" onPointerDown={startBlockSelection} aria-label="Drag across clips to select a block" title="Drag across clips to select a block; Shift-click adds a range">
                {row.kind === "take" && expandedTakeIds.has(row.id)
                  ? null
                  : row.clips.map(clip => renderArrangementClip(clip, row))}
              </div>
            </div>
          ))}
        </div> : null}
        {selectionRect ? <div
          className="iannix-timeline-selection-rect"
          style={selectionRect}
          aria-hidden="true"
        /> : null}
        <div className="iannix-timeline-key-lane" aria-label="Object automation keyframes">
          {automationKeys.filter(key => key.time >= viewStart && key.time <= viewEnd).map(key => <i key={`${key.elementId}-${key.path}-${key.id}`} className="iannix-timeline-key" style={{ left: `${percentInView(key.time)}%` }} title={`${key.path} · ${formatTimelinePosition(key.time, displayMode, options)}`} />)}
        </div>
        <div className="iannix-walkthrough-marker-lane" aria-label="Guided walkthrough steps">
          {walkthroughMarkers.filter(marker => marker.time >= viewStart && marker.time <= viewEnd).map(marker => <i
            key={marker.id}
            className={`iannix-walkthrough-marker${marker.active ? " active" : ""}`}
            style={{ left: `${percentInView(marker.time)}%` }}
            title={`${marker.title} · ${formatTimelinePosition(marker.time, displayMode, options)}`}
          />)}
        </div>
        {loopVisible ? (
          <>
            <button
              type="button"
              className="iannix-timeline-loop-range"
              style={{ left: `${loopStartPercent}%`, width: `${Math.max(0, loopEndPercent - loopStartPercent)}%` }}
              onPointerDown={event => {
                event.stopPropagation();
                const time = timeFromPointer(event.clientX);
                beginDrag(event, { kind: "loop-range", start: loopStart, end: loopEnd, offset: time - loopStart });
              }}
              aria-label="Move loop range"
              title="Drag loop range"
            />
            {loopStart >= viewStart && loopStart <= viewEnd ? <button
                type="button"
                className="iannix-timeline-loop-handle start"
                style={{ left: `${percentInView(loopStart)}%` }}
                onPointerDown={event => {
                  event.stopPropagation();
                  beginDrag(event, { kind: "loop-start" });
                }}
                aria-label="Set loop start"
                title={`Loop start ${formatTimelinePosition(loopStart, displayMode, options)}`}
              /> : null}
            {loopEnd >= viewStart && loopEnd <= viewEnd ? <button
                type="button"
                className="iannix-timeline-loop-handle end"
                style={{ left: `${percentInView(loopEnd)}%` }}
                onPointerDown={event => {
                  event.stopPropagation();
                  beginDrag(event, { kind: "loop-end" });
                }}
                aria-label="Set loop end"
                title={`Loop end ${formatTimelinePosition(loopEnd, displayMode, options)}`}
              /> : null}
          </>
        ) : null}
        {(playheadVisible||clock) ? <>
          <div className="iannix-timeline-playhead" style={{ left: `${playheadPercent}%` }} aria-hidden="true">
            <span>{formatTimelinePosition(currentTime, "frame", options)}</span>
          </div>
          <button
            type="button"
            className="iannix-timeline-playhead-hitbox"
            style={{ left: `${playheadPercent}%` }}
            onPointerDown={grabExistingPlayhead}
            aria-label={`Drag playhead at ${formatTimelinePosition(currentTime, "frame", options)}`}
            title="Drag playhead"
          />
        </> : null}
      </div>
      <div
        ref={zoomRef}
        className="iannix-timeline-zoom"
        role="group"
        aria-label="Timeline zoom window"
        title="Drag to pan · Drag edges to zoom · Command-click fits score · Option-click fits loop"
        onPointerDown={event => {
          if (event.metaKey || event.altKey) beginZoomDrag(event, "zoom-pan");
        }}
      >
        <div
          className="iannix-timeline-zoom-window"
          style={{ left: `${zoomStartPercent}%`, width: `${Math.max(0.2, zoomEndPercent - zoomStartPercent)}%` }}
          onPointerDown={event => beginZoomDrag(event, "zoom-pan")}
        >
          <button type="button" className="iannix-timeline-zoom-handle start" aria-label="Resize timeline view from start" onPointerDown={event => beginZoomDrag(event, "zoom-start")} />
          <button type="button" className="iannix-timeline-zoom-handle end" aria-label="Resize timeline view from end" onPointerDown={event => beginZoomDrag(event, "zoom-end")} />
        </div>
      </div>
    </div>
  );
});

export default TransportTimeline;
