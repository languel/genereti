"""Model-free spatial cleanup. BHWC straight RGB(A), clamp-to-edge sampling.

Original short edge-direction filter inspired by the FXAA whitepaper; this is
not a port of NVIDIA FXAA. Bicubic uses PyTorch's cubic coefficient (-0.75).
"""
import math
import torch
import torch.nn.functional as F


def _premul(a):
    return torch.cat((a[..., :3] * a[..., 3:], a[..., 3:]), -1)


def _straight(a):
    alpha = a[..., 3:].clamp(0, 1)
    return torch.cat((a[..., :3] / alpha.clamp_min(1e-8), alpha), -1).clamp(0, 1)


def _tap(a, dx, dy):
    h, w = a.shape[1:3]
    x = (torch.arange(w, device=a.device) + dx).clamp(0, w-1).long()
    y = (torch.arange(h, device=a.device) + dy).clamp(0, h-1).long()
    return a[:, y][:, :, x]


def _sample(a, uv):
    grid = (uv*2-1).expand(a.shape[0], -1, -1, -1)
    return _straight(F.grid_sample(_premul(a).permute(0, 3, 1, 2), grid,
                                  align_corners=False, padding_mode='border').permute(0, 2, 3, 1))


def cleanup(image, width=1024, height=1024, method='bicubic', smoothing=0.,
            color_threshold=.12, antialias=0., sharpen=0.):
    if image.ndim != 4 or image.shape[-1] not in (3, 4):
        raise ValueError('Expected BHWC RGB or RGBA IMAGE')
    if method not in ('bilinear', 'bicubic'):
        raise ValueError('Resize method must be bilinear or bicubic')
    if not 1 <= width <= 4096 or not 1 <= height <= 4096:
        raise ValueError('Output dimensions must be 1..4096')
    if not all(math.isfinite(v) for v in (smoothing, color_threshold, antialias, sharpen)):
        raise ValueError('Cleanup controls must be finite')
    a = image if image.shape[-1] == 4 else torch.cat((image, torch.ones_like(image[..., :1])), -1)
    smoothing, antialias, sharpen = [max(0., min(1., v)) for v in (smoothing, antialias, sharpen)]
    if smoothing:
        acc = torch.zeros_like(a)
        weights = torch.zeros_like(a[..., :1])
        center = _premul(a)
        for y in range(-1, 2):
            for x in range(-1, 2):
                tap = _premul(_tap(a, x, y))
                delta = ((tap-center)**2).sum(-1, keepdim=True)
                weight = torch.exp(-delta/(2*max(color_threshold, .001)**2) - (x*x+y*y)/2)
                acc += weight*tap
                weights += weight
        a = _straight(torch.lerp(center, acc/weights.clamp_min(1e-8), smoothing))
    if a.shape[1:3] != (height, width):
        a = _straight(F.interpolate(_premul(a).permute(0, 3, 1, 2), size=(height, width),
                                    mode=method, align_corners=False).permute(0, 2, 3, 1))
    if antialias:
        # Luminance gradient -> tangent. Two short fractional-pixel taps avoid
        # indiscriminately blurring flat regions and do not change alpha.
        lum = (_premul(a)[..., :3]*a.new_tensor([.2126, .7152, .0722])).sum(-1, keepdim=True)
        n, s, e, w = [_tap(lum, x, y) for x, y in ((0,-1),(0,1),(1,0),(-1,0))]
        gx, gy = e-w, s-n
        norm = torch.maximum(gx.abs(), gy.abs()).clamp_min(1e-6)
        y, x = torch.meshgrid(torch.arange(height, device=a.device, dtype=a.dtype),
                              torch.arange(width, device=a.device, dtype=a.dtype), indexing='ij')
        uv = torch.stack(((x+.5)/width, (y+.5)/height), -1).unsqueeze(0)
        direction = torch.cat((-gy/norm/width, gx/norm/height), -1)*.5
        lo = torch.minimum(torch.minimum(n,s), torch.minimum(e,w))
        hi = torch.maximum(torch.maximum(n,s), torch.maximum(e,w))
        limit = torch.maximum(hi*.125, hi.new_tensor(.0312))
        active = ((hi-lo-limit)/limit).clamp(0,1)*antialias
        filtered = (_premul(_sample(a, uv+direction)) + _premul(_sample(a, uv-direction)))*.5
        rgb = filtered[..., :3]/filtered[..., 3:].clamp_min(1e-8)
        a = torch.cat((torch.lerp(a[..., :3], rgb, active), a[..., 3:]), -1)
    if sharpen:
        neighbors = [_tap(a, x, y) for x,y in ((0,-1),(0,1),(1,0),(-1,0))]
        # Ignore hidden RGB and clamp to the local envelope to limit halos.
        colors = [torch.where(t[..., 3:] > 1e-8, t[..., :3], a[..., :3]) for t in neighbors]
        stack = torch.stack([a[..., :3], *colors])
        rgb = a[..., :3] + sharpen*(a[..., :3]-sum(colors)*.25)
        a = torch.cat((rgb.clamp(stack.amin(0), stack.amax(0)), a[..., 3:]), -1)
    return a.clamp(0, 1)
