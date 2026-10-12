import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class HolisticWorkflows(unittest.TestCase):
    def test_portable_examples_have_one_holistic_provider_and_no_local_media_urls(self):
        paths = list((ROOT / 'integrations/comfyui_genereti/workflows').glob('*Perception-0*.json'))
        self.assertEqual(len(paths), 5)
        for path in paths:
            graph = json.loads(path.read_text())
            providers = [n for n in graph['nodes'] if n['type'] == 'GeneretiPerceptionProvider']
            self.assertEqual(len(providers), 1, path.name)
            self.assertEqual(providers[0]['properties']['genereti_widget_values']['tasks'], 'holistic')
            self.assertTrue(all(n['properties'].get('genereti_media_url', '') == '' for n in graph['nodes']))
            ids = {n['id'] for n in graph['nodes']}
            self.assertTrue(all(l[1] in ids and l[3] in ids for l in graph['links']))

    def test_nose_touch_uses_atomic_subject_side_points(self):
        graph = json.loads((ROOT / 'integrations/comfyui_genereti/workflows/ꘇ-Perception-04-Nose-Touch.json').read_text())
        events = next(n for n in graph['nodes'] if n['type'] == 'GeneretiPerceptionEvents')
        rules = json.loads(events['widgets_values'][2])
        self.assertEqual(rules['rules'][0]['steps'][0]['distance'], ['pose.nose', 'hands.left.index_tip'])

    def test_clean_image_underlay_and_observation_slots_remain_distinct(self):
        for path in (ROOT / 'integrations/comfyui_genereti/workflows').glob('*Perception-0*.json'):
            graph = json.loads(path.read_text())
            provider = next(n for n in graph['nodes'] if n['type'] == 'GeneretiPerceptionProvider')
            self.assertEqual([o['name'] for o in provider['outputs']], ['image', 'observations', 'overlay'])
            self.assertEqual(provider['outputs'][1]['type'], 'GENERETI_DAT')
            for node in graph['nodes']:
                if node['type'] == 'GeneretiPerceptionFeatures':
                    slot = next(i for i, item in enumerate(node['inputs']) if item['name'] == 'image')
                    link = next(l for l in graph['links'] if l[0] == node['inputs'][slot]['link'])
                    self.assertEqual(link[1:5], [provider['id'], 0, node['id'], slot])
