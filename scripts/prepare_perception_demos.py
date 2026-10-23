#!/usr/bin/env python3
"""Rebuild portable Holistic demos; optionally prepare local early-film test assets.

Media and local workflows are written outside Git. No capture starts automatically.
"""
import argparse
import copy
import json
from pathlib import Path
import subprocess
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / 'integrations/comfyui_genereti/workflows'
RECIPES = {
    'sandow': ('Sandow*.webm', 1, 9),
    'discus': ('Lancement_du_disque*.webm', 2, 8),
    'shotput': ('Lancement_du_poids*.webm', 2, 9),
    'dance': ('Danse_serpentine*.webm', 0, 14),
}

def wire_clean_underlay(graph):
    provider = next(n for n in graph['nodes'] if n['type'] == 'GeneretiPerceptionProvider')
    for node in graph['nodes']:
        if node['type'] != 'GeneretiPerceptionFeatures' and not (node['type'] == 'GeneretiLivecode' and 'Four pens' in node.get('title', '')):
            continue
        inputs = node.setdefault('inputs', [])
        slot = next((i for i, item in enumerate(inputs) if item['name'] == 'image'), None)
        if slot is None:
            slot = len(inputs)
            inputs.append({'name': 'image', 'type': 'IMAGE', 'link': None})
        if inputs[slot].get('link') is not None:
            continue
        link = max([graph.get('last_link_id', 0), *(item[0] for item in graph['links'])]) + 1
        inputs[slot]['link'] = link
        graph['links'].append([link, provider['id'], 0, node['id'], slot, 'IMAGE'])
        output = provider['outputs'][0]
        output['links'] = [*(output.get('links') or []), link]
        graph['last_link_id'] = link

