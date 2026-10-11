# Oscillator quick reference

**sample_rate** is samples per second. **samples** is the number of values in
each delivered block. Live block delivery targets `sample_rate / samples`,
limited by the browser's animation frames. Eight samples at 60 Hz produce
7.5 block updates/s; this is batching, not slow oscillator computation.

Use **samples = 1**, **sample_rate = 60** for responsive scalar modulation near
60 updates/s. Larger blocks are useful for inspecting a sampled signal. The
`value` output is the last sample in the block. Do not increase sample_rate
just to compensate for large blocks: that changes the represented sample spacing.

Wave, frequency, amplitude, offset and phase define the signal. Time/offset_t
shift its sample times. Queue evaluates the explicit block; Live advances time.
The preview can freeze or minimize independently while channels keep flowing.
