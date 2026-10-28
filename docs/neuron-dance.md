# Neuron Dance: a generative music-video experiment

Open **Workflows → Genereti → ꘇ-Neuron-Dance** after restarting Comfy and refreshing the browser. This is a separate copy of the Braindance song, with a 16-bar project loop, audio analysis, a stereo Lissajous trace, and a p5 neuron-like visual driven by the mix RMS. Press Start on `mod.output` yourself, then play the transport. The patch contains no model dependencies.

At 172 BPM in 4/4, 16 bars last approximately **22.326 seconds**. The project loop uses seconds; if you change tempo, change its end to `16 × 4 × 60 / BPM`. Open the p5 node with Alt+W. Its sensitivity is editable, and its code uses project time and incoming sound energy. The Lissajous shows the actual stereo signal; centered mono can appear as a diagonal. Experiment with the mixer, notes, drum grid and effects.

## Capture and automation today

The **ꘇ live recorder** is wired to the p5 image and `mod.output`. Start audio and play the transport first. Choose **Audio + video**, **Video only**, or **Audio only**. In **Manual** mode, ● starts immediately and ■ stops and saves. In **One project loop** mode, ● arms the recorder, starts at the next loop wrap, and saves at the following wrap. Press ■ to cancel an armed take or stop an active one. Changing or pausing the transport cancels an armed take or saves an active partial take.

The recording downloads as WebM, or MP4 when that is the available browser encoder. Audio/video are captured in one browser MediaRecorder stream. Capture uses browser timing rather than an offline frame renderer; boundary timing and synchronization are not sample-exact, and long or backgrounded captures may drop frames. No sound starts automatically: the connected `mod.output` must already be running. The recorder takes its audio after that output's level and mute. Video uses the live browser IMAGE, capped at 1280 pixels on the longest side, at the selected 15, 24, or 30 fps. Keep the tab active.

In the performance dock, select a numeric parameter and record a take while playing; its clip is saved in the workflow and can play back with the transport. Record one parameter per take. The separate record button on `mod.output` remains available for an audio-only take, normally WAV.

## LTX-Video 0.9.8: video-to-video

The existing local `lb_ltx_v2v_strong-edit.workflow.json` or `/Users/liuboto/dev/comfies/workflows/ltx_v2v.workflow.json` provides a starting point: load a short captured video, encode its frames, sample with the LTX-Video 2B 0.9.8 distilled checkpoint, decode, and save. Use a low-to-moderate denoise first (try 0.25–0.3) to retain more of the source movement; results may vary. The local reference requires `ltxv-2b-0.9.8-distilled.safetensors` and `t5xxl_fp16.safetensors`. Render short clips before attempting the whole loop. The LTX output is silent; attach the original music in an editor. It transforms a batch of frames with a video model, not independent image-generation calls for each frame.

Prompt idea: *A luminous network of dancing neurons, electric cyan and ultraviolet filaments pulsating in dark space, abstract liquid light and intricate rhythmic connections, energetic experimental VJ film. Preserve the source movement and composition, no text or faces.*

## FastH3 OmniRef: reference-to-video

The local `lb-video_fasth3_ominiref_r2v-Mac-quick.json` is a separate reference-to-video experiment. The existing workflow uses a reference image; its model node also exposes optional reference video/audio inputs when supported by the installed Comfy version. Supply a suitable captured image or clip using the corresponding loader and inputs, and describe the desired motion. Reference conditioning does **not** guarantee that the model follows every input frame or preserves the performance timing. The model can generate its own audio; keep or replace it with the original recorded music in editing. FastH3 has much larger model requirements and its local Mac draft has not been validated here. Use the notes in that workflow for exact model files, settings and compatibility.

## Missing for an integrated render

This patch does not yet have a multi-parameter recorder, deterministic frame exporter, model-specific one-click render, or automatic soundtrack assembly. A frame-by-frame image-model route would also require a temporal-consistency strategy. Do not treat the live preview or a single queued image as a captured 16-bar frame sequence.
