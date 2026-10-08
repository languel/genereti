from huggingface_hub import snapshot_download
print(snapshot_download('depth-anything/Depth-Anything-V2-Small-hf',revision='5426e4f0f36572d16453bbda7a8389317b1bef99',allow_patterns=['config.json','preprocessor_config.json','model.safetensors','README.md','LICENSE*']))
