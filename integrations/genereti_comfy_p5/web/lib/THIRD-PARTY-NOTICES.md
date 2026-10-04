# Livecode runtime notices

The Tixy evaluator, Play Core compatibility modules and source transformer, Orca
engine, and Manim compiler/cue controller in `ported/` are adapted from the
MIT-licensed components of [Underscores](https://github.com/languel/underscores).
Copyright (c) 2026 Underscores contributors. See `UNDERSCORES-LICENSE`.

Play Core's lifecycle and module contract follows
[`ertdfgcvb/play.core`](https://github.com/ertdfgcvb/play.core), Apache-2.0.
The bundled compatibility implementation and examples are authored in
Underscores/Genereti; upstream Play Core programs are not bundled.

The Orca operator model follows
[Orca by Hundredrabbits](https://github.com/hundredrabbits/Orca).
Copyright (c) 2017 Hundredrabbits. Its MIT license follows:

MIT License

Copyright (c) 2017 Hundredrabbits

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

KaTeX and manim-web are MIT-licensed; their licenses and linked dependency legal
notices ship beside the browser bundles in `web/lib/`. KaTeX WOFF2 fonts are
embedded in the runtime stylesheet for offline previews and captures. Manim's
MathJax math renderer is bundled with the separate, lazily loaded Manim library.
These notices do not change the license of other Genereti integrations.
