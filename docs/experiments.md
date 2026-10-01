# Art experiments: structure, color, and finish

Genereti's fast paths are deliberately small, one-step image models. They are useful as live image instruments, but a single model has to solve structure, color, and surface character at once. These experiments let you split those jobs into separate passes and combine the results.

## Start with two independent guides

1. Choose **Composite · SDXS + Canny · 256px** as the pipeline.
2. Draw or select the main input. SDXS uses this as the sketch/shape input.
3. Open **More controls → Canny shape source** and optionally choose a different image. The Canny branch extracts edges from this image; if none is selected, it uses the main input.
4. Set **Sketch influence** to control how tightly SDXS follows the main drawing. **Canny influence** controls edge adherence in the second branch.
5. Adjust **Layer mix · Canny**. At zero you see the SDXS branch; at one you see the SD-Turbo Canny branch. Crossfade is the easiest starting blend. Screen, multiply, and difference create more graphic interactions.
6. Open **Post-processing** and choose a separate **Palette reference** if desired. Palette transfer matches the reference image's overall Lab color distribution while leaving most of the generated light/dark structure intact. It does not understand objects or transfer brush technique.

The two model branches currently receive the same prompt. The SDXS branch can use its selected SDXS style; the Canny branch uses SD-Turbo. The output metrics report the combined inference time, so this mode costs roughly two model passes. The Canny composite is enabled only at resolutions where all of its model packages are installed. In the current local setup, that is 256px.

On the development Mac, warmed composite frames took about 90–100 ms, roughly 10 frames/s. The first Canny use took about 4 seconds while Core ML loaded and warmed that branch; later frames were much faster. With the learned upscaler enabled, the composite measured about 155–160 ms per frame. These timings are specific to this installation and its current load; watch Genereti's FPS and latency readouts for your own setup.

## Try 512 × 512

Use **Model resolution** in the main controls. Genereti lists sizes whose base text model, encoder, and decoder packages are installed. Switching resolution releases the current engine, loads the selected Core ML packages, and warms the model before resuming. The first switch can take a while.

The current local `models/512/` folder contains the SDXS text and sketch packages, so it supports **Text to image · SDXS** and **Sketch ControlNet · SDXS**. It does not contain SD-Turbo or the Canny ControlNet packages, so image remix, Canny, depth, pose, and the two-branch composite are unavailable at 512px in this installation. Return to 256px for those pipelines. If you have converted more model packages for a resolution, the app enables the corresponding modes automatically.

512px gives the model more room for shape and texture, but it also means four times as many output pixels as 256px. Measure the live rate on your machine rather than expecting the 256px rate to carry over. Keep **Requests / second** below the measured generation rate if you want a stable live display.

On the development Mac, one 512px SDXS sketch request took about 50 ms and an initial text request took about 150 ms. Text prompts also need CPU-side encoding, so changing prompts can affect the rate.

## Finish the image after generation

Expand **Post-processing · palette, tone, texture, scale** to stack these operations:

- **Palette transfer** borrows global color statistics from a separate image.
- **Black point**, **white point**, and **gamma** adjust levels and tonal emphasis.
- **Emboss** mixes a relief-filtered version into the frame.
- **Sharpen** applies an unsharp mask to counter some softness in the small model output.
- **Output scale** and **Scale filter** enlarge the image with nearest, bilinear, bicubic, or Lanczos interpolation.

Choose **Learned upscaler → Real-ESRGAN · AnimeVideo 4×** for the fast, stylized video model, or **Real-ESRGAN · General 4×** for a broader image treatment. These are actual learned Core ML super-resolution models; they add detail and take additional time per frame. The default app does not download them automatically. Install them with `./scripts/download_upscaler.sh` (or use `./scripts/download_models.sh --with-upscaler`).

After warm-up, standalone 256px frames took about 44–48 ms in the local test. The upstream project reports 20 ms for AnimeVideo and 30 ms for General on an M3 Ultra; see the model notes in [models.md](models.md). The first use includes a larger one-time Core ML startup cost.

The **Extra output scale** filters remain fast interpolation, not learned detail generation. They run after Real-ESRGAN, so for example AnimeVideo 4× plus 2× resampling makes a 256px image 2048px wide. The full stack runs after diffusion and is included in saved image metadata and scene exports. Try effects at low strength first; aggressive sharpen and emboss can amplify compression and model artifacts.

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

Save a scene after each variation to keep the input, optional guides, palette reference, generated result, settings, and metrics together.