def rebuild():
    paths = sorted(WORKFLOWS.glob('*Perception-0[1-4]-*.json'))
    graphs = {}
    for path in paths:
        graph = json.loads(path.read_text())
        for node in graph['nodes']:
            if node['type'] == 'GeneretiMediaStream':
                node['title'] = 'ꘇ Film source · + load · ▶ play'
                node['properties'].update(genereti_media_kind='video', genereti_media_url='', genereti_media_fps=15, genereti_media_speed=.5, genereti_media_size=512)
            elif node['type'] == 'GeneretiPerceptionProvider':
                node['title'] = 'ꘇ Holistic · ▶ starts installed model'
                node['widgets_values'] = ['body', 'pose', 15, 'holistic', '', 'Live']
                node['properties']['genereti_widget_values'] = {'stream': 'body', 'task': 'pose', 'max_fps': 15, 'tasks': 'holistic', 'features': ''}
                node['size'] = [420, 540]
                node['properties']['generetiProviderOverlay'] = False
                node['outputs'][0]['name'] = 'image'
                if not any(o['name'] == 'overlay' for o in node['outputs']):
                    node['outputs'].append({'name': 'overlay', 'type': 'IMAGE', 'links': None, 'slot_index': 2})
            elif node['type'] == 'GeneretiPerceptionFeatures':
                node['title'] = 'ꘇ Features · regions / vertices · zoom / pan'
                node['properties'].update(generetiSelectionMap='combined', generetiSelectionMapOpen=True, generetiFeatureGrid=False, generetiFeaturePick='regions', generetiSelectionSets=[{'name': 'Face outline and brow', 'selectors': ['@face.face_oval', '@face.left_eyebrow']}, {'name': 'Left index and nose', 'selectors': ['hands.left.index_tip', 'pose.nose']}, {'name': 'Body-driven pen', 'selectors': ['pose.right_wrist', 'pose.left_wrist']}])
                node['size'] = [500, 920]
        if '01-Streams' in path.name:
            selected = next(n for n in graph['nodes'] if n['type'] == 'GeneretiPerceptionFeatures')
            selected['widgets_values'][1] = '@pose.torso @face.face_oval @hands.left.index'
        if '02-Drawing' in path.name:
            selected = next(n for n in graph['nodes'] if n['type'] == 'GeneretiPerceptionFeatures')
            joints = ['pose.left_wrist', 'pose.right_wrist', 'pose.left_ankle', 'pose.right_ankle']
            selected['widgets_values'][1] = ' '.join(joints)
            selected['properties']['generetiSelectionSets'][-1] = {'name': 'Four body-driven pens', 'selectors': joints}
            drawing = next(n for n in graph['nodes'] if n['type'] == 'GeneretiLivecode')
            drawing['title'] = 'ꘇ Four pens · wrists + ankles · R clears trails'
            drawing['widgets_values'][4] = (ROOT / 'docs/examples/perception-drawing.js').read_text()
            drawing['widgets_values'][5] = '{}'
        if '04-Nose-Touch' in path.name:
            graph['nodes'] = [n for n in graph['nodes'] if n['id'] not in [8, 9]]
            graph['links'] = [link for link in graph['links'] if link[1] not in [8, 9] and link[3] not in [8, 9]]
            for n in graph['nodes']:
                for output in n.get('outputs', []):
                    if output.get('links'):
                        output['links'] = [i for i in output['links'] if any(link[0] == i for link in graph['links'])]
                if n['type'] == 'GeneretiPerceptionEvents':
                    n['title'] = 'ꘇ Left index near nose · editable distance rule'
                    n['widgets_values'][2] = json.dumps({'version': 1, 'rules': [{'name': 'touch.nose', 'steps': [{'distance': ['pose.nose', 'hands.left.index_tip'], 'op': '<', 'value': .08, 'hold_ms': 150}], 'within_ms': 1500, 'cooldown_ms': 500}]})
                elif n['type'] == 'GeneretiPerceptionFeatures':
                    n['widgets_values'][1] = 'hands.left.index_tip pose.nose'
            graph['last_node_id'] = max(n['id'] for n in graph['nodes'])
            graph['last_link_id'] = max(link[0] for link in graph['links'])
        graphs[path.name] = graph
    study = copy.deepcopy(graphs['ꘇ-Perception-01-Streams.json'])
    for n in study['nodes']:
        if n['type'] == 'GeneretiPerceptionFeatures':
            n['widgets_values'][1] = '@face.face_oval @face.left_eyebrow @face.lips_outer'
            n['properties']['generetiSelectionMap'] = 'face'
            n['properties']['generetiFeatureSelectedOnly'] = True
    graphs['ꘇ-Perception-05-Region-Study.json'] = study
    for name in ['ꘇ-Perception-06-Measures-Regions.json','ꘇ-Perception-07-Movement-Painting-Lesson.json']:
        extra = WORKFLOWS / name
        if extra.exists():
            graphs[extra.name] = json.loads(extra.read_text())
    for name, graph in graphs.items():
        wire_clean_underlay(graph)
        (WORKFLOWS / name).write_text(json.dumps(graph, ensure_ascii=False, indent=2) + '\n')
    return graphs

def prepare(args, graphs):
    destination = args.input_dir / 'genereti-demo-local/earlyfilm'
    destination.mkdir(parents=True, exist_ok=True)
    for key, (pattern, start, duration) in RECIPES.items():
        source = next(args.source_dir.glob(pattern), None)
        if source is None:
            raise FileNotFoundError(f'Missing {pattern} in {args.source_dir}')
        target = destination / (key + '.webm')
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(start), '-i', str(source), '-t', str(duration), '-an', '-vf', "scale='min(768,iw)':-2,fps=15", '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-threads', '4', str(target)], check=True)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for name, graph in graphs.items():
        local = copy.deepcopy(graph)
        key = 'dance' if '07-' in name else 'discus' if '02-' in name else 'shotput' if '03-' in name else 'sandow'
        url = '/view?' + urlencode({'filename': key + '.webm', 'type': 'input', 'subfolder': 'genereti-demo-local/earlyfilm'})
        for n in local['nodes']:
            if n['type'] == 'GeneretiMediaStream':
                n['properties']['genereti_media_url'] = url
                n['properties']['genereti_media_kind'] = 'video'
        (args.output_dir / name).write_text(json.dumps(local, ensure_ascii=False, indent=2) + '\n')
    print(f'Local media: {destination}\nReady-to-load workflows: {args.output_dir}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path)
    parser.add_argument('--input-dir', type=Path)
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'output/perception-demos')
    args = parser.parse_args()
    if bool(args.source_dir) != bool(args.input_dir):
        parser.error('--source-dir and --input-dir must be supplied together')
    graphs = rebuild()
    if args.source_dir:
        prepare(args, graphs)
