// Encode decoded audio as a 16-bit PCM WAV file. Pure: takes channel arrays, returns a Uint8Array.
export function encodeWav(channels, sampleRate) {
  const n = channels.length, frames = channels[0]?.length ?? 0, bytes = frames * n * 2, out = new DataView(new ArrayBuffer(44 + bytes));
  const text = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  text(0, 'RIFF'); out.setUint32(4, 36 + bytes, true); text(8, 'WAVE'); text(12, 'fmt '); out.setUint32(16, 16, true);
  out.setUint16(20, 1, true); out.setUint16(22, n, true); out.setUint32(24, sampleRate, true); out.setUint32(28, sampleRate * n * 2, true);
  out.setUint16(32, n * 2, true); out.setUint16(34, 16, true); text(36, 'data'); out.setUint32(40, bytes, true);
  let o = 44;
  for (let i = 0; i < frames; i++) for (let c = 0; c < n; c++) { const s = Math.max(-1, Math.min(1, channels[c][i] || 0)); out.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
  return new Uint8Array(out.buffer);
}
export const recordingName = (id, date = new Date()) => `mod-output-${id}-${date.toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-')}`;
export const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
