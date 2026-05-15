#!/usr/bin/env python3
"""Generate placeholder PWA icons (blue circle, white breath waves)."""
import math
import struct
import zlib
from pathlib import Path

BLUE = (123, 167, 201)
WHITE = (255, 255, 255)
BG = (245, 248, 252)


def png_chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def write_png(path: Path, size: int) -> None:
    pixels = bytearray()
    cx = cy = (size - 1) / 2
    radius = size * 0.42

    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            dx = x - cx
            dy = y - cy
            dist = math.hypot(dx, dy)
            if dist <= radius:
                # Three soft arcs suggesting breath
                wave = 0.0
                for phase in (-0.35, 0.0, 0.35):
                    wave += math.exp(
                        -((dx / (size * 0.22) + phase) ** 2 + (dy / (size * 0.55)) ** 2) * 2.2
                    )
                if wave > 0.55 and abs(dx) < size * 0.2:
                    row.extend(WHITE)
                else:
                    row.extend(BLUE)
            else:
                row.extend(BG)
        pixels.extend(row)

    raw = zlib.compress(bytes(pixels), 9)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", ihdr)
        + png_chunk(b"IDAT", raw)
        + png_chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def main() -> None:
    root = Path(__file__).resolve().parent.parent / "public"
    for name, size in [("icon-192.png", 192), ("icon-512.png", 512), ("icon-180.png", 180)]:
        write_png(root / name, size)
        print(f"Wrote {name}")


if __name__ == "__main__":
    main()
