#!/usr/bin/env python3
"""Generate the Circuit Breaker PWA icon set.

Pure standard library (zlib + struct) so the repo has no build dependencies.
Run from the project root:

    python3 tools/generate-icons.py

Outputs PNGs into assets/icons/.
"""

import math
import os
import struct
import zlib

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "icons")

BG_TOP = (7, 11, 20)
BG_BOTTOM = (13, 21, 38)
CYAN = (34, 224, 255)
VIOLET = (155, 108, 255)

# Lightning bolt, normalised coordinates (0..1, y grows downward).
BOLT = [
    (0.615, 0.075),
    (0.300, 0.560),
    (0.470, 0.560),
    (0.385, 0.925),
    (0.735, 0.430),
    (0.545, 0.430),
    (0.640, 0.075),
]


def write_png(path, width, height, rows):
    raw = b"".join(b"\x00" + bytes(row) for row in rows)
    comp = zlib.compress(raw, 9)

    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", comp)
    png += chunk(b"IEND", b"")
    with open(path, "wb") as fh:
        fh.write(png)


def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    return tuple(lerp(c1[i], c2[i], t) for i in range(3))


def over(dst, src, alpha):
    return tuple(lerp(dst[i], src[i], alpha) for i in range(3))


def point_in_poly(px, py, poly):
    inside = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if (y1 > py) != (y2 > py):
            xint = x1 + (py - y1) * (x2 - x1) / (y2 - y1)
            if px < xint:
                inside = not inside
    return inside


def dist_to_poly(px, py, poly):
    best = 1e9
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        dx, dy = x2 - x1, y2 - y1
        seg = dx * dx + dy * dy
        t = 0.0 if seg == 0 else max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / seg))
        cx, cy = x1 + t * dx, y1 + t * dy
        best = min(best, math.hypot(px - cx, py - cy))
    return best


def rounded_rect_coverage(px, py, size, radius, samples=2):
    """Anti-aliased coverage of a rounded square filling the canvas."""
    hit = 0
    total = samples * samples
    for sy in range(samples):
        for sx in range(samples):
            x = px + (sx + 0.5) / samples
            y = py + (sy + 0.5) / samples
            # Distance from the rounded-rect edge.
            cx = min(max(x, radius), size - radius)
            cy = min(max(y, radius), size - radius)
            if math.hypot(x - cx, y - cy) <= radius:
                hit += 1
    return hit / total


def build(size, maskable=False):
    bolt_scale = 0.62 if maskable else 0.84
    radius = 0.0 if maskable else size * 0.225
    cx = size / 2.0

    # Scale the bolt about the canvas centre.
    poly = []
    for x, y in BOLT:
        poly.append(((x - 0.5) * bolt_scale + 0.5, (y - 0.5) * bolt_scale + 0.5))

    glow_radius = 0.055 * bolt_scale
    rows = []
    for py in range(size):
        row = bytearray()
        v = py / (size - 1)
        for px in range(size):
            u = px / (size - 1)

            base = mix(BG_TOP, BG_BOTTOM, v)

            # Soft radial energy bloom behind the bolt.
            d_centre = math.hypot(u - 0.5, v - 0.5) / 0.70
            bloom = max(0.0, 1.0 - d_centre) ** 2
            base = over(base, mix(CYAN, VIOLET, v), 0.16 * bloom)

            # Faint circuit grid.
            if not maskable:
                gu = (u * 8.0) % 1.0
                gv = (v * 8.0) % 1.0
                if min(gu, 1 - gu) < 0.02 or min(gv, 1 - gv) < 0.02:
                    base = over(base, CYAN, 0.05)

            colour = base

            inside = point_in_poly(u, v, poly)
            d = dist_to_poly(u, v, poly)
            bolt_colour = mix(CYAN, VIOLET, min(1.0, max(0.0, (v - 0.15) / 0.7)))

            if inside:
                # Bright core, slightly hotter towards the top.
                edge = min(1.0, d / (0.02 * bolt_scale))
                core = over(bolt_colour, (255, 255, 255), 0.45 * (1.0 - edge))
                colour = over(colour, core, 1.0)
            else:
                if d < glow_radius:
                    t = 1.0 - d / glow_radius
                    colour = over(colour, bolt_colour, 0.75 * (t ** 2))
                # Anti-alias the bolt silhouette.
                aa = 1.0 - min(1.0, d / (1.4 / size))
                if aa > 0:
                    colour = over(colour, bolt_colour, aa)

            # Inner hairline frame.
            if not maskable:
                inset = size * 0.055
                near_edge = min(px, py, size - 1 - px, size - 1 - py)
                if inset - size * 0.012 < near_edge < inset:
                    corner_cx = min(max(px, radius), size - radius)
                    corner_cy = min(max(py, radius), size - radius)
                    if math.hypot(px - corner_cx, py - corner_cy) <= radius - inset * 0.4:
                        colour = over(colour, CYAN, 0.22)

            alpha = 255
            if radius > 0:
                alpha = int(round(255 * rounded_rect_coverage(px, py, size, radius)))

            row += bytes((int(round(colour[0])), int(round(colour[1])), int(round(colour[2])), alpha))
        rows.append(row)
    return rows


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    targets = [
        ("favicon-32.png", 32, False),
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("apple-touch-icon-180.png", 180, False),
        ("icon-maskable-512.png", 512, True),
    ]
    for name, size, maskable in targets:
        rows = build(size, maskable)
        path = os.path.join(OUT_DIR, name)
        write_png(path, size, size, rows)
        print("wrote", os.path.relpath(path), f"({size}x{size})")


if __name__ == "__main__":
    main()
