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

def _gradient(cell,d):
    h=_hash(cell)
    return sum(x*np.where((h>>i)&1,1.,-1.) for i,x in enumerate(d))

def noise(kind,*coordinates):
    n=len(coordinates)
    if n<1 or n>4:raise ValueError('Noise requires 1–4 coordinates')
    p=np.broadcast_arrays(*[np.asarray(x,dtype=np.float64) for x in coordinates])
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
