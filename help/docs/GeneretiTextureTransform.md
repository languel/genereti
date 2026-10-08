# Transform quick reference

Move, scale or rotate a finished image. Its IMAGE output keeps the source resolution; outside the image is transparent.

| Control | Meaning |
| --- | --- |
| `translate_x`, `translate_y` | Fractions of the image dimensions; 0.1 moves by 10% |
| `scale` | 1 keeps the original size; transformation is centered |
| `rotate` | Degrees |
| `flip_x`, `flip_y` | Mirror horizontally or vertically |

Connect numeric signals to automate these controls. Use noise/expression domain offsets when you want to change the generated pattern rather than transform its final pixels.
