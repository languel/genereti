# Classic SD 1.5 and Qwen Image 2.1 in ComfyUI

Two teaching workflows ship with Genereti:

- **ꘇ-Classic-SD15-Bottle.json** is the original diffusion graph: checkpoint, positive and negative CLIP prompts, empty latent, KSampler, VAE decode, preview, and save. It uses the local checkpoint `v1-5-pruned-emaonly-fp16.safetensors`, 512×512, Euler, 20 steps, CFG 7, and the familiar clear-bottle-and-rose prompt. That checkpoint is already installed on the development Mac. If you are using another ComfyUI install, put an SD 1.5 checkpoint in `models/checkpoints` and select that filename in the loader.
- **ꘇ-Qwen-2.1-Fast.json** is a small direct-prompt Qwen graph. It uses the 2.1 INT8-convrot DiT, the Qwen3-VL 8B INT8 text encoder, and the Qwen 2.1 VAE. It starts at 768×768 and 12 Euler steps with CFG 1, and omits the separate 9B prompt-rewriter branch in the stock workflow.

The SD 1.5 bottle graph is the classic ComfyUI exercise: change the prompt, seed, sampler, or CFG and watch each stage. On this Mac the 512², 20-step graph completed in about 14 seconds after the checkpoint was available. Other platforms can use the same workflow and checkpoint; speed depends on the GPU/backend.

## Why the existing Qwen graph felt slow

The local ComfyUI history records a Qwen Image 2.1 generation at 1024×1024 and 25 steps that took about 4 minutes 49 seconds. It used the 6.76 GB INT8-convrot image transformer and 8.71 GB Qwen3-VL encoder. The stock graph also exposes an optional Qwen 3.5 9B prompt-enhancer model (8.82 GB) and rewrite branch; enable that only when you want prompt rewriting, since it adds another model and an LLM pass. The included fast workflow removes that branch and lowers both pixel count and denoising steps.

Treat 12 steps at 768² as a speed preset, not a quality-equivalent replacement for the official high-quality recipe. Qwen's official reference uses about 40 steps; fewer steps and fewer pixels trade detail for responsiveness. Raise steps first, then resolution, once you have seen the timing. Keep CFG at 1 for Qwen's standard path.

On this M5 Max, the currently installed Comfy quantizations are sizeable and Comfy's PyTorch/MPS route took several minutes in the observed 25-step run. The user's MLX Core app has a separate 4-bit Qwen Image 2.1 model and was reported to feel much faster; its local MLX cache includes `ddalcu/Qwen-Image-2.1-MLX-Serve-4bit` with both DiT and text encoder quantized to 4 bits. That is the practical live-demo alternative when responsiveness matters; use Comfy for its visible graph and broader node composition. The timing comparison here is not a controlled same-prompt benchmark: the MLX result is user-reported, while Comfy's duration comes from local run history.

A warm Comfy run of the stripped-down 768²/12-step graph completed in 50 seconds and produced a coherent glass product image, though it did not preserve the red rose from the SD 1.5 bottle prompt. Treat that as the fastest practical classroom preview setting; use the 25-step stock graph or raise steps when image detail matters more than iteration speed.

## Try the workflows

Run `scripts/install_comfy.sh /path/to/ComfyUI`, restart ComfyUI, then open either workflow from the Workflows menu. For Qwen, the three required model files must be present in `models/diffusion_models`, `models/text_encoders`, and `models/vae`. Model weights are not included in this repository. The stock ComfyUI template includes model links and notes about prompt enhancement and high-quality settings: [Qwen Image 2.1 text-to-image template](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/image_qwen_image_2_1_t2i.json).

For a ready-made wider range of SD 1.5 parameters and extra nodes, ComfyUI's official examples are here: [ComfyUI example workflows](https://github.com/Comfy-Org/example_workflows). The shipped bottle graph stays intentionally small and close to the original first-diffusion workflow used to teach latent sampling.
