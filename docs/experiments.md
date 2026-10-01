# Art experiments: structure, color, and finish

Genereti's fast paths are deliberately small, one-step image models. They are useful as live image instruments, but a single model has to solve structure, color, and surface character at once. These experiments let you split those jobs into separate passes and combine the results.

## Start with two independent guides

1. Choose **Composite · SDXS + Canny · 256px** as the pipeline.
2. Draw or select the main input. SDXS uses this as the sketch/shape input.
3. Open **More controls → Canny shape source** and optionally choose a different image. The Canny branch extracts edges from this image; if none is selected, it uses the main input.
4. Set **Sketch influence** to control how tightly SDXS follows the main drawing. **Canny influence** controls edge adherence in the second branch.
5. In **More controls**, toggle **Invert SDXS sketch guide** and **Invert Canny guide** independently to reverse the light/dark values delivered to either branch. This changes the model's input guide, not the final layer mix. **View guide** shows the processed Canny map; the SDXS branch uses the main drawing.
6. Adjust **Layer mix · Canny**. At zero you see the SDXS branch; at one you see the SD-Turbo Canny branch. Crossfade is the easiest starting blend. Screen, multiply, and difference create more graphic interactions.
7. Open **Post-processing** and choose a separate **Palette reference** if desired. Palette transfer matches the reference image's overall Lab color distribution while leaving most of the generated light/dark structure intact. It does not understand objects or transfer brush technique.

The two model branches currently receive the same prompt. The SDXS branch can use its selected SDXS style; the Canny branch uses SD-Turbo. The output metrics report the combined inference time, so this mode costs roughly two model passes. The Canny composite is enabled only at resolutions where all of its model packages are installed. In the current local setup, that is 256px.

Guide inversion is also available on the standalone sketch, Canny, depth, and pose pipelines. It swaps black and white (and inverts each color channel for RGB guides) before the control model sees the guide. It is a polarity experiment: an inverted Canny map can make the control model interpret background and edges differently, but it does not create a filled-region mask. For actual hole/fill masks, use a segmentation or thresholded matte as an additional branch.

## What “influence” means

**Sketch influence** is the SDXS sketch ControlNet strength. The drawing is passed as a learned control image, while SDXS starts from a noise latent and generates a new frame. It is not a pixel-preservation amount or an opacity blend, so high values can produce strong structural adherence and also odd interior/exterior choices. The number field permits values above the slider's normal range for experiments.

**Image remix · SD-Turbo** is the current latent image-to-image route: it encodes the input image, adds noise according to **Transformation**, then predicts a new image in one step. Lower values retain more of the input; higher values allow more change. SDXS itself is one-step and its paper describes image-conditioned ControlNet translation, but the current local SDXS package is its sketch ControlNet path rather than a separate generic img2img checkpoint. A direct SDXS latent-remix mode is technically a useful follow-up experiment, not the behavior of the existing sketch influence control.

## Depth as a guide

Choose **Depth · SD-Turbo** to estimate a depth map from the current input and use that map as the ControlNet guide; the extraction is local and works on drawings, camera frames, or uploaded images. This standalone pipeline currently runs the Depth Anything V2 Small Transformers model on CPU before Core ML generation, so expect extra latency. Depth inversion reverses near/far brightness. The composite currently combines SDXS sketch with Canny; depth can be tested as its own mode today, while adding it as a third compositing branch would require another model pass and its own blend control.

On the development Mac, warmed composite frames took about 90–100 ms, roughly 10 frames/s. The first Canny use took about 4 seconds while Core ML loaded and warmed that branch; later frames were much faster. With the learned upscaler enabled, the composite measured about 155–160 ms per frame. These timings are specific to this installation and its current load; watch Genereti's FPS and latency readouts for your own setup.

## Try 512 × 512

Use **Model resolution** in the main controls. Genereti lists sizes whose base text model, encoder, and decoder packages are installed. Switching resolution releases the current engine, loads the selected Core ML packages, and warms the model before resuming. The first switch can take a while.

