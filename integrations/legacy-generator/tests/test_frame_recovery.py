import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from pydantic import ValidationError
from server import app,Runtime,GenerateRequest,validation_message

class FrameRecoveryTests(unittest.IsolatedAsyncioTestCase):
    async def test_internal_frame_error_keeps_last_output_and_worker_reusable(self):
        runtime=Runtime();runtime.engine=object();runtime.loading=None
        runtime.jpeg=b'last good frame';runtime.frame=4
        attempts=iter([RuntimeError('bad model prediction'),(b'next good frame',{'server_ms':1,'inference_ms':1})])
        def render(data):
            value=next(attempts)
            if isinstance(value,Exception):raise value
            return value
        runtime.render=render
        try:
            from fastapi import HTTPException
            with patch('server.traceback.print_exc'):
                with self.assertRaises(HTTPException) as caught:await runtime.generate(GenerateRequest())
            self.assertEqual(caught.exception.status_code,500)
            self.assertEqual(runtime.jpeg,b'last good frame');self.assertEqual(runtime.frame,4)
            self.assertIsNone(runtime.error);self.assertFalse(runtime.lock.locked())
            await runtime.generate(GenerateRequest())
            self.assertEqual(runtime.jpeg,b'next good frame');self.assertEqual(runtime.frame,5)
        finally:runtime.executor.shutdown()

class WebSocketRecoveryTests(unittest.TestCase):
    def test_invalid_request_then_valid_frame_on_same_socket(self):
        async def generate(data):return b'image',{'frame':1,'inference_ms':1}
        with patch('server.runtime.generate',generate):
            # No context manager on TestClient: no real model startup needed here.
            client=TestClient(app)
            with client.websocket_connect('/ws') as ws:
                ws.send_json({'mode':'invalid','image':'PRIVATE_FRAME_PAYLOAD'})
                error=ws.receive_json();self.assertEqual(error['type'],'error');self.assertEqual(error['status'],422)
                self.assertNotIn('PRIVATE_FRAME_PAYLOAD',error['error'])
                ws.send_json({'mode':'text'});self.assertEqual(ws.receive_json()['type'],'frame')

if __name__=='__main__':unittest.main()
