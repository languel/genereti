"""Restricted arithmetic expression evaluation, shared by queued TOP and CHOP."""
import ast
import math
import operator
from functools import lru_cache
import numpy as np
FUNCTIONS={name:getattr(np,name) for name in ('sin','cos','tan','abs','sqrt','floor','ceil','exp','log','minimum','maximum')}
FUNCTIONS.update(min=np.minimum,max=np.maximum,pow=np.power,fract=lambda x:x-np.floor(x),clamp=np.clip,mix=lambda a,b,k:a+(b-a)*k,step=lambda a,x:np.where(x<a,0.,1.))
try:
    from .noise import noise
except ImportError:
    # CHOP loads this shared evaluator directly without importing the TOP pack.
    import importlib.util
    from pathlib import Path
    _noise_spec=importlib.util.spec_from_file_location('genereti_noise',Path(__file__).with_name('noise.py'))
    _noise_module=importlib.util.module_from_spec(_noise_spec)
    _noise_spec.loader.exec_module(_noise_module)
    noise=_noise_module.noise
FUNCTIONS.update({name:(lambda *p, kind=name:noise('perlin' if kind=='noise' else kind,*p)) for name in ('noise','perlin','simplex','value')})
OPS={ast.Add:operator.add,ast.Sub:operator.sub,ast.Mult:operator.mul,ast.Div:operator.truediv,ast.Mod:np.fmod,ast.Pow:np.power}

@lru_cache(maxsize=128)
def parse(source):
    if len(source)>2048:raise ValueError('Expression is limited to 2048 characters')
    tree=ast.parse(source.replace('^','**'),mode='eval')
    if sum(1 for _ in ast.walk(tree))>512:raise ValueError('Expression is too complex')
    return tree

def evaluate(source,values):
    tree=parse(source)
    def run(node):
        if isinstance(node,ast.Constant) and type(node.value) in (int,float): return node.value
        if isinstance(node,ast.Name):
            if node.id in ('pi','tau'): return math.pi*(2 if node.id=='tau' else 1)
            if node.id in values:return values[node.id]
            raise ValueError('Unknown variable: '+node.id)
        if isinstance(node,ast.BinOp) and type(node.op) in OPS:return OPS[type(node.op)](run(node.left),run(node.right))
        if isinstance(node,ast.UnaryOp) and isinstance(node.op,(ast.USub,ast.UAdd)):return (-1 if isinstance(node.op,ast.USub) else 1)*run(node.operand)
        if isinstance(node,ast.Call) and isinstance(node.func,ast.Name) and node.func.id in FUNCTIONS and not node.keywords:return FUNCTIONS[node.func.id](*(run(a) for a in node.args))
        raise ValueError('Only arithmetic, named variables and math functions are allowed')
    with np.errstate(all='ignore'):return np.nan_to_num(run(tree.body),nan=0.,posinf=0.,neginf=0.)
