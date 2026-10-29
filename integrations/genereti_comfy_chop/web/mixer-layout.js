// Preserve socket indices: a connection to input 8 needs strips 1 through 8.
export function mixerChannelCount(inputs = []) {
  return Math.max(1, ...inputs.filter(input => /^input_[1-8]$/.test(input.name) && input.link != null).map(input => Number(input.name.slice(6))));
}
