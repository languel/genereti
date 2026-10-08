# /// script
# requires-python = ">=3.11"
# dependencies = ["mcp>=1.26,<2"]
# ///
"""Standalone stdio MCP bridge; talks HTTP to Genereti, never loads models."""
import base64
import json
import os
from pathlib import Path
from urllib.parse import urlparse
import urllib.request
import urllib.error
from mcp.server.fastmcp import FastMCP, Image

mcp = FastMCP('Genereti')
BASE = os.environ.get('GENERETI_URL', 'http://127.0.0.1:8765').rstrip('/')
if urlparse(BASE).hostname not in ('localhost','127.0.0.1','::1'):
    raise ValueError('GENERETI_URL must use localhost.')


def request(path, payload=None, raw=None):
    body = raw if raw is not None else json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(BASE + path, data=body,
        headers={'Content-Type': 'image/png' if raw is not None else 'application/json'} if body is not None else {})
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f'Genereti {exc.code}: {exc.read().decode()}') from exc


@mcp.resource('genereti://generation-schema')
def generation_schema() -> str:
    return (Path(__file__).resolve().parents[1] / 'docs' / 'generate-schema.json').read_text()


@mcp.tool()
def genereti_status() -> dict:
    """Read model readiness, active size, available models and last frame timings."""
    return json.loads(request('/api/status'))


@mcp.tool()
def genereti_set_resolution(size: int = 512) -> dict:
    """Load 256/384/512px models. Changes the shared generator for all apps."""
    return json.loads(request('/api/config/size', {'size': size}))


@mcp.tool()
def genereti_generate(prompt: str = 'ink wash 水墨画', image_path: str | None = None, options: dict | None = None) -> Image:
    """Generate one frame. options accepts all /api/generate fields, including independent guides, mixer weights, styles and post-processing. image_path supplies local drawing pixels; generated output is shared with viewers."""
    data = {'mode': 'sketch' if image_path else 'text', **(options or {}), 'prompt': prompt}
    if image_path:
        data['image'] = base64.b64encode(Path(image_path).read_bytes()).decode()
    return Image(data=request('/api/generate', data), format='jpeg')


@mcp.tool()
def genereti_receive_frame() -> Image:
    """Receive the latest output without generating, independent of its producer."""
    return Image(data=request('/api/frame.jpg'), format='jpeg')


@mcp.tool()
def genereti_publish_frame(image_path: str) -> dict:
    """Publish a locally rendered image to the shared output stream without diffusion."""
    request('/api/output-frame', raw=Path(image_path).read_bytes())
    return {'published': True}


if __name__ == '__main__':
    mcp.run(transport='stdio')
