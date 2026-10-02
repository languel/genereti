"""Local assistant transports. Credentials are request-scoped, never logged/saved."""
import asyncio
import contextlib
import ipaddress
import json
import os
import shutil
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse
from aiohttp import ClientSession, ClientTimeout, web

MAX_BODY = 2_000_000
PROVIDERS = {
    'ollama': ('http://localhost:11434', 'ollama'),
    'lmstudio': ('http://localhost:1234/v1', 'openai'),
    'unsloth': ('http://localhost:8001/v1', 'openai'),
    'mlx': ('http://localhost:8080/v1', 'openai'),
    'llamacpp': ('http://localhost:8080/v1', 'openai'),
    'compatible': ('http://localhost:1234/v1', 'openai'),
    'openrouter': ('https://openrouter.ai/api/v1', 'openai'),
    'openai': ('https://api.openai.com/v1', 'openai'),
    'anthropic': ('https://api.anthropic.com/v1', 'anthropic'),
    'google': ('https://generativelanguage.googleapis.com/v1beta', 'google'),
}
CLOUD_HOSTS = {'openrouter.ai', 'api.openai.com', 'api.anthropic.com', 'generativelanguage.googleapis.com', 'api.liquid.ai', 'api.cloudflare.com'}
READ_MCP = {'server_info', 'search_nodes', 'nodes', 'search_models', 'search_templates', 'fetch_template', 'validate_workflow', 'list_workflow_slots', 'list_workflow_notes', 'get_job', 'fetch_outputs'}
TASKS = {}
SESSIONS = {}
WORKSPACE = os.environ.get("GENERETI_COMFY_WORKSPACE", "")


def local_request(request):
    try:
        if not ipaddress.ip_address(request.remote).is_loopback:
            raise ValueError()
    except ValueError:
        raise web.HTTPForbidden(text='Assistant is available on loopback only.')
    origin = request.headers.get('Origin')
    if origin and urlparse(origin).netloc != request.host:
        raise web.HTTPForbidden(text='Use the Comfy page on this server.')


async def body(request):
    local_request(request)
    if request.content_length and request.content_length > MAX_BODY:
        raise web.HTTPRequestEntityTooLarge(max_size=MAX_BODY, actual_size=request.content_length)
    raw = bytearray()
    async for chunk in request.content.iter_chunked(65536):
        raw.extend(chunk)
        if len(raw) > MAX_BODY:
            raise web.HTTPRequestEntityTooLarge(max_size=MAX_BODY, actual_size=len(raw))
    try:
        value = json.loads(raw)
        if not isinstance(value, dict):
            raise ValueError('Expected an object')
        return value
    except (ValueError, UnicodeDecodeError) as exc:
        raise web.HTTPBadRequest(text='Expected a JSON object') from exc


def endpoint(url):
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https') or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError('Use an http(s) base URL without credentials or query parameters.')
    host = parsed.hostname
    if host not in CLOUD_HOSTS and host not in ('localhost', '127.0.0.1', '::1'):
        raise ValueError('Use a loopback model server or a supported cloud provider.')
    if host in CLOUD_HOSTS and parsed.scheme != 'https':
        raise ValueError('Cloud providers require HTTPS.')
    return url.rstrip('/')


async def fetch_json(url, *, data=None, headers=None):
    async with ClientSession(timeout=ClientTimeout(total=180)) as client:
        async with client.request('POST' if data is not None else 'GET', url, json=data, headers=headers, allow_redirects=False) as response:
            content = bytearray()
            async for chunk in response.content.iter_chunked(65536):
                content.extend(chunk)
                if len(content) > MAX_BODY:
                    raise ValueError('Provider response is too large.')
            if response.status >= 300:
                # Do not echo provider errors, which can include credentials/request content.
                raise ValueError(f'Provider HTTP {response.status}. Check endpoint, model and credentials.')
            return json.loads(content)