The current local `models/512/` folder contains the SDXS text and sketch packages, so it supports **Text to image · SDXS** and **Sketch ControlNet · SDXS**. It does not contain SD-Turbo or the Canny ControlNet packages, so image remix, Canny, depth, pose, and the two-branch composite are unavailable at 512px in this installation. Return to 256px for those pipelines. If you have converted more model packages for a resolution, the app enables the corresponding modes automatically.

512px gives the model more room for shape and texture, but it also means four times as many output pixels as 256px. Measure the live rate on your machine rather than expecting the 256px rate to carry over. Keep **Requests / second** below the measured generation rate if you want a stable live display.

On the development Mac, one 512px SDXS sketch request took about 50 ms and an initial text request took about 150 ms. Text prompts also need CPU-side encoding, so changing prompts can affect the rate.

## Finish the image after generation

Expand **Post-processing · feedback, color, texture, scale** to stack these operations:

- **Emboss** runs first, shaping relief before color, tone, and learned detail.
- **Palette transfer** borrows global color statistics from a separate image.
- **Black point**, **white point**, and **gamma** adjust levels and tonal emphasis.
- **Brightness**, **contrast**, and **saturation** provide the familiar BCS color controls; `1.0` leaves each unchanged.
- **Feedback passes** repeat Real-ESRGAN. Between passes, Genereti downsamples the enlarged image back to the generation size, then blends it with the pre-upscaler image using **Loop blend**. The next pass sees that mixture. At `0`, every pass starts from the same pre-upscaler frame; at `1`, each pass uses only the previous downsampled result.
- **AI output size** keeps the upscaler's native 4× result, downsamples to 2×, or returns to the generation dimensions. Choose **Keep source size** when you want the recursive model and downsampling to change the surface without enlarging the artwork.
- **Sharpen** applies an unsharp mask to counter some softness in the small model output.
- **Output scale** and **Scale filter** enlarge the image with nearest, bilinear, bicubic, or Lanczos interpolation.

The stack order is emboss → palette transfer → levels → brightness/contrast/saturation → optional recursive Real-ESRGAN → sharpen → final resampling. The loop does not simply blur the image: each Real-ESRGAN pass reconstructs detail from its changing input, and downsampling filters that result before the next pass. Expect a different drawn or printed surface, plus possible drift in small details. Each pass adds roughly one upscaler inference to frame time.

Choose **Learned upscaler → Real-ESRGAN · AnimeVideo 4×** for the fast, stylized video model, or **Real-ESRGAN · General 4×** for a broader image treatment. These are actual learned Core ML super-resolution models; they add detail and take additional time per frame. The default app does not download them automatically. Install them with `./scripts/download_upscaler.sh` (or use `./scripts/download_models.sh --with-upscaler`).

After warm-up, standalone 256px frames took about 44–48 ms in the local test. The upstream project reports 20 ms for AnimeVideo and 30 ms for General on an M3 Ultra; see the model notes in [models.md](models.md). The first use includes a larger one-time Core ML startup cost.

The **Extra output scale** filters remain fast interpolation, not learned detail generation. They run after the AI output-size choice, so for example AnimeVideo 4× plus 2× resampling makes a 256px image 2048px wide. The full stack runs after diffusion and is included in saved image metadata and scene exports. Try effects at low strength first; aggressive sharpen and emboss can amplify compression and model artifacts.

## Starter studies

### Keep a drawing, borrow a palette

- Pipeline: **Composite · SDXS + Canny · 256px**
- Prompt: `acrylic ink wash, vivid flowers, loose pigment blooms`
- Main input: a simple black-line flower drawing
- Sketch influence: `1.5`
- Canny influence: `0.44`
- Layer mix: `0.0`
- Palette reference: a saturated flower painting
- Palette transfer: `0.8`
- Learned upscaler: `AnimeVideo 4×`
- Sharpen: `0.5`

### Preserve contours while changing the material

