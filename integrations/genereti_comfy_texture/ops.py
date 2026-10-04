"""Queued BHWC texture operations. Browser live equivalents use WebGPU."""
import math
import torch
import torch.nn.functional as F


def rgba(image):
    if image.ndim != 4 or image.shape[-1] not in (3, 4):
        raise ValueError('Expected a BHWC RGB or RGBA IMAGE')
    return image if image.shape[-1] == 4 else torch.cat((image, torch.ones_like(image[..., :1])), -1)


def match(a, b):
    a, b = rgba(a), rgba(b).to(a)
    if b.shape[1:3] != a.shape[1:3]:
        b = sample(b, coords(a))
    if b.shape[0] == 1:
        b = b.expand(a.shape[0], -1, -1, -1)
    if b.shape[0] != a.shape[0]:
        raise ValueError('Image batches must match, or B must contain one image')
    return a, b


def composite(a, b, operation='over', opacity=1.):
    a, b = match(a, b)
    if operation == 'under':
        return composite(b, a, 'over', opacity)
    if operation == 'cross':
        # Interpolate premultiplied colors; transparent RGB must not leave halos.
        alpha = torch.lerp(b[..., 3:], a[..., 3:], opacity)
        rgb = torch.lerp(b[..., :3]*b[..., 3:], a[..., :3]*a[..., 3:], opacity)
        return torch.cat((rgb/alpha.clamp_min(1e-8), alpha), -1).clamp(0, 1)
    x, y = a[..., :3], b[..., :3]
    aa, ab = a[..., 3:]*opacity, b[..., 3:]
    blend = {'over': lambda:x, 'add':lambda:x+y, 'multiply':lambda:x*y,
             'screen':lambda:1-(1-x)*(1-y), 'difference':lambda:(x-y).abs()}[operation]()
    alpha = aa+ab*(1-aa)
    rgb = ((1-aa)*ab*y+(1-ab)*aa*x+aa*ab*blend)/alpha.clamp_min(1e-8)
    return torch.cat((rgb, alpha), -1).clamp(0, 1)


def arithmetic(a, b=None, operation='multiply', value=1.):
    a = rgba(a)
    y = match(a, b)[1][..., :3] if b is not None else torch.full_like(a[..., :3], value)
    x = a[..., :3]
    rgb = {'add':lambda:x+y, 'subtract':lambda:x-y, 'multiply':lambda:x*y,
           'divide':lambda:x/torch.where(y.abs()<1e-6,torch.full_like(y,1e-6),y), 'difference':lambda:(x-y).abs(),
           'minimum':lambda:torch.minimum(x,y), 'maximum':lambda:torch.maximum(x,y)}[operation]()
    return torch.cat((rgb.clamp(0,1), a[...,3:]), -1)


def sample(image, uv):
    # Sample transparent outside; premultiply before interpolation to avoid fringes.
    a = rgba(image)
    premul = torch.cat((a[...,:3]*a[...,3:], a[...,3:]), -1)
    grid = uv.mul(2).sub(1).unsqueeze(0).expand(a.shape[0], -1, -1, -1)
    out = F.grid_sample(premul.permute(0,3,1,2), grid, align_corners=False, padding_mode='zeros').permute(0,2,3,1)
    return torch.cat((out[...,:3]/out[...,3:].clamp_min(1e-8), out[...,3:]), -1)


def coords(a):
    h,w = a.shape[1:3]
    y,x = torch.meshgrid((torch.arange(h,device=a.device,dtype=a.dtype)+.5)/h,
                         (torch.arange(w,device=a.device,dtype=a.dtype)+.5)/w,indexing='ij')
    return torch.stack((x,y),-1)


def transform(image, translate_x=0., translate_y=0., scale=1., rotate=0., flip_x=False, flip_y=False):
    uv = coords(image)-.5
    r = math.radians(rotate)
    uv = (uv-torch.tensor([translate_x,translate_y],device=image.device,dtype=image.dtype))/max(scale,.001)
    x,y = uv.unbind(-1)
    uv = torch.stack((math.cos(r)*x+math.sin(r)*y,-math.sin(r)*x+math.cos(r)*y),-1)
    uv *= torch.tensor([-1 if flip_x else 1,-1 if flip_y else 1],device=image.device,dtype=image.dtype)
    return sample(image,uv+.5)


def homography(points):
    # Destination quadrilateral -> source unit square, in clockwise TL/TR/BR/BL order.
    rows, rhs = [], []
    for (x,y),(u,v) in zip(points,((0,0),(1,0),(1,1),(0,1))):
        rows.extend(((x,y,1,0,0,0,-u*x,-u*y),(0,0,0,x,y,1,-v*x,-v*y)))
        rhs.extend((u,v))
    try:
        h = torch.linalg.solve(torch.tensor(rows,dtype=torch.float64),torch.tensor(rhs,dtype=torch.float64))
    except RuntimeError as error:
        raise ValueError('Corner pin points must form a non-degenerate quadrilateral') from error
    return torch.cat((h,torch.ones(1,dtype=h.dtype))).reshape(3,3)


def corner_pin(image, points):
    uv=coords(image)
    p=torch.cat((uv,torch.ones_like(uv[...,:1])),-1) @ homography(points).to(image).T
    denominator=p[...,2:]
    safe=torch.where(denominator.abs()<1e-8,torch.full_like(denominator,1e-8),denominator)
    return sample(image,p[...,:2]/safe)


def crop(image,left=0.,top=0.,right=1.,bottom=1.):
    if right<=left or bottom<=top:
        raise ValueError('Crop right/bottom must exceed left/top')
    uv=coords(image)
    uv=uv*torch.tensor([right-left,bottom-top],device=image.device,dtype=image.dtype)+torch.tensor([left,top],device=image.device,dtype=image.dtype)
    return sample(image,uv)


def filter_image(image,operation='level',amount=1.):
    a=rgba(image); rgb=a[...,:3]
    if operation=='invert': rgb=torch.lerp(rgb,1-rgb,amount)
    elif operation=='monochrome': rgb=torch.lerp(rgb,(rgb*rgb.new_tensor([.2126,.7152,.0722])).sum(-1,keepdim=True).expand_as(rgb),amount)
    elif operation=='threshold': rgb=((rgb*rgb.new_tensor([.2126,.7152,.0722])).sum(-1,keepdim=True)>=amount).expand_as(rgb).to(rgb)
    elif operation=='level': rgb=rgb*amount
    elif operation=='opacity': return torch.cat((rgb,a[...,3:]*amount),-1).clamp(0,1)
    elif operation in ('blur','edge'):
        uv=coords(a); dx=amount/a.shape[2];dy=amount/a.shape[1]
        taps=[sample(a,uv+uv.new_tensor([x*dx,y*dy])) for y in (-1,0,1) for x in (-1,0,1)]
        if operation=='edge': rgb=(a[...,:3]*8-sum(t[...,:3] for i,t in enumerate(taps) if i!=4)).abs()
        else:
            alpha=sum(t[...,3:] for t in taps)/9
            rgb=sum(t[...,:3]*t[...,3:] for t in taps)/9/alpha.clamp_min(1e-8)
            return torch.cat((rgb,alpha),-1).clamp(0,1)
    else: raise ValueError('Unknown filter')
    return torch.cat((rgb.clamp(0,1),a[...,3:]),-1)
