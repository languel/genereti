import unittest
import numpy as np
from integrations.genereti_comfy_chop.flow import FLOW, Merge, Route, Select, Send, Receive
from integrations.genereti_comfy_chop.signals import signal
class GenericFlowTests(unittest.TestCase):
 def test_schemas_and_queue_routes(self):
  for node in FLOW:node.GET_SCHEMA()
  self.assertEqual(Send.execute(7).result,(7,))
  self.assertEqual(Receive.execute().result,(None,))
  self.assertEqual(Select.execute(index=5,sources={'input_5':42}).result,(42,))
  result=Route.execute('hello',index=7,outlets=10).result
  self.assertEqual(len(result),64);self.assertEqual(result[7],'hello');self.assertIsNone(result[0])
 def test_merge_more_than_four_signals(self):
  signals={f'input_{i}':signal({'value':[i]}) for i in range(7)}
  result=Merge.execute(sources=signals).result[0]
  self.assertEqual(len(result['channels']),7)
  self.assertEqual(Merge.execute(sources={f'input_{i}':i for i in range(7)}).result,(21,))
if __name__=='__main__':unittest.main()
