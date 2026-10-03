#!/usr/bin/env python3
"""MCP tools for the Comfy tab you are actually viewing, via its assistant bridge.
Install the MCP Python SDK in the client environment: pip install 'mcp>=1.2'
GENERETI_COMFY_URL defaults to http://127.0.0.1:8000. Open the assistant tab first.
"""
import json
import os
import urllib.error
import urllib.request
try:
    from mcp.server.mcpserver import MCPServer as FastMCP  # MCP SDK 2.x
except ModuleNotFoundError:
    from mcp.server.fastmcp import FastMCP  # MCP SDK 1.x

mcp = FastMCP('genereti-workspace')
BASE = os.environ.get('GENERETI_COMFY_URL', 'http://127.0.0.1:8000').rstrip('/') + '/genereti/agent'


def request(path, data=None):
    req = urllib.request.Request(BASE+path, data=json.dumps(data).encode() if data is not None else None, headers={'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=100) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        return {'error':exc.read().decode()[:1000]}
    except urllib.error.URLError:
        return {'error':'Start Comfy and open the Genereti assistant tab. Check GENERETI_COMFY_URL.'}


@mcp.tool()
def comfy_workspaces() -> list:
    """List connected browser/desktop tabs with selected nodes and current graph summaries."""
    return request('/workspaces')


@mcp.tool()
def comfy_workspace_tool(tool: str, arguments: dict | None = None, workspace: str = '') -> dict:
    """Act on the visible workspace. Tools: workspace_context, node_read(id), node_focus(id),
    catalog_search(query), node_set(id,widget,value), node_create(type,title?,x?,y?),
    nodes_connect(from,output,to,input), livecode_run(id), livecode_stop(id), workflow_run(),
    workspace_undo(), library_search(kind?,query?,offset?,limit?,refresh?),
    library_read(kind,id), workflow_open(kind,id), asset_bind(asset,id,widget).
    Library IDs match @asset:"ID", @workflow:"path.json", @template:"module/name" references.
    Edits and runs wait for Apply in the sidebar; no arbitrary eval or shell.
    Choose workspace from comfy_workspaces if more than one tab is connected.
    """
    if not workspace:
        sessions = request('/workspaces')
        if not isinstance(sessions, list):return sessions
        if len(sessions)!=1:return {'error':'Choose a workspace ID from comfy_workspaces.'}
        workspace = sessions[0]['id']
    from urllib.parse import quote
    return request('/workspaces/'+quote(workspace, safe='')+'/call', {'tool':tool, 'args':arguments or {}})


@mcp.tool()
def comfy_decision(state: dict | str, questions: dict, model: str = 'nimble', endpoint: str = 'http://localhost:11434') -> dict:
    """Optional local System One choice/score/noul decisions. Returns answers only;
    never executes the selected action. Works with Ollama 0.35+ and a LEV server.
    """
    return request('/decide', {'settings':{'url':endpoint, 'model':model}, 'state':state, 'questions':questions})


if __name__ == '__main__':
    mcp.run()
