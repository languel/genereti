# Noise quick reference

Noise creates a pattern or signal without requiring an input. Start with zero offsets, then change one parameter at a time.

## Texture noise

- **algorithm:** Perlin, simplex or value noise.
- **dimensions:** 1–4. One/two dimensions animate by moving x; three dimensions animate z; four dimensions use a separate time coordinate.
- **width/height:** output resolution.
- **scale:** domain scale; larger values show smaller features.
- **seed:** repeatable domain variation.
- **z:** slice through a multidimensional noise field.
- **time/speed:** time coordinate and animation speed.
- **octaves/lacunarity/gain:** layer count, scale change and strength change per layer.
- **color:** grayscale or separate RGB samples.

## Domain offsets

`offset_x/y/z/t` are numeric controls. Zero leaves the domain unchanged. Connect a signal to automate a coordinate. Offset z is useful for changing a 3D slice; offset t changes the sampled time.

These change the noise field being sampled. **ꘇ top.transform** instead translates, scales or rotates the finished image.

## Signal noise

**ꘇ chop.noise** produces deterministic pseudorandom control samples. It is a different generator from coherent texture noise. **samples**, **sample_rate** and **channels** describe the signal block; **amplitude/offset** adjust its range. Its domain offsets perturb the sample coordinates.

## Noise inside an expression

```text
0.5 + 0.5*noise(x*8, y*8, t*0.2)
```

`noise` aliases Perlin; `simplex` and `value` select other algorithms. Expression noise is signed; texture noise maps it into 0–1.

Live follows the selected clock. Queue uses the explicit time. Open the related lesson with **▷** for dimension and expression examples.
