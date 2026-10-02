# Genereti handoff — 2026-10-02

## Start here

The active checkout is `/Users/liuboto/dev/genereti`, repository `languel/genereti`, branch `main`. The older `/Users/liuboto/dev/rtgen` path is stale; use the actual checkout when running commands. This handoff accompanies the assistant/themes milestone, following `076d67d` (livecoding, output windows and adaptive resolution).

Read `AGENTS.md`, [assistant setup](docs/comfy-assistant.md), [theme guide](docs/comfy-themes.md), and [Livecode workflows](docs/workflows.md#general-livecode-source). Preserve unsaved Comfy tabs and user-edited workflow files. Do not restart Desktop, replace active graphs, or download models without an explicit task requiring it.

## Delivered in this milestone

- **ꘇ assistant:** a native docked Comfy sidebar with Ollama, LM Studio, OpenAI-compatible Unsloth/MLX/llama.cpp, OpenRouter, OpenAI, Claude and Google transports. Provider model lists refresh independently; late discovery responses cannot replace another provider's list. A manual model ID remains available.
- **Workspace context:** selected/referenced nodes, widgets, connections, errors, Livecode source and code selections. Attach nodes uses the selection or opens a node picker. Secret widgets and embedded image data are omitted.
- **Workspace actions:** read/focus/catalog, reviewed widget/code edits, node creation/connections, Livecode run/stop, queue workflow, and guarded undo. Last-good-runtime behavior stays in the existing Livecode implementation. Code edits pause auto-update until explicitly run.
- **Assistant UI fixes:** fixed composer/footer, latest status below the composer, hover labels, collapsed tool activity, working references, and support for modern Comfy `selectedItems` as well as legacy `selected_nodes`.
- **External MCP:** `scripts/comfy_workspace_mcp.py` exposes workspace sessions and commands through stdio, supporting Python MCP SDK 1.x and 2.x. External agents use their own subscription/login; the sidebar does not implement subscription OAuth. Open the assistant once in each target Comfy tab to register its session.
- **Official Comfy MCP catalog:** optional connection to installed `comfy-mcp`/`comfy` executables, pinned to the active installation. Discovery checks the Desktop service PATH plus common user/Homebrew directories. The enabled checkbox remains checked on connection failure and offers Retry.
- **Optional decisions:** typed System One connections for Ollama/LEV, Liquid d1, OpenRouter decisions and Cloudflare Clef. Off by default; decisions do not execute actions automatically. These are provider connection options, not installed models or a performance sequencer.
- **Workflow consolidation:** installation now targets `Workflows → Genereti`. Managed examples update only when unchanged; customized examples remain intact. Independent root edits receive a `(from root)` suffix; redundant files are archived outside the workflow browser.
- **Four Comfy palettes:** ꘇ Dark, Mono, Light and Transparent, matching Livecode colors with subdued accents. Transparent clears page/canvas backgrounds while keeping readable panels. Saved palette startup ordering is corrected; generated button colors migrate to darker backgrounds with readable normal/hover labels. User-customized button colors are retained.

## Main implementation files

| Area | Files |
| --- | --- |
| Assistant backend/routes | `integrations/genereti_comfy_agent/backend.py`, `__init__.py` |
| Sidebar/provider UI | `integrations/genereti_comfy_agent/web/js/assistant.js` |
| Shared workspace tool registry | `integrations/genereti_comfy_agent/web/js/workspace.js` |
| Palette registration and transparent DOM styles | `integrations/genereti_comfy_agent/web/js/themes.js`, `web/themes/*.json` |
| Livecode context and run/stop hooks | `integrations/genereti_comfy_p5/web/js/livecode.js` |
| External MCP and official catalog helper | `scripts/comfy_workspace_mcp.py`, `scripts/comfy_agent_cli.py` |
| Installation and workflow preservation | `scripts/install_comfy.sh`, `scripts/install_comfy_workflows.py` |

The assistant pack adds frontend/services, not workflow nodes. Camera/screen capture remains user-started. Service routes are loopback-only with same-origin browser checks; this is not a remote authenticated multiuser service. Keys entered in the panel stay in memory for that tab. Chat uses complete responses and a bounded structured action loop, not token streaming or native provider tool calling. Vision attachments are not implemented.

## Local environment at handoff

- Comfy Desktop server: `http://127.0.0.1:8000`; Genereti: `http://localhost:8765`.
- Comfy core: `/Users/liuboto/ComfyUI-Installs/ComfyUI/ComfyUI`.
- Desktop custom nodes and user data: `/Users/liuboto/Documents/ComfyUI`.
- Test Python: `/Users/liuboto/Documents/ComfyUI/.venv/bin/python` (aiohttp available).
- `custom_nodes/genereti_comfy_agent` is linked to this checkout. Frontend changes require reload; changed Python routes/discovery require a Comfy restart.
- Official MCP executables were installed under `~/.local/bin`; SDK 2.x interpreter: `~/.local/share/uv/tools/comfy-mcp/bin/python`. Recheck these paths before relying on them in a new session.
- Theme JSON copies and usage notes were also placed in `/Users/liuboto/Desktop/Genereti Themes/`; original `/Users/liuboto/Desktop/dark.json` was untouched.
- Actual workflow cleanup preserved existing folder files and archived redundant root copies under `/Users/liuboto/Documents/ComfyUI/user/default/.genereti-workflow-backups/20261002-140916-3a983816`.

## Verification and honest limits

The final targeted checks passed: 7 backend tests, 3 workflow-installer tests and 4 workspace-registry tests. Frontend JavaScript syntax, installer shell syntax and Git whitespace checks passed. Provider/decision transport tests are mocked and do not prove hosted service availability or model inference quality.

Earlier browser QA against a real Comfy frontend exercised deterministic read → review → apply → undo, decision transport and external MCP node/editor reads. Actual Ollama model discovery was checked; provider switching/stale-response behavior was tested. Official MCP discovery with a restricted service PATH returned 39 tools, with 9 read/catalog tools exposed through the adapter.

Theme browser QA checked all four palettes, return to the native theme, transparent ancestor backgrounds and zero alpha on both empty graph canvas layers. A saved Mono palette reloaded without a missing-palette toast. Final Run button colors were checked: normal `#363636`, hover `#4a4a4a`, text `#e7e7e7`. Native Comfy Desktop still needs a user recheck of startup and the final hover appearance. Existing sketch iframe permission warnings were observed independently of themes.

An opaque Electron/browser window remains opaque behind a transparent page. OS-level see-through compositing requires a transparency-capable host and has not been verified in the user's transparent browser. Themes do not enable click-through, change the purple Desktop instance-manager window, or remove opaque image/sketch backgrounds. Keep global node opacity at 1.

To repeat the targeted tests from this checkout:

```sh
/Users/liuboto/Documents/ComfyUI/.venv/bin/python -m unittest discover -s tests -p 'test_comfy_agent.py'
/Users/liuboto/Documents/ComfyUI/.venv/bin/python -m unittest discover -s tests -p 'test_comfy_workflow_install.py'
node --test tests/test_comfy_workspace.mjs
```

## Continue next

1. Let the user restart Comfy and confirm the official MCP catalog connects using the updated backend discovery. Confirm final palettes/hover labels in Desktop and actual transparent-window compositing in their browser.
2. Exercise the assistant with the user's chosen running local model, including an explicit reference/selection and a reviewed Livecode edit. Improve the docked UI iteratively; retain clear status and model-list isolation.
3. **Next requested feature after the assistant:** bring over transport and clip scheduling from `~/dev/underscores` to drive workflows/livecode for live performances and music videos. Inspect its existing transport/clip implementation before designing new APIs. Keep browser render clocks independent of the Comfy execution queue; Comfy samples the latest source frame when queued.
4. Decision models are optional experimentation for future cues, game-like performance systems and sequencers. The user does not yet have a concrete decision-driven workflow; prioritize local/free/cheap providers and do not build a large automation layer speculatively.

Current realtime sources, output windows, editor themes/opacity, completion and render dimensions were committed in the preceding milestone. Do not replace the preserved p5 node or reimplement those features when starting transport work.
