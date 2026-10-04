"""Loopback-only OSC UDP bridge. Explicit session leases, no auto-open listeners."""
import asyncio
import ipaddress
import struct
import time
import uuid
from aiohttp import web


def _string(value):
    raw=value.encode('utf8')+b'\0';return raw+b'\0'*((-len(raw))%4)
def encode(address,values):
    if not address.startswith('/') or len(address)>256:raise ValueError('OSC address must begin with / and be at most 256 characters')
    if len(values)>64:raise ValueError('At most 64 OSC arguments')
    return _string(address)+_string(','+'f'*len(values))+b''.join(struct.pack('>f',float(v)) for v in values)
def decode(packet,depth=0):
    if depth>4 or len(packet)>65536:raise ValueError('OSC packet too large or nested')
    if packet.startswith(b'#bundle\0'):
        offset=16;messages=[]
        while offset<len(packet):
            length=struct.unpack_from('>I',packet,offset)[0];offset+=4
            if not length or offset+length>len(packet):raise ValueError('Invalid OSC bundle')
            messages+=decode(packet[offset:offset+length],depth+1);offset+=length
        return messages
    def string(offset):
        end=packet.index(b'\0',offset);return packet[offset:end].decode('utf8'),(end+4)&~3
    address,offset=string(0);tags,offset=string(offset);values=[]
    if not address.startswith('/') or not tags.startswith(','):raise ValueError('Invalid OSC message')
    for tag in tags[1:]:
        if tag in 'if':values.append(struct.unpack_from('>'+tag,packet,offset)[0]);offset+=4
        elif tag=='s':raise ValueError('CHOP OSC accepts numeric and boolean arguments only')
        elif tag in 'TF':values.append(float(tag=='T'))
        else:raise ValueError('Unsupported OSC argument type')
    return [(address,values)]

_sessions={};_ports={};_registered=False;_cleanup=None;_sender=None

def register():
    global _registered
    if _registered:return
    from server import PromptServer
    routes=PromptServer.instance.routes
    def local(request):
        if not ipaddress.ip_address(request.remote or '0.0.0.0').is_loopback:raise web.HTTPForbidden(text='OSC bridge is loopback-only')
    def close(token):
        session=_sessions.pop(token,None)
        if session and session['port'] in _ports:
            entry=_ports[session['port']];entry['sessions'].discard(token)
            if not entry['sessions']:entry['transport'].close();_ports.pop(session['port'])
    async def cleanup():
        while _sessions:
            await asyncio.sleep(30)
            for token,session in list(_sessions.items()):
                if time.monotonic()-session['seen']>90:close(token)
    class Receiver(asyncio.DatagramProtocol):
        def __init__(self,port):self.port=port;self.pending=None;self.values={}
        def datagram_received(self,packet,peer):
            if not ipaddress.ip_address(peer[0]).is_loopback:return
            try:
                for address,values in decode(packet):
                    for i,value in enumerate(values[:64]):
                        if len(self.values)<256 or f'{address}:{i}' in self.values:self.values[f'{address}:{i}']=value
                if self.pending is None:self.pending=asyncio.get_running_loop().call_later(1/60,self.flush)
            except (ValueError,struct.error,UnicodeError):pass
        def flush(self):
            self.pending=None;values,self.values=self.values,{}
            for token in list(_ports.get(self.port,{}).get('sessions',())):
                session=_sessions.get(token)
                if session:PromptServer.instance.send_sync('genereti-osc',dict(token=token,channels=values),session['client'])
        def connection_lost(self,exc):
            if self.pending:self.pending.cancel()
    @routes.post('/genereti/chop/osc/start')
    async def start(request):
        global _cleanup
        local(request);data=await request.json();port=int(data['port'])
        if not 1024<=port<=65535:raise web.HTTPBadRequest(text='Port must be 1024..65535')
        if len(_sessions)>=64:raise web.HTTPBadRequest(text='Too many OSC sessions')
        if not data.get('client'):raise web.HTTPBadRequest(text='Comfy client id required')
        if port not in _ports:
            try:transport,_=await asyncio.get_running_loop().create_datagram_endpoint(lambda:Receiver(port),local_addr=('127.0.0.1',port))
            except OSError as error:raise web.HTTPBadRequest(text=str(error))
            _ports[port]=dict(transport=transport,sessions=set())
        token=uuid.uuid4().hex;_sessions[token]=dict(port=port,client=data['client'],seen=time.monotonic());_ports[port]['sessions'].add(token)
        if _cleanup is None or _cleanup.done():_cleanup=asyncio.create_task(cleanup())
        return web.json_response(dict(token=token))
    @routes.post('/genereti/chop/osc/touch')
    async def touch(request):
        local(request);data=await request.json();session=_sessions.get(data.get('token'))
        if session:session['seen']=time.monotonic()
        return web.json_response(dict(active=bool(session)))
    @routes.post('/genereti/chop/osc/stop')
    async def stop(request):
        local(request);close((await request.json()).get('token'));return web.json_response(dict(ok=True))
    @routes.post('/genereti/chop/osc/send')
    async def send(request):
        global _sender
        local(request);data=await request.json();port=int(data['port'])
        if not 1024<=port<=65535:raise web.HTTPBadRequest(text='Port must be 1024..65535')
        try:packet=encode(data['address'],data['values'])
        except (ValueError,KeyError,OverflowError,struct.error) as error:raise web.HTTPBadRequest(text=str(error))
        if _sender is None:
            _sender,_=await asyncio.get_running_loop().create_datagram_endpoint(asyncio.DatagramProtocol,local_addr=('127.0.0.1',0))
        _sender.sendto(packet,('127.0.0.1',port))
        return web.json_response(dict(ok=True))
    _registered=True