def config(settings):
    provider = settings.get('provider', 'ollama')
    if provider not in PROVIDERS:
        raise ValueError('Unknown provider')
    default, protocol = PROVIDERS[provider]
    base = endpoint(settings.get('url') or default)
    if protocol != 'ollama' and not base.endswith(('/v1', '/v1beta')):
        base += '/v1beta' if protocol == 'google' else '/v1'
    key = str(settings.get('key') or os.environ.get({'openai':'OPENAI_API_KEY','openrouter':'OPENROUTER_API_KEY','anthropic':'ANTHROPIC_API_KEY','google':'GOOGLE_API_KEY'}.get(provider, ''), ''))
    headers = {'Content-Type':'application/json'}
    if key:
        headers['x-api-key' if protocol == 'anthropic' else 'x-goog-api-key' if protocol == 'google' else 'Authorization'] = key if protocol in ('anthropic', 'google') else 'Bearer ' + key
    if protocol == 'anthropic':
        headers['anthropic-version'] = '2023-06-01'
    return base, protocol, headers


async def models(settings):
    base, protocol, headers = config(settings)
    payload = await fetch_json(base + ('/api/tags' if protocol == 'ollama' else '/models'), headers=headers)
    if protocol == 'ollama':
        return [m['name'] for m in payload.get('models', [])]
    if protocol == 'google':
        return [m['name'].removeprefix('models/') for m in payload.get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
    return [m['id'] for m in payload.get('data', [])]


async def chat(settings, messages):
    base, protocol, headers = config(settings)
    model = settings.get('model')
    if not model:
        raise ValueError('Choose a model first.')
    if protocol == 'ollama':
        payload = await fetch_json(base + '/api/chat', data={'model':model,'messages':messages,'stream':False,'think':False,'options':{'num_ctx':8192,'num_predict':2048,'temperature':.3}}, headers=headers)
        return payload.get('message', {}).get('content', '')
    if protocol == 'anthropic':
        payload = await fetch_json(base + '/messages', data={'model':model,'max_tokens':4096,'system':'\n'.join(m['content'] for m in messages if m['role']=='system'),'messages':[m for m in messages if m['role']!='system']}, headers=headers)
        return '\n'.join(p.get('text','') for p in payload.get('content', []))
    if protocol == 'google':
        from urllib.parse import quote
        payload = await fetch_json(base + '/models/' + quote(model, safe='') + ':generateContent', data={'system_instruction':{'parts':[{'text':'\n'.join(m['content'] for m in messages if m['role']=='system')}]},'contents':[{'role':'model' if m['role']=='assistant' else 'user','parts':[{'text':m['content']}]} for m in messages if m['role']!='system']}, headers=headers)
        return '\n'.join(p.get('text','') for p in payload.get('candidates',[{}])[0].get('content',{}).get('parts',[]))
    payload = await fetch_json(base + '/chat/completions', data={'model':model,'messages':messages,'stream':False}, headers=headers)
    return payload.get('choices',[{}])[0].get('message',{}).get('content') or ''


async def decide(settings, state, questions):
    base = endpoint(settings.get('url') or 'http://localhost:11434').removesuffix('/v1')
    if not isinstance(questions, dict) or not questions:
        raise ValueError('Typed decision questions are required.')
    for question in questions.values():
        if not isinstance(question, dict) or question.get('type') not in ('choice','score','noul'):
            raise ValueError('Decision questions must use choice, score or noul.')
    provider = settings.get('provider', 'systemone')
    host = urlparse(base).hostname
    path = '/api/alpha/decisions' if host == 'openrouter.ai' else '/decisions/v1/systemone' if host == 'api.liquid.ai' else '/v1/systemone'
    if provider == 'clef':
        account = str(settings.get('account',''))
        if not account or not all(c in '0123456789abcdefABCDEF' for c in account):
            raise ValueError('Cloudflare account ID is required.')
        base = 'https://api.cloudflare.com'
        path = f'/client/v4/accounts/{account}/ai/run/@cf/cloudflare/clef'
    key = settings.get('key') or os.environ.get({'liquid':'LIQUID_API_KEY','clef':'CLOUDFLARE_API_TOKEN','openrouter':'OPENROUTER_API_KEY'}.get(provider,''), '')
    model = settings.get('model') or ('clef' if provider == 'clef' else 'd1:free' if provider == 'liquid' else '')
    payload = {'state':state, 'questions':questions}
    if model:payload['model'] = model
    result = await fetch_json(base + path, data=payload, headers={'Authorization':'Bearer '+key} if key else {})
    return result.get('result',result) if provider == 'clef' else result


def executable(name):
    """Desktop service PATH often omits user-installed uv/pipx tools."""
    found = shutil.which(name)
    if found:
        return found
    for directory in (Path.home() / '.local/bin', Path('/opt/homebrew/bin'), Path('/usr/local/bin')):
        candidate = directory / name
        if candidate.is_file() and os.access(candidate, os.X_OK):
            return str(candidate)
    return None


async def mcp_rpc(method, params, comfy_url):
    """Fixed official stdio server, no arbitrary commands or shell execution."""
    server_binary, comfy_binary = executable('comfy-mcp'), executable('comfy')
    if not server_binary or not comfy_binary:
        raise ValueError('Install comfy-mcp and comfy-cli to enable Comfy MCP, then restart Comfy.')
    env = {**os.environ, 'COMFYUI_URL':comfy_url}
    env['PATH'] = os.pathsep.join(dict.fromkeys([str(Path(server_binary).parent), str(Path(comfy_binary).parent), str(Path.home()/'.local/bin'), '/opt/homebrew/bin', '/usr/local/bin', *env.get('PATH','').split(os.pathsep)]))
    if WORKSPACE:
        env.update(COMFY_BIN=str(Path(__file__).resolve().parents[2]/'scripts/comfy_agent_cli.py'), GENERETI_COMFY_REAL_BIN=comfy_binary, GENERETI_COMFY_WORKSPACE=WORKSPACE)
    process = await asyncio.create_subprocess_exec(server_binary, stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL, env=env, limit=MAX_BODY)
    async def exchange(ident, name, arguments):
        process.stdin.write((json.dumps({'jsonrpc':'2.0','id':ident,'method':name,'params':arguments})+'\n').encode())
        await process.stdin.drain()
        while True:
            line = await asyncio.wait_for(process.stdout.readline(), 45)
            if not line:
                raise ValueError('Comfy MCP exited. Check that comfy-cli is configured for this install.')
            response = json.loads(line)
            if response.get('id') == ident:
                if 'error' in response:
                    raise ValueError(str(response['error'].get('message','MCP error')))
                return response.get('result',{})
    try:
        await exchange(1,'initialize',{'protocolVersion':'2024-11-05','capabilities':{},'clientInfo':{'name':'genereti-agent','version':'0.1'}})
        process.stdin.write(b'{"jsonrpc":"2.0","method":"notifications/initialized"}\n')
        return await exchange(2,method,params)
    finally:
        if process.returncode is None:
            with contextlib.suppress(ProcessLookupError):process.terminate()
            try:await asyncio.wait_for(process.wait(), 2)
            except asyncio.TimeoutError:
                with contextlib.suppress(ProcessLookupError):process.kill()
                await process.wait()


def expire_sessions():
    for ident, state in list(SESSIONS.items()):
        if time.monotonic() - state['seen'] > 12:
            for item in state['pending'].values():
                if not item['future'].done():item['future'].set_result({'error':'Workspace disconnected'})
            del SESSIONS[ident]


async def dispatch(request, operation):
    data = await body(request)
    ident = str(data.get('request_id') or uuid.uuid4())
    if ident in TASKS:raise web.HTTPConflict(text='Request already active')
    task = asyncio.create_task(operation(data));TASKS[ident] = task
    try:
        return web.json_response(await task, headers={'Cache-Control':'no-store'})
    except asyncio.CancelledError:
        return web.json_response({'error':'Stopped'}, status=409)
    except (ValueError, OSError, asyncio.TimeoutError) as exc:
        return web.json_response({'error':str(exc)}, status=400)
    except Exception:
        return web.json_response({'error':'Provider connection failed. Check the service and endpoint.'}, status=502)
    finally:TASKS.pop(ident, None)


def register(routes, workspace=None):
    global WORKSPACE
    if workspace:WORKSPACE = str(workspace)
    @routes.get('/genereti/agent/status')
    async def status(request):
        local_request(request)
        return web.json_response({'mcp':bool(executable('comfy-mcp') and executable('comfy')), 'providers':list(PROVIDERS), 'subscription':False})

    @routes.post('/genereti/agent/models')
    async def model_list(request):return await dispatch(request, lambda d: models(d.get('settings',{})))

    @routes.post('/genereti/agent/chat')
    async def completion(request):
        async def complete(d):return {'text':await chat(d.get('settings',{}), d.get('messages',[]))}
        return await dispatch(request, complete)

    @routes.post('/genereti/agent/decide')
    async def decision(request):return await dispatch(request, lambda d: decide(d.get('settings',{}), d.get('state'), d.get('questions')))

    @routes.post('/genereti/agent/cancel')
    async def cancel(request):
        data = await body(request);task = TASKS.get(data.get('request_id'))
        if task:task.cancel()
        return web.json_response({'cancelled':bool(task)})

    @routes.post('/genereti/agent/mcp')
    async def mcp(request):
        async def call(d):
            operation = d.get('method','tools/list')
            if operation not in ('tools/list','tools/call'):raise ValueError('Unsupported MCP method')
            params = d.get('params',{})
            if operation == 'tools/call' and params.get('name') not in READ_MCP:
                raise ValueError('Use workspace tools for visible edits/runs. This MCP adapter exposes read/catalog tools only.')
            result = await mcp_rpc(operation, params, str(request.url.origin()))
            if operation == 'tools/list':result['tools'] = [t for t in result.get('tools',[]) if t['name'] in READ_MCP]
            return result
        return await dispatch(request, call)

    @routes.post('/genereti/agent/workspaces/{session}/poll')
    async def poll(request):
        data = await body(request);expire_sessions();ident = request.match_info['session']
        if len(ident)>80:raise web.HTTPBadRequest()
        if ident not in SESSIONS:
            if len(SESSIONS)>=16:raise web.HTTPServiceUnavailable()
            SESSIONS[ident] = {'seen':0,'snapshot':{},'pending':{}}
        state = SESSIONS[ident];state['seen'] = time.monotonic();state['snapshot'] = data.get('snapshot',{})
        commands = []
        for key,item in state['pending'].items():
            if not item['delivered']:
                item['delivered'] = True;commands.append({'id':key, **item['command']})
        return web.json_response({'commands':commands})

    @routes.post('/genereti/agent/workspaces/{session}/result')
    async def command_result(request):
        data = await body(request);state = SESSIONS.get(request.match_info['session']);item = state and state['pending'].get(data.get('id'))
        if not item:raise web.HTTPNotFound()
        if not item['future'].done():item['future'].set_result(data.get('result'))
        return web.json_response({'ok':True})

    @routes.get('/genereti/agent/workspaces')
    async def workspaces(request):
        local_request(request);expire_sessions()
        return web.json_response([{'id':ident, 'snapshot':state['snapshot']} for ident,state in SESSIONS.items()])

    @routes.post('/genereti/agent/workspaces/{session}/call')
    async def workspace_call(request):
        data = await body(request);expire_sessions();state = SESSIONS.get(request.match_info['session'])
        if not state:raise web.HTTPNotFound(text='Open the assistant in the target Comfy tab first.')
        if len(state['pending'])>=16:raise web.HTTPTooManyRequests()
        ident = str(uuid.uuid4());future = asyncio.get_running_loop().create_future()
        state['pending'][ident] = {'command':{'tool':data.get('tool'),'args':data.get('args',{})},'future':future,'delivered':False}
        try:
            return web.json_response(await asyncio.wait_for(future, 90))
        except asyncio.TimeoutError:
            return web.json_response({'error':'Workspace tool timed out. Pending edits require Apply in the sidebar.'}, status=408)
        finally:state['pending'].pop(ident, None)
