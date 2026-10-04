# ꘇ assistant

A docked assistant and local workspace MCP bridge for ComfyUI Desktop/web. Frontend/service extension; adds no workflow nodes or model dependencies.

See [setup, providers, workspace tools and decision models](../../docs/comfy-assistant.md), [Comfy themes and transparency](../../docs/comfy-themes.md), and the [development handoff](../../handoff.md).

Install through `scripts/install_comfy.sh`, restart Comfy once, then open **Genereti assistant** in the sidebar. Requires Comfy's existing aiohttp runtime; external MCP clients separately need the Python MCP SDK. Keep Comfy bound to loopback.

## Keyboard shortcuts

See the [shortcut reference](../../docs/shortcuts.md) or **Comfy Settings → Genereti → Shortcuts**.
Use Alt+F for Fill window, Alt+P for presentation visibility, Alt+Shift+Z for Satori,
and Alt+Shift+I for independent canvas diagnostics. Alt is Option on macOS.
