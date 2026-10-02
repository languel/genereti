"""Provider contracts, cancellation and the visible-workspace bridge (no model downloads)."""
import asyncio
import importlib.util
from pathlib import Path
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

spec=importlib.util.spec_from_file_location('comfy_agent_backend',Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_agent/backend.py')
agent=importlib.util.module_from_spec(spec);spec.loader.exec_module(agent)

class AgentTests(IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        agent.SESSIONS.clear();agent.TASKS.clear();routes=web.RouteTableDef();agent.register(routes)
        app=web.Application();app.add_routes(routes);self.client=TestClient(TestServer(app));await self.client.start_server()
    async def asyncTearDown(self):await self.client.close()
    async def test_provider_protocols(self):
        calls=[]
        async def fetch(url,**kw):
            calls.append((url,kw));return {'message':{'content':'ollama'},'choices':[{'message':{'content':'openai'}}],'content':[{'text':'claude'}],'candidates':[{'content':{'parts':[{'text':'gemini'}]}}]}
        with patch.object(agent,'fetch_json',fetch):
            for provider,text in [('ollama','ollama'),('lmstudio','openai'),('mlx','openai'),('anthropic','claude'),('google','gemini')]:
                result=await agent.chat({'provider':provider,'model':'test'},[{'role':'system','content':'instructions'},{'role':'user','content':'hello'}]);self.assertEqual(result,text)
        self.assertEqual(calls[0][1]['data']['options']['num_ctx'],8192)
        self.assertTrue(calls[-1][0].endswith(':generateContent'))
        self.assertNotIn('system',str(calls[-2][1]['data']['messages']))
    async def test_typed_decision_endpoints(self):
        calls=[]
        async def fetch(url,**kw):calls.append((url,kw));return {'answers':{'next':{'choice':'continue'}}}
        questions={'next':{'type':'choice','criteria':{'continue':'keep going'}}}
        with patch.object(agent,'fetch_json',fetch):
            for settings in [{'url':'http://localhost:11434','model':'nimble'},{'url':'https://api.liquid.ai','provider':'liquid','key':'test'},{'url':'https://openrouter.ai'},{'provider':'clef','account':'abcdef'}]:await agent.decide(settings,{'state':'performance'},questions)
        self.assertTrue(calls[0][0].endswith('/v1/systemone'));self.assertTrue(calls[1][0].endswith('/decisions/v1/systemone'));self.assertTrue(calls[2][0].endswith('/api/alpha/decisions'));self.assertIn('/ai/run/@cf/cloudflare/clef',calls[3][0]);self.assertEqual(calls[1][1]['data']['model'],'d1:free')
    async def test_workspace_rpc_and_tab_isolation(self):
        base='/genereti/agent/workspaces'
        await self.client.post(base+'/a/poll',json={'snapshot':{'selected':[1]}})
        await self.client.post(base+'/b/poll',json={'snapshot':{'selected':[2]}})
        task=asyncio.create_task(self.client.post(base+'/a/call',json={'tool':'node_read','args':{'id':1}}));await asyncio.sleep(.03)
        other=await (await self.client.post(base+'/b/poll',json={})).json();self.assertEqual(other['commands'],[])
        command=(await (await self.client.post(base+'/a/poll',json={})).json())['commands'][0]
        await self.client.post(base+'/a/result',json={'id':command['id'],'result':{'id':1}})
        self.assertEqual(await (await task).json(),{'id':1})
        self.assertEqual(agent.SESSIONS['a']['pending'],{})
    async def test_cancel_and_origin(self):
        async def slow(settings,messages):await asyncio.sleep(60)
        with patch.object(agent,'chat',slow):
            task=asyncio.create_task(self.client.post('/genereti/agent/chat',json={'request_id':'cancel','messages':[]}));await asyncio.sleep(.03)
            await self.client.post('/genereti/agent/cancel',json={'request_id':'cancel'});self.assertEqual((await task).status,409)
        response=await self.client.post('/genereti/agent/chat',json={},headers={'Origin':'https://other.example'});self.assertEqual(response.status,403)
        with self.assertRaises(ValueError):agent.endpoint('http://other.example/v1')
        with self.assertRaises(ValueError):agent.endpoint('http://api.openai.com/v1')
    async def test_mcp_no_arbitrary_methods(self):
        for payload in [{'method':'shell'},{'method':'tools/call','params':{'name':'run_workflow'}}]:
            response=await self.client.post('/genereti/agent/mcp',json=payload);self.assertEqual(response.status,400)

    async def test_chunked_provider_response(self):
        async def streaming(request):
            response=web.StreamResponse(headers={'Content-Type':'application/json'});await response.prepare(request)
            await response.write(b'{"text":');await asyncio.sleep(.01);await response.write(b'"complete"}');await response.write_eof();return response
        app=web.Application();app.router.add_get('/stream',streaming)
        server=TestServer(app);await server.start_server()
        try:self.assertEqual(await agent.fetch_json(str(server.make_url('/stream'))),{'text':'complete'})
        finally:await server.close()

    async def test_desktop_executable_fallback(self):
        with patch.object(agent.shutil,'which',return_value=None), patch.object(agent.Path,'is_file',return_value=True), patch.object(agent.os,'access',return_value=True):
            self.assertEqual(agent.executable('comfy-mcp'),str(Path.home()/'.local/bin/comfy-mcp'))
        with patch.object(agent.shutil,'which',return_value=None), patch.object(agent.Path,'is_file',return_value=False):
            self.assertIsNone(agent.executable('comfy-mcp'))