- Pipeline: **Composite · SDXS + Canny · 256px**
- Prompt: `children's book illustration, watercolor and wax crayon`
- Main input: a loose drawing
- Canny shape source: a separate photo or clean silhouette with the desired composition
- Sketch influence: `0.7`
- Canny influence: `0.65`
- Layer mix: `0.35`, then compare **Screen** and **Multiply**
- Black point: `8`; white point: `245`; emboss: `0.15`

### A slower, more detailed sketch pass

- Resolution: **512 × 512**
- Pipeline: **Sketch ControlNet · SDXS**
- Prompt: `a stage set built from painted cardboard, theatrical side lighting, visible paper fibers`
- Sketch influence: `1.2`
- Learned upscaler: `General 4×`; compare against **Off**
- Sharpen: `0.4`; compare native output against **2× resample** for projection framing

### A recursive modernist surface

- Resolution: **512 × 512**
- Pipeline: **Sketch ControlNet · SDXS**
- Prompt: `wet ink on handmade paper, modernist black and ivory composition, fluid cutout shapes`
- Learned upscaler: **AnimeVideo 4×**
- Feedback passes: `3`
- Loop blend: `0.65`
- AI output size: **Keep source size**
- Emboss: `0.12`; contrast: `1.1`; saturation: `0.7`; sharpen: `0`

Compare against one pass and against **Loop blend 0**. If the forms drift too far, lower the blend or return to one pass. If the live rate matters more than the surface transformation, use fewer passes.

Save a scene after each variation to keep the input, optional guides, palette reference, generated result, settings, and metrics together.

## Mix guides inside SDXS

Choose **Guide mixer · SDXS · experimental**. This stays in the SDXS family: every active guide runs the released sketch controller, the residuals are added, and one SDXS denoiser generates the result. It is not the earlier two-model output composite, and it is not a release of the paper's missing separately trained Canny/depth controls. Depth and pose through sketch weights may behave unexpectedly.

Start at **512 × 512**, zero Motion, overall influence `1`, Image/sketch weight `0.65`, Detail edges `0.55`, Depth `0`, Pose `0`. Use `line drawing, expressive ink strokes, full body character on white paper` or your own brush-style prompt. Compare against the original Sketch pipeline using the same seed. Change one value at a time; weights add rather than normalize.

- **Image / sketch preparation:** original RGB, grayscale, or extracted line drawing. A photograph fed directly to sketch weights is not conventional latent img2img.
- **Detail edges:** extracted before shrinking to the model size; default thresholds `50 / 150`, adjustable line thickness. Black lines on white are the starting convention. A separate edge source can be loaded in More controls.
- **Depth:** locally estimated from the main input with Depth Anything V2 Small; begin around `0.1–0.2`. This gives broad spatial information, not face identity or guaranteed shape preservation. Static-input estimates are cached; video pays preprocessing time.
- **Pose:** upload an explicit prepared pose/skeleton guide and raise its weight. This does not automatically extract a pose from a file, and the SDXS controller is not pose-trained. A missing pose guide with nonzero weight produces an explanatory error.
- **Independent inversions:** More controls reverses each prepared guide before its controller pass. This is not output inversion or a blend-mode change.
- **View guide:** shows a normalized visual blend to inspect preprocessing/polarity. Actual inference sums separately evaluated learned residuals; the preview is not the tensor sent to a single controller.

Presets and PNG metadata record all mixer controls; scene ZIPs also include a loaded pose guide. Presets store controls, not external image files. Increasing resolution can preserve smaller lines but neither the mixer nor upscaling guarantees correct face identity, anatomy, or all source detail. The next step toward the paper's exact controls requires appropriately trained/distilled SDXS checkpoints, not just feeding standard SD2.1 controls into this architecture. See [the model-size catalog](models.md#resolution-and-model-size-catalog) for installed sizes, setup and measured timings.

## Palette-led relief study and live recovery

The current study uses a drawn source, **Guide mixer · SDXS**, **512 × 512**, seed `929580814`, and prompt:

