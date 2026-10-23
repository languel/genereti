"""Vectorized 1–4D lattice noise; same integer hash as JS/WGSL."""
import math
import numpy as np

def _hash(cell):
    h=np.full(np.shape(cell[0]),2166136261,dtype=np.uint64)
    for p in cell:
        h=((h^(np.asarray(p,dtype=np.int64).astype(np.uint64)&0xffffffff))*16777619)&0xffffffff
    h=((h^(h>>16))*2246822519)&0xffffffff
    h=((h^(h>>13))*3266489917)&0xffffffff
    return h^(h>>16)

# Where each algorithm's signed value really lives (0.5th-99.5th percentile, by dimension 1-4); same table as noise.js.
RANGE={"perlin":[[-0.5,0.5],[-0.5,0.48],[-0.44,0.45],[-0.4,0.4]],"value":[[-0.99,0.92],[-0.93,0.92],[-0.88,0.88],[-0.83,0.83]],"simplex":[[-0.5,0.5],[-0.94,0.94],[-1.0,1.0],[-0.92,0.92]],"hash":[[-0.99,0.88],[-0.99,0.99],[-0.99,0.99],[-0.99,0.99]],"worley":[[-0.69,1.0],[-0.8,0.92],[-0.86,0.79],[-0.89,0.64]],"voronoi":[[-0.86,0.97],[-0.99,0.99],[-0.99,0.99],[-0.99,0.99]],"cracks":[[-0.99,1.0],[-1.0,0.77],[-1.0,0.42],[-1.0,0.23]]}

def stretch(kind,n,value):
    lo,hi=RANGE[kind][n-1]
    return np.clip(2*(value-lo)/(hi-lo)-1,-1,1)

KINDS={'perlin':0,'value':1,'simplex':2,'hash':3,'worley':4,'voronoi':5,'cracks':6}

def _mix(h,salt):
    h=(h+((salt+1)*0x9e3779b9&0xffffffff))&0xffffffff
    h=((h^(h>>16))*2246822519)&0xffffffff
    h=((h^(h>>13))*3266489917)&0xffffffff
    return h^(h>>16)

def _cellular(kind,p):
    n=len(p);cell=[np.floor(x).astype(np.int64) for x in p]
    best=np.full(np.shape(p[0]),np.inf);second=best.copy();best_hash=np.zeros(np.shape(p[0]),dtype=np.uint64)
    for k in range(3**n):
        r=k;c=[]
        for x in cell:c.append(x+(r%3-1));r//=3
        h=_hash(c);dist=0.
        for i in range(n):dist=dist+(c[i]+_mix(h,i)/4294967295-p[i])**2
        closer=dist<best
        second=np.where(closer,best,np.where(dist<second,dist,second))
        best=np.where(closer,dist,best);best_hash=np.where(closer,h,best_hash)
    if kind=='worley':return np.clip(1-2*np.sqrt(best),-1,1)
    if kind=='cracks':return np.minimum(1,np.sqrt(second)-np.sqrt(best))*2-1
    return _mix(best_hash.astype(np.uint64),7)/4294967295*2-1

SHAPES=('fbm','ridged','billow','hybrid')

def shape(name,s):
    ridged=2*(1-np.abs(s))**2-1
    return ridged if name=='ridged' else 2*np.abs(s)-1 if name=='billow' else .5*(s+ridged) if name=='hybrid' else s

def _gradient(cell,d):
    h=_hash(cell)
    return sum(x*np.where((h>>i)&1,1.,-1.) for i,x in enumerate(d))

def noise(kind,*coordinates):
    n=len(coordinates)
    if n<1 or n>4:raise ValueError('Noise requires 1–4 coordinates')
    p=np.broadcast_arrays(*[np.asarray(x,dtype=np.float64) for x in coordinates])
    if kind=='hash':return _hash([np.floor(x).astype(np.int64) for x in p])/4294967295*2-1
    if kind in ('worley','voronoi','cracks'):return _cellular(kind,p)
    if kind=='simplex' and n>1:
        f=(math.sqrt(n+1)-1)/n;g=(1-1/math.sqrt(n+1))/n
        s=sum(p)*f;cell=[np.floor(x+s).astype(np.int64) for x in p];u=sum(cell)*g
        d=[x-cell[i]+u for i,x in enumerate(p)]
        rank=[sum((x>y)|((x==y)&(i>j)) for j,y in enumerate(d)) for i,x in enumerate(d)]
        result=0.
        for k in range(n+1):
            offset=[(r>=n-k).astype(np.int64) for r in rank]
            q=[x-offset[i]+k*g for i,x in enumerate(d)]
            a=np.maximum(0,(.5 if n==2 else .6)-sum(x*x for x in q))
            result+=a**4*_gradient([x+offset[i] for i,x in enumerate(cell)],q)
        return np.clip(result*{2:70,3:32,4:27}[n],-1,1)
    cell=[np.floor(x).astype(np.int64) for x in p];d=[x-cell[i] for i,x in enumerate(p)]
    u=[x*x*x*(x*(x*6-15)+10) for x in d];result=0.
    for k in range(2**n):
        o=[(k>>i)&1 for i in range(n)];c=[x+o[i] for i,x in enumerate(cell)]
        weight=math.prod(x if o[i] else 1-x for i,x in enumerate(u))
        result+=weight*(_hash(c)/4294967295*2-1 if kind=='value' else _gradient(c,[x-o[i] for i,x in enumerate(d)]))
    return result if kind=='value' else result/math.sqrt(n)
