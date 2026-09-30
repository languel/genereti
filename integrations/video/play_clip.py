#!/usr/bin/env python3
"""Play an MP4 through Genereti's existing TouchDesigner and p5 output bridge.

Requires ffmpeg/ffprobe and Pillow. Run with Genereti's Python environment:
  ./.venv/bin/python integrations/video/play_clip.py clip.mp4 --loop
"""
from __future__ import annotations

import argparse
import io
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from PIL import Image


def video_dimensions(path: Path) -> tuple[int, int]:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height", "-of", "csv=s=x:p=0",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    width, height = (int(value) for value in result.stdout.strip().split("x", 1))
    return width, height


def read_frame(stream, size: int) -> bytes | None:
    frame = bytearray()
    while len(frame) < size:
        chunk = stream.read(size - len(frame))
        if not chunk:
            if frame:
                raise RuntimeError("ffmpeg ended in the middle of a frame")
            return None
        frame.extend(chunk)
    return bytes(frame)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path, help="MP4 or other ffmpeg-readable video")
    parser.add_argument("--server", default="http://127.0.0.1:8765", help="Genereti base URL")
    parser.add_argument("--fps", type=float, default=25.0, help="Published frame rate")
    parser.add_argument("--loop", action="store_true", help="Loop the clip until Ctrl-C")
    parser.add_argument("--max-side", type=int, default=1024, help="Downscale larger frames")
    args = parser.parse_args()

    video = args.video.expanduser().resolve()
    if not video.is_file():
        parser.error(f"video file not found: {video}")
    if args.fps <= 0 or args.max_side < 32:
        parser.error("--fps must be positive and --max-side must be at least 32")

    try:
        width, height = video_dimensions(video)
    except FileNotFoundError as exc:
        print("ffprobe is required; install ffmpeg first.", file=sys.stderr)
        return 2
    scale = min(1.0, args.max_side / max(width, height))
    width = max(2, round(width * scale / 2) * 2)
    height = max(2, round(height * scale / 2) * 2)
    frame_size = width * height * 3

    command = ["ffmpeg", "-hide_banner", "-loglevel", "error"]
    if args.loop:
        command += ["-stream_loop", "-1"]
    command += [
        "-re", "-i", str(video), "-an",
        "-vf", f"fps={args.fps},scale={width}:{height}:flags=lanczos",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
    ]

    print(f"Publishing {video.name} at {args.fps:g} fps to {args.server}/output-frame")
    print("Open Genereti's /output in TouchDesigner or /p5 in a browser. Ctrl-C stops playback.")
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    frame_count = 0
    started = time.monotonic()
    next_frame_at = started
    frame_interval = 1.0 / args.fps
    interrupted = False
    try:
        assert process.stdout is not None
        while True:
            raw = read_frame(process.stdout, frame_size)
            if raw is None:
                break
            image = Image.frombytes("RGB", (width, height), raw)
            encoded = io.BytesIO()
            image.save(encoded, format="JPEG", quality=88)
            request = Request(
                args.server.rstrip("/") + "/api/output-frame",
                data=encoded.getvalue(),
                headers={"Content-Type": "image/jpeg"},
                method="POST",
            )
            try:
                with urlopen(request, timeout=5) as response:
                    if response.status != 204:
                        raise RuntimeError(f"Genereti returned HTTP {response.status}")
            except HTTPError as exc:
                raise RuntimeError(f"Genereti rejected the frame: HTTP {exc.code}") from exc
            except URLError as exc:
                raise RuntimeError(f"Cannot reach Genereti at {args.server}: {exc.reason}") from exc
            frame_count += 1
            next_frame_at += frame_interval
            delay = next_frame_at - time.monotonic()
            if delay > 0:
                time.sleep(delay)
            elif delay < -frame_interval:
                next_frame_at = time.monotonic()
            if frame_count % max(1, round(args.fps * 10)) == 0:
                elapsed = time.monotonic() - started
                print(f"Published {frame_count} frames ({frame_count / elapsed:.1f} fps)", flush=True)
    except KeyboardInterrupt:
        interrupted = True
        print("\nStopping clip playback.")
    except (BrokenPipeError, RuntimeError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    finally:
        if process.stdout:
            process.stdout.close()
        if process.poll() is None:
            process.terminate()
            process.wait(timeout=3)

    return 0 if interrupted else (process.returncode or 0)


if __name__ == "__main__":
    raise SystemExit(main())
