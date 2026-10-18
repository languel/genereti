import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class HolisticWorkflows(unittest.TestCase):
    def test_portable_examples_have_one_holistic_provider_and_no_local_media_urls(self):
        paths = list((ROOT / 'integrations/comfyui_genereti/workflows').glob('*Perception-0*.json'))
        self.assertEqual(len(paths), 8)
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

    def test_drawing_uses_four_joints_and_clean_underlay(self):
        graph = json.loads((ROOT / 'integrations/comfyui_genereti/workflows/ꘇ-Perception-02-Drawing.json').read_text())
        features = next(n for n in graph['nodes'] if n['type'] == 'GeneretiPerceptionFeatures')
        self.assertEqual(set(features['widgets_values'][1].split()), {'pose.left_wrist', 'pose.right_wrist', 'pose.left_ankle', 'pose.right_ankle'})
        drawing = next(n for n in graph['nodes'] if n['type'] == 'GeneretiLivecode')
        self.assertEqual(drawing['widgets_values'][4], (ROOT / 'docs/examples/perception-drawing.js').read_text())
        link = next(l for l in graph['links'] if l[0] == drawing['inputs'][0]['link'])
        provider = next(n for n in graph['nodes'] if n['type'] == 'GeneretiPerceptionProvider')
        self.assertEqual(link[1:5], [provider['id'], 0, drawing['id'], 0])

    def test_measures_demo_keeps_provider_and_region_definitions_separate(self):
        graph = json.loads((ROOT / 'integrations/comfyui_genereti/workflows/ꘇ-Perception-06-Measures-Regions.json').read_text())
        measures = next(n for n in graph['nodes'] if n['type'] == 'GeneretiPerceptionMeasures')
        regions = next(n for n in graph['nodes'] if n['type'] == 'GeneretiPerceptionRegions')
        doc = json.loads(measures['widgets_values'][5])
        self.assertEqual(doc['version'], 1)
        self.assertEqual(regions['widgets_values'][0], 'stage')
        self.assertTrue(any(m.get('region') == 'stage::center' for m in doc['measures']))

    def test_mediamime_demo_routes_notes_to_instruments_and_keeps_its_score(self):
        graph = json.loads((ROOT / 'integrations/comfyui_genereti/workflows/ꘇ-Perception-08-Mediamime-Body-Drum.json').read_text())
        mime = next(n for n in graph['nodes'] if n['type'] == 'GeneretiPerceptionMime')
        score = json.loads(mime['properties']['genereti_widget_values']['score'])
        self.assertEqual(score['version'], 1)
        names = {r['name'] for r in score['regions'].values()}
        self.assertTrue({'chest', 'belly', 'gateL', 'floor', 'wingL'} <= names)
        self.assertEqual(len(score['document']['elements']), len(score['regions']))
        selects = {n['id']: n['widgets_values'][0] for n in graph['nodes'] if n['type'] == 'GeneretiChopSelect'}
        self.assertEqual(set(selects.values()), {'ch10.*', 'ch1.*'})
        for link in graph['links']:
            if link[3] in selects:
                self.assertEqual(link[1:3], [mime['id'], 0])
        segments = next(n for n in graph['nodes'] if n['type'] == 'GeneretiPerceptionSegments')
        mask_slot = next(i for i, p in enumerate(mime['inputs']) if p['name'] == 'mask')
        self.assertTrue(any(l[1] == segments['id'] and l[3] == mime['id'] and l[4] == mask_slot for l in graph['links']))
