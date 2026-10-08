"""The expression cheat sheet must remain executable by the real evaluator."""
import importlib.util
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('reference_expression', ROOT/'integrations/genereti_comfy_texture/expression.py')
expression = importlib.util.module_from_spec(spec)
spec.loader.exec_module(expression)

class ReferenceTests(unittest.TestCase):
    def test_expression_examples_use_supported_syntax(self):
        text = (ROOT/'help/docs/GeneretiTextureExpression.md').read_text()
        examples = re.findall(r'```text\n(.*?)\n```', text, re.S)
        self.assertGreaterEqual(len(examples), 4)
        for source in examples:
            expression.evaluate(source, dict(t=.5,x=.25,y=.75,z=0,i=0,c=0,v=0,a=0,b=0,w=320,h=240))

    def test_signal_and_texture_references_share_the_expression_contract(self):
        self.assertEqual((ROOT/'help/docs/GeneretiTextureExpression.md').read_text(),
                         (ROOT/'help/docs/GeneretiChopExpression.md').read_text())
