#!/usr/bin/env python3
"""Package the browser-recorded session as a starter and completed patch."""
import copy
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
FLOWS = ROOT / 'integrations/comfyui_genereti/workflows'
LESSONS = ROOT / 'integrations/genereti_comfy_agent/web/lessons'
guide = json.loads((LESSONS / 'feedback-av-recording.json').read_text())
flow_path = FLOWS / 'ꘇ-Feedback-AV-Recorded-Patch.json'
flow = json.loads(flow_path.read_text())
flow.pop('id', None)
flow.pop('revision', None)
flow['extra'] = {'ds': {'scale': .3, 'offset': [60, 100]}}
lesson = next(n for n in flow['nodes'] if n['type'] == 'GeneretiDatLesson')
lesson['widgets_values'][0] = json.dumps(guide, ensure_ascii=False, indent=2)
lesson['properties']['generetiOperatorText'] = {'guide': lesson['widgets_values'][0]}
lesson['title'] = 'ꘇ build a feedback AV patch · record / play'
flow_path.write_text(json.dumps(flow, ensure_ascii=False, indent=2)+'\n')
starter = copy.deepcopy(flow)
starter.update(nodes=[copy.deepcopy(lesson)], links=[], groups=[], last_node_id=lesson['id'], last_link_id=0)
starter['nodes'][0]['pos'] = [0, 0]
starter['nodes'][0]['size'] = [700, 760]
starter['extra']['ds'] = {'scale': .8, 'offset': [50, 90]}
(FLOWS / 'ꘇ-Feedback-AV-Build-Tutorial.json').write_text(json.dumps(starter, ensure_ascii=False, indent=2)+'\n')
(LESSONS / 'feedback-av.json').write_text(json.dumps(starter, ensure_ascii=False, indent=2)+'\n')
catalog_path = LESSONS / 'catalog.json'
catalog = json.loads(catalog_path.read_text())
catalog = [g for g in catalog if g['id'] != guide['id']] + [guide]
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+'\n')
