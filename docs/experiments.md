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
