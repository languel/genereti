# TouchDesigner

Start Genereti and press **Start live**, then make a **Web Render TOP** with URL `http://127.0.0.1:8765/output`. Set a custom resolution (512 × 512), turn **Only Update when Loaded** off, and turn **Cook Always** on.

For a starter component, run this in TouchDesigner’s Textport, replacing `/path/to/genereti` with your clone folder:

```python
exec(open('/path/to/genereti/integrations/touchdesigner/create_genereti.py').read())
```

The builder creates a uniquely named component and saves `Genereti.tox` to your home folder. It does not replace existing operators. Use `out1` as a normal TOP texture. `/p5` is an alternative URL for the p5.js stage.

TouchDesigner can send a camera or window feed through the browser input, or post an image to `/api/generate` from a background worker. Keep HTTP generation off TouchDesigner’s render thread. The app listens on this Mac’s loopback interface by default.

If an existing project has an older-labeled component, run the builder to create a fresh Genereti component. The builder intentionally leaves existing operators untouched; reconnect downstream TOPs to the new component's `out1` when ready.
