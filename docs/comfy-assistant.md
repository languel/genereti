# Comfy workspace assistant

**ꘇ assistant** is a docked Comfy sidebar, in Desktop or the browser. It reuses the visible, replayable tool approach from Artist–Model Studio and the workspace-aware assistant direction from Underscores. It does not require the Desktop terminal window.

Install with `scripts/install_comfy.sh /path/to/ComfyUI`, then restart Comfy once to register the Python routes and reload the frontend. The installer links `integrations/genereti_comfy_agent` into `custom_nodes`. Open **Genereti assistant** in the sidebar. Open Settings, choose a provider and server URL, choose a model from the complete dropdown, or use Custom model for a manual ID. Local providers load their model list automatically; Refresh retries discovery. Changing provider clears the previous list, and late responses cannot overwrite the new provider. Local servers must already be running; the extension does not install or download models.

## Providers

| Provider | Default endpoint |
| --- | --- |
| Ollama | `http://localhost:11434` |
| LM Studio / OpenAI-compatible | `http://localhost:1234/v1` |
| Unsloth | `http://localhost:8001/v1` |
| MLX serve / llama.cpp | `http://localhost:8080/v1` |
| OpenRouter | `https://openrouter.ai/api/v1` |
| OpenAI API | `https://api.openai.com/v1` |
| Claude API | `https://api.anthropic.com/v1` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta` |

These are editable defaults, not discovery of an installed service. Unsloth, MLX and llama.cpp must expose an OpenAI-compatible chat API. The cloud choices require their own API access; subscription sign-in is separate. Keys entered in the panel stay in memory for that tab. Provider/model preferences are saved locally. Server environment variables `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY` and `GOOGLE_API_KEY` are also accepted. No existing login files or credentials from other projects are imported.

Select nodes and use **Attach**, type `#12` in a message, or choose a node in the reference field. When nothing is selected, Attach nodes opens a chooser for the current graph. Hover the footer buttons for their labels. The composer and buttons remain fixed while the conversation/settings scroll; the status below them shows only the latest activity. The assistant can inspect widget values, connections, validation/execution errors, livecode source and selected text. Camera frames, embedded image data and secret widgets are omitted. Referenced images are URLs for context; this milestone does not send vision attachments to the model. **Cmd/Ctrl+Enter** sends; the Send button becomes Stop while working.

Edits and runs show an **Apply / Dismiss** card. Code edits pause auto-update; running uses the existing Livecode sandbox and last-good-sketch buffer. **Undo assistant edit** reverses the latest assistant edit when its target has not changed. Read/focus/stop tools do not require a review. The agent cannot delete nodes, run shell commands or evaluate arbitrary scripts through the workspace registry. Hosted models receive the attached context you send them.

Chat currently uses complete responses and a bounded JSON action loop, rather than token streaming. Models need to follow structured instructions reliably. No model-inference speed or hosted-provider availability is claimed by the transport tests.

## Assets, workflows and template references

The Attach button opens a searchable picker for **Nodes**, **Assets**, **Workflows** and **Templates**. It can also attach your selected nodes. Choose a resource to add a removable reference chip and insert its exact token into the message. Typing `@` opens the picker; `#12` continues to refer to node 12. Quotes allow spaces and Unicode names:

```text
Use @asset:"input/my portrait.png" with @template:"default/image_qwen_image_2_1_image_edit".
Use @workflow:"Genereti/Genereti-p5-Source.json" as the starting point.
```

Use the picker or `library_search` to get real IDs; example tokens are illustrative and may not exist on every installation. Saved workflow references retain their folder paths. Installed custom-node templates use `@template:"module/name"`. Asset IDs come from Comfy's asset API when enabled, or `input/`, `output/` and `temp/` file references in the fallback catalog.

The assistant receives attached asset metadata and referenced workflow/template JSON as untrusted context. It can inspect them, open a reviewed **temporary copy in a new Comfy tab**, inspect that graph's current node IDs, then assign each asset to an existing loader via `asset_bind`. Image, audio and video file-loader widgets are supported when their server schema exposes a file-choice list. Output/temp assets are copied into inputs with overwrite disabled. Undo restores the previous widget selection; an uploaded copy remains available on disk. Source workflow files are not overwritten. Runs remain separate reviewed actions, and opening a template does not download models automatically.

The library uses same-origin Comfy APIs and requires no official MCP catalog connection. If the native asset API is unavailable, it lists media offered by installed loader schemas and outputs from the most recent 50 history entries. Arbitrary files elsewhere on disk and older unindexed outputs are not included. The native asset path currently reads the first 100 media entries and reports a warning if more exist; the picker/tool paginates its discovered catalog. Refresh updates the catalog after an upload or newly saved workflow. Media references allow using files in workflows; they do not add vision/image analysis to the chat model. Named secret fields and embedded data URLs are omitted from library reads; review authored content before sending it to a hosted model.

## Workspace tools and MCP

The sidebar and external MCP bridge share these tools:

