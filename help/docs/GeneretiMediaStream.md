# 2D stream quick reference

A browser source for local images, videos, animated GIFs, direct media URLs or a connected live IMAGE. Clear loaded media with **×** to use the IMAGE input. Open a file with **+**, or enter a URL and press Load. Press Play to stream; video is muted by default. Loop and frame rate control playback. Restart returns video to its beginning.

Width and height can match the source, match an open output viewer, or use explicit dimensions. Contain, Cover, Stretch and Native pixels determine framing. Live frames use these dimensions; Comfy Queue uploads the latest sampled media frame. A connected queued IMAGE passes through unchanged when no file/URL is loaded.

Saved media URLs load again when the workflow opens; playback requires Play. Local files use temporary browser URLs and must be selected again after reloading the page. Animated GIF sampling uses ImageDecoder; browsers without it report the limitation. Supported video codecs depend on the browser. URLs must address media files and allow CORS; web pages belong in Webview. Remote media is streamed by the browser, without a server proxy.

Freeze and minimize affect only the node preview. Connected consumers and output viewers continue receiving frames. Stop playback when finished. Node removal cancels playback, subscriptions and temporary URLs.

Try **ꘇ-2D-Stream-Compare** for two paper-stage images and the comparison viewer.
