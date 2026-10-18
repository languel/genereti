// Adapted from Underscores' TimeValueInput. See UNDERSCORES-LICENSE and README.md.
// A text field for time expressions ("2 bars", "250 ms", "00:00:04:12", "480 ticks"): Enter commits, Esc
// reverts, drag sideways to scrub, Shift for fine steps, Shift+Backspace resets. The caller chooses the
// notation by passing `value` as an expression; the Underscores route/menu extras are not ported.
import React, {useEffect, useRef, useState} from 'react';
import {adjustTimeValue, createTimeValue, formatTimeValueForDisplay, parseTimeValue, resolveTimeValue} from '../web/core/timeValue.js';

export default function TimeValueInput({value, context, defaultValue = '0 s', onChange, onCommit, minSeconds = 0, disabled = false, className = '', ...inputProps}) {
  const normalized = createTimeValue(value, undefined, context);
  const [draft, setDraft] = useState(normalized.expression);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null), startRef = useRef(normalized), dragRef = useRef(null);

  useEffect(() => { if (document.activeElement !== inputRef.current && !dragRef.current) setDraft(normalized.expression); }, [normalized.expression]);

  const emit = (next, commit = false) => {
    const seconds = Math.max(minSeconds, resolveTimeValue(next, context));
    const out = {...next, fallbackSeconds: seconds};
    setDraft(out.expression); onChange?.(out, seconds); if (commit) onCommit?.(out, seconds);
    return out;
  };
  const commitDraft = () => {
    const parsed = parseTimeValue(draft, context);
    if (!parsed.ok || parsed.descriptor.seconds < minSeconds) { setDraft(startRef.current.expression); return false; }
    emit(parsed.value, true); startRef.current = parsed.value; return true;
  };
  const pointerDown = event => {
    if (event.button !== 0 || disabled || focused) return;
    const parsed = parseTimeValue(draft, context); if (!parsed.ok) return;
    startRef.current = parsed.value;
    dragRef.current = {pointerId: event.pointerId, startX: event.clientX, value: parsed.value, dragged: false, lastSteps: 0};
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const pointerMove = event => {
    const drag = dragRef.current; if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    if (!drag.dragged && Math.abs(deltaX) < 3) return;
    drag.dragged = true; event.preventDefault();
    const steps = Math.trunc(deltaX / 4); if (steps === drag.lastSteps) return;
    drag.lastSteps = steps;
    const next = adjustTimeValue(drag.value, steps, {context, fine: event.shiftKey});
    if (resolveTimeValue(next, context) >= minSeconds) emit(next);
  };
  const pointerUp = event => {
    const drag = dragRef.current; if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (drag.dragged) { const parsed = parseTimeValue(draft, context); if (parsed.ok) emit(parsed.value, true); }
    else { event.currentTarget.focus(); event.currentTarget.select(); }
    dragRef.current = null;
  };
  const keyDown = event => {
    event.stopPropagation();
    if (event.key === 'Backspace' && event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault(); const next = createTimeValue(defaultValue, undefined, context); emit(next, true); startRef.current = next;
    } else if (event.key === 'Enter') { event.preventDefault(); commitDraft(); event.currentTarget.blur(); }
    else if (event.key === 'Escape') { event.preventDefault(); setDraft(startRef.current.expression); event.currentTarget.blur(); }
    inputProps.onKeyDown?.(event);
  };
  const valid = parseTimeValue(draft, context);
  return <input {...inputProps} ref={inputRef} type="text" inputMode="text" className={`genereti-time-input ${className}`.trim()} disabled={disabled}
    value={focused ? draft : formatTimeValueForDisplay(draft)}
    aria-invalid={!valid.ok || valid.descriptor.seconds < minSeconds ? 'true' : undefined}
    title={`${inputProps.title ? inputProps.title + ' · ' : ''}Type a time (2 bars, 250 ms, 00:00:04:12, 480 ticks) · drag to scrub · Shift: fine`}
    onFocus={() => { startRef.current = createTimeValue(value, undefined, context); setDraft(normalized.expression); setFocused(true); }}
    onChange={event => setDraft(event.target.value)} onBlur={() => { commitDraft(); setFocused(false); }}
    onKeyDown={keyDown} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}/>;
}