```text
palette: teal, gold, black, ochra, skyblue, luminous canvas
```

The shared screenshot uses overall influence `0.64`, image/sketch `1.18`, edges `0.95`, depth `1.17`, original RGB input and edge thresholds `50 / 150`. These are an artistic starting point, not a fidelity benchmark. Set pose weight to `0` unless a prepared pose guide has been uploaded; the screenshot's `0.20` without a guide is invalid. Motion `0.67` explores slowly; manually type `10` for fast periodic variations. Record a short clip or save scene snapshots while varying one setting at a time. Save scene retains input/outcome/settings; PNG metadata retains the exact request phase for that output.

Frame failures hold the last successful image. Invalid controls suspend new requests until an input/control changes; correcting the pose weight resumes generation while live remains enabled. Busy-generator responses and temporarily unavailable models retry with a delay. Unexpected inference failures return a readable frame error, preserve the last output and release the generator lock. The browser, WebSocket connection and server remain available; bridges keep serving the last valid image. Actual model-load failures remain visible as unavailable until repaired, and process crashes or hardware faults are outside this frame recovery mechanism.

## What Motion does

Motion currently drives two separate things:

1. With **Kinetic sketch** input, it advances the demo animation at `2 × Motion` units per second. A drawing or uploaded still has no such input animation.
2. Each submitted generation advances `noise_phase` by `0.035 × Motion` radians. Every generation pipeline—including sketch and the SDXS mixer—uses that phase. The engine combines two fixed Gaussian noise arrays from `seed` and `(seed + 1) mod 2^32`:

```text
noise(phase) = cos(phase) × noise(seed) + sin(phase) × noise(seed + 1)
```

This traces a continuous circle in latent **input noise**. At phase `0` it starts at the first seed; `π/2` reaches the second; `π` reaches the negative of the first noise; `2π` returns to the start. The fixed guide anchors structure while changing noise alters the generated interpretation: colors, surfaces, filled regions and sometimes shapes. It is not learned video motion, an anatomical pose coordinate, or interpolation between the final generated image latents.

Motion `10` advances `0.35` radians per submitted frame: roughly 18 frames per loop. At 10 generated/submitted frames per second that is about 1.8 seconds; at 20 it is about 0.9 seconds. It is frame-driven rather than a wall-clock speed, so resolution, preprocessing and failed submissions can change the observed period. Motion `0` freezes the current phase; it does not rewind to the initial seed. Changing/randomizing the seed with the ↻ button resets phase to zero; restarting/reloading the page also starts at zero. Starting/pausing live does not itself reset the phase. The slider still shows its original reasonable range; larger values can be typed into the number field.

### Moving toward deliberate latent configurations

Yes: the useful next step is to treat successful variations as **latent keyframes**. Capture a target's seed, exact noise phase, prompt/prompt-blend, guide images and weights, resolution, style and finish settings. Move between those specified states rather than continuously orbiting. Two distinct controls would help:

- **Noise targets:** select two explicit seeds, interpolate on an arc between them, and scrub or ease to a saved phase. This controls interpretation under the same guide. The existing server API can already reproduce an exact phase via `noise_phase`; a phase scrubber, separate target seed and keyframe transport are not yet implemented in the UI.
- **Scene targets:** interpolate guide shapes/pose maps, prompts and selected numerical settings alongside the noise. This can choreograph a pose-to-pose performance, but noise interpolation alone cannot guarantee a particular body pose, face identity or semantic outcome. Prepared pose maps through the current sketch controller remain experimental.

A reproducible target requires the same input and full configuration, not just a seed. Generated PNG/scene metadata records `request.noise_phase`; result metrics now also report `noise_phase` and `noise_target_seed`. Presets currently save controls, not the running phase or input image pixels, so loading a preset is not yet a latent-keyframe recall. The generator is deterministic in this setup to normal FP16 numerical tolerances, but model changes and GPU/runtime changes may alter results.
