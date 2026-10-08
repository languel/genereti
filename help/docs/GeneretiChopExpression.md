# Expression quick reference

Write one arithmetic expression, not a JavaScript program. Its result is evaluated for each pixel/channel (TOP) or sample/channel (CHOP).

## Variables

| Name | Meaning |
| --- | --- |
| `t` | Time in seconds, including the time offset |
| `x`, `y` | TOP: normalized pixel coordinates. CHOP: x is sample position, y is its domain offset |
| `z` | Extra domain coordinate |
| `i` | Pixel or sample index |
| `c` | Channel index |
| `v`, `a` | Current input value; zero when no input is connected |
| `b` | Zero in Expression; not a second input image |
| `w`, `h` | TOP: width/height; CHOP: samples/channels |
| `pi`, `tau` | π and 2π |

`offset_x/y/z/t` shift the sampled domain. They are numeric controls; connect a signal to automate them. Use **ꘇ top.transform** to move, rotate or scale the finished image.

## Functions

`sin`, `cos`, `tan`, `abs`, `sqrt`, `floor`, `ceil`, `exp`, `log`, `min`, `max`, `minimum`, `maximum`, `pow`, `fract`, `clamp`, `mix`, `step`.

- `fract(x)` returns the fractional part.
- `clamp(x, low, high)` limits a value.
- `mix(a, b, amount)` blends between two values.
- `step(edge, x)` is zero below the edge, one otherwise.
- `noise(x,y)`, `perlin(x,y)`, `simplex(x,y)`, `value(x,y)` sample signed noise. `noise` means Perlin. Supply 1–4 coordinates; map signed noise to brightness with `0.5 + 0.5*noise(...)`.

## Copyable examples

Moving waves:

```text
0.5 + 0.5*sin(t + x*12)*cos(y*12)
```

Moving dots:

```text
step(0.96, sin(t*1.5+x*24)*cos(y*24-t))
```

Noise texture:

```text
0.5 + 0.5*simplex(x*8, y*8, t*0.2)
```

CHOP oscillator:

```text
sin(t*tau)
```

## Operators and boundaries

Use `+ - * / %` and powers `^` or `**`. Parentheses group calculations. No assignments, loops, comparisons, JavaScript objects or arbitrary function calls. TOP clamps RGB to 0–1 and keeps alpha; CHOP can return signed or larger values.

Shared performance values are `__.time`, `__.beat`, `__.bar`, `__.bpm`, `__.ticks`, `__.phase`, `__.playing`, `__.rate`, `__.root`, `__.tuning`. Live time follows the selected clock; Queue uses the explicit snapshot/time.

Use the **▷ Start related lesson** button for a guided exercise. Opening this reference does not run the graph.
