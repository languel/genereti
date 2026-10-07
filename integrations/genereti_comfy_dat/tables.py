"""Immutable string tables with standard CSV/JSON serialization."""
import csv
import io
import json
import importlib.util
from pathlib import Path
import numpy as np
_spec=importlib.util.spec_from_file_location('genereti_dat_expression',Path(__file__).resolve().parents[1]/'genereti_comfy_texture/expression.py');_expr=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_expr)

def cell(value):
    if isinstance(value,(dict,list,bool)) or value is None:return json.dumps(value,separators=(',',':'),ensure_ascii=False)
    return str(value)
def table(rows):return {'rows':[[cell(c) for c in row] for row in rows]}
def text(data):
    out=io.StringIO();csv.writer(out,lineterminator='\n').writerows(data['rows']);return out.getvalue()
def parse(source,delimiter=','):
    rows=list(csv.reader(io.StringIO(source),delimiter=delimiter,strict=True));return table(rows)
def from_json(source):
    value=json.loads(source)
    if isinstance(value,dict):return table([['key','value'],*[[k,v] for k,v in value.items()]])
    if not isinstance(value,list):return table([[value]])
    if value and all(isinstance(v,dict) for v in value):
        keys=list(dict.fromkeys(k for row in value for k in row));return table([keys,*[[row.get(k,'') for k in keys] for row in value]])
    return table([v if isinstance(v,list) else [v] for v in value])
def process(kind,data,values,other=None):
    rows=data['rows'];width=max(map(len,rows),default=0)
    if kind=='Select':
        columns=[int(c) for c in values.get('columns','').split()] if values.get('columns','').strip() else list(range(width));start=max(0,int(values.get('start',0)));count=int(values.get('count',100000));return table([[(r[c] if 0<=c<len(r) else '') for c in columns] for r in rows[start:start+count]])
    if kind=='Merge':return table(rows+(other or {'rows':[]})['rows'])
    if kind=='Transpose':return table([[r[c] if c<len(r) else '' for r in rows] for c in range(width)])
    if kind=='Replace':return table([[c.replace(values['find'],values['replace']) for c in row] for row in rows])
    if kind=='Expression':
        result=[]
        for y,row in enumerate(rows):
            result.append([])
            for x,cell in enumerate(row):
                try:v=float(cell)
                except ValueError:v=0
                result[-1].append(_expr.evaluate(values['expression'],dict(**_expr.performance_values(values.get("performance")),t=0,z=0,i=y*width+x,x=x,y=y,c=x,v=v,a=v,b=0,w=width,h=len(rows))))
        return table(result)
    return table(rows)
def to_chop(data,rate=60,header=True):
    rows=data['rows'];names=rows[0] if header and rows else [];body=rows[1:] if header else rows;channels={}
    for c in range(max(map(len,rows),default=0)):
        name=names[c] if c<len(names) else f'chan{c}'
        while name in channels:name+='_'
        vals=[]
        for row in body:
            try:vals.append(float(row[c]))
            except (ValueError,IndexError):vals.append(0.)
        channels[name]=np.nan_to_num(np.asarray(vals or [0],dtype=np.float32),nan=0.,posinf=0.,neginf=0.)
    return dict(channels=channels,sample_rate=rate,start=0.)


def cell_value(data,row,column):
    rows=data['rows'];text=rows[row][column] if 0<=row<len(rows) and 0<=column<len(rows[row]) else ''
    try:value=float(text)
    except ValueError:value=0.
    return text,value if np.isfinite(value) else 0.
def from_chop(data):
    names=list(data['channels']);arrays=list(data['channels'].values())
    return table([names,*zip(*arrays)]) if names else table([])