| Tool | Purpose |
| --- | --- |
| `workspace_context` | Nodes, selection, connections and errors |
| `node_read`, `node_focus` | Read full node/editor context or select a node |
| `catalog_search` | Search the running server's installed node schemas |
| `node_set`, `node_create`, `nodes_connect` | Reviewed changes to the visible graph |
| `livecode_run`, `livecode_stop` | Compile/run or pause an existing Livecode node |
| `workflow_run` | Reviewed queue of the visible workflow |
| `workspace_undo` | Undo the latest assistant edit |
| `library_search`, `library_read` | Discover/read local assets, saved workflows and installed templates |
| `workflow_open` | Open a reviewed temporary copy of a saved workflow/template |
| `asset_bind` | Assign a referenced media file to a reviewed loader widget |

Open the assistant once in each target tab. It registers a session with the local server, even when its sidebar is subsequently hidden. External clients list sessions and address the appropriate one, so two tabs cannot accidentally target each other's graph. Browser callers can use `window.generetiWorkspace.call(tool, args)`.

For an external agent, install `mcp>=1.2` in its Python environment and configure a stdio MCP server:

```json
{
  "mcpServers": {
    "genereti-workspace": {
      "command": "/path/to/python-with-mcp",
      "args": ["/path/to/genereti/scripts/comfy_workspace_mcp.py"],
      "env": {"GENERETI_COMFY_URL": "http://127.0.0.1:8000"}
    }
  }
}
```

The bridge supports MCP SDK 1.x and 2.x and exposes `comfy_workspaces`, `comfy_workspace_tool` and `comfy_decision`. Use your agent application's own login and MCP configuration. For example, a logged-in Codex or Claude client can use this bridge where its client supports MCP. The sidebar does not implement ChatGPT/Claude subscription OAuth or convert subscription access into API keys.

The optional **Comfy MCP catalog** setting connects to the installed [official Comfy MCP server](https://github.com/Comfy-Org/comfy-mcp). It requires installed `comfy-mcp` and `comfy` executables. Discovery checks Comfy’s service PATH and common user/Homebrew locations, including `~/.local/bin`. The checkbox records whether you want the catalog enabled; connection failure keeps it checked, shows a message beside it and provides Retry. Disable it to stop exposing catalog tools. Restart Comfy after updating the Python discovery code. The adapter pins catalog operations to this Comfy installation; visible edits use our workspace bridge. Official `server_info` can report no CLI-managed server even while Desktop is running; use the actual running server's catalog for installed node availability.

Routes are loopback-only, with same-origin checks for browser requests. Chat, models, decisions, cancellation and MCP catalog calls live under `/genereti/agent/`. The workspace bridge uses `/workspaces`, `/workspaces/{id}/poll`, `/result` and `/call` beneath that prefix. This is a local integration, not an authenticated remote multiuser service.

## Optional decision models

Settings → **Decision models** offers a typed state/questions request, returning `choice`, `score` or `noul` answers. **Decision routing** is off by default and, when enabled, adds a code/workflow/general hint to the chat assistant. A decision answer never automatically runs its selected action.

| Option | Protocol / setup |
| --- | --- |
| Ollama | `/v1/systemone`; a decision-capable Ollama release and installed model |
| LEV | A running [Interfaze LEV server](https://huggingface.co/interfaze-ai/lev) exposing `/v1/systemone`; override its local URL |
| Liquid d1 | [Liquid cookbook](https://github.com/Liquid4All/cookbook/blob/main/examples/road-decider/README.md), `/decisions/v1/systemone`, model `d1:free`, API key |
| OpenRouter decisions | `/api/alpha/decisions`; editable model, initially `typesafe/jev-1.13` as in the Liquid comparison demo |
| Cloudflare Clef | [Clef](https://blog.cloudflare.com/clef-decision-models/), account ID and API token, Workers AI decision endpoint |

LEV is a Qwen3.5-4B adapter; its published realtime setup calls for CUDA, so the preset is a connection option, not a promise of Apple Silicon performance. Liquid's demo names a free model; availability, quotas and other providers' pricing remain provider-controlled. No paid request or model download is performed during installation. Environment keys `LIQUID_API_KEY`, `OPENROUTER_API_KEY` and `CLOUDFLARE_API_TOKEN` may be used for decisions.

```json
{
  "state": {"cue": "ink wash", "audienceMotion": "quiet"},
  "questions": {
    "next": {
      "type": "choice",
      "instructions": "Which cue suits the current state?",
      "criteria": {"hold": "Continue calmly", "change": "Move to the next cue"}
    }
  }
}
```

Transport and clip scheduling are a later milestone. This registry provides node addressing and explicit controls they can reuse; no performance timeline or automatic decision-driven sequencer is included yet.

## Verification

Backend tests use mocked provider contracts, typed decision endpoints, origin checks, cancellation and isolated workspace sessions. Registry tests cover reviewed edits, stale approvals, secret omission and undo. Browser QA used a deterministic local test provider against a real Comfy frontend and verified read → review → apply → undo, a decision request, and an external MCP read of the visible node/editor. Actual local/cloud inference remains to be exercised with the chosen running model.
