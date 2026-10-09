"""Numeric expression declarations. Source is parsed, never executed."""
import json
import math
import re

NUMBER = r'[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?'
RESERVED = set('t i x y z c v a b w h pi tau __ constructor prototype __proto__ g_time g_beat g_bar g_bpm g_ticks g_phase g_playing g_rate g_root g_tuning sin cos tan abs sqrt floor ceil exp log fract min max minimum maximum pow clamp mix step noise perlin simplex value'.split())
ANNOTATION = re.compile(rf'^\s*//\s*@param\s+([A-Za-z_]\w*)\s*=\s*({NUMBER})\s*\(\s*(int\s+)?({NUMBER})\s*\.\.\s*({NUMBER})(?:\s*,?\s*step\s*:?\s*({NUMBER}))?\s*\)\s*$')
INLINE = re.compile(rf'^\s*(float|int|let|const|var)\s+([A-Za-z_]\w*)\s*=\s*({NUMBER})\s*;?\s*/\*\s*({NUMBER})\s*\.\.\s*({NUMBER})(?:\s*,?\s*step\s*:?\s*({NUMBER}))?\s*\*/\s*;?\s*$')

def prepare_expression(source, parameters=None, controls=None):
    if len(source)>2048: raise ValueError('Expression is limited to 2048 characters')
    state=json.loads(parameters) if isinstance(parameters,str) else parameters or {}
    if not isinstance(state,dict): raise ValueError('Expression parameters must be an object')
    overrides=state.get('values',state);slots=state.get('slots',{})
    if not isinstance(overrides,dict) or not isinstance(slots,dict):raise ValueError('Invalid expression parameter state')
    values={};lines=[]
    for line in source.split('\n'):
        a=ANNOTATION.fullmatch(line);b=INLINE.fullmatch(line)
        if a:name,initial,kind,low,high,step=a.groups();integer=bool(kind)
        elif b:kind,name,initial,low,high,step=b.groups();integer=kind=='int'
        else:
            if '@param' in line:raise ValueError('Use // @param name = 1 (0..4)')
            lines.append(line);continue
        if name in RESERVED:raise ValueError('Reserved expression name: '+name)
        if name in values:raise ValueError('Duplicate parameter: '+name)
        if len(values)==64:raise ValueError('At most 64 expression parameters')
        initial,low,high=map(float,(initial,low,high))
        if not all(map(math.isfinite,(initial,low,high))) or high<=low:raise ValueError('Invalid range: '+name)
        if step is not None and (not math.isfinite(float(step)) or float(step)<=0):raise ValueError('Invalid step: '+name)
        value=(controls or {}).get('value'+str(slots.get(name)),overrides.get(name,initial))
        try:value=float(value)
        except (TypeError,ValueError):value=initial
        if not math.isfinite(value):value=initial
        value=max(low,min(high,value));values[name]=math.floor(value+.5) if integer else value
    result=re.sub(r'/\*[\s\S]*?\*/|//[^\n]*',' ','\n'.join(lines))
    return re.sub(r'\b[A-Za-z_]\w*\b',lambda m:'('+str(values[m[0]])+')' if m[0] in values else m[0],result).strip()

def parameter_inputs(io):
    return [io.String.Input('parameters',default='{}',optional=True,socketless=True),
            io.Autogrow.Input('controls',template=io.Autogrow.TemplatePrefix(
                io.MultiType.Input('value',types=[io.Float,io.Int]),prefix='value',min=0,max=64),optional=True)]
