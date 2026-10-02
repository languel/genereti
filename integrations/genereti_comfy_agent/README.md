# ꘇ assistant

A docked assistant and local workspace MCP bridge for ComfyUI Desktop/web. Frontend/service extension; adds no workflow nodes or model dependencies.

See [setup, providers, workspace tools and decision models](../../docs/comfy-assistant.md), [Comfy themes and transparency](../../docs/comfy-themes.md), and the [development handoff](../../handoff.md).

Install through `scripts/install_comfy.sh`, restart Comfy once, then open **Genereti assistant** in the sidebar. Requires Comfy's existing aiohttp runtime; external MCP clients separately need the Python MCP SDK. Keep Comfy bound to loopback.
