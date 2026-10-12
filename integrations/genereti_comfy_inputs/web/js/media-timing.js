// Playback speed changes media time; sampling independently limits publication.
export function playbackSpeed(value){return Math.max(.1,Math.min(4,Number(value)||1));}
export function gifDelay(duration,speed){return Math.max(10,(duration||100000)/1000)/playbackSpeed(speed);}
