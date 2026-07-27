/**
 * generate-icons.mjs — Renders the app icons as real PNG files.
 *
 * The project has no image dependencies and no build step, so the icons are
 * rasterised here by hand: draw into an RGBA buffer, then wrap it in a
 * minimal PNG container (IHDR / IDAT / IEND with zlib deflate and CRC32).
 * That keeps the repository free of binary assets that nobody can diff, and
 * regenerating the whole icon set is one command.
 *
 * Run with:  npm run icons
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');

// --- Minimal PNG encoder ----------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // Each scanline is prefixed with its filter byte (0 = none).
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Tiny software rasteriser ----------------------------------------------

class Canvas {
  constructor(size) {
    this.size = size;
    this.data = Buffer.alloc(size * size * 4);
  }

  blend(x, y, r, g, b, a) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size || a <= 0) return;
    const i = (y * this.size + x) * 4;
    const src = Math.min(1, a);
    const dstA = this.data[i + 3] / 255;
    const outA = src + dstA * (1 - src);
    if (outA <= 0) return;
    for (let c = 0; c < 3; c++) {
      const dst = this.data[i + c];
      const val = [r, g, b][c];
      this.data[i + c] = Math.round((val * src + dst * dstA * (1 - src)) / outA);
    }
    this.data[i + 3] = Math.round(outA * 255);
  }

  /** Fill using a signed-distance function; negative is inside. 2x2 sampled. */
  fillSDF(sdf, colorAt) {
    const s = this.size;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        let coverage = 0;
        for (let sy = 0; sy < 2; sy++) {
          for (let sx = 0; sx < 2; sx++) {
            const px = x + 0.25 + sx * 0.5;
            const py = y + 0.25 + sy * 0.5;
            if (sdf(px / s, py / s) <= 0) coverage += 0.25;
          }
        }
        if (coverage <= 0) continue;
        const [r, g, b, a] = colorAt(x / s, y / s);
        this.blend(x, y, r, g, b, a * coverage);
      }
    }
  }
}

const lerp = (a, b, t) => a + (b - a) * t;
const mixColor = (c1, c2, t) => [
  Math.round(lerp(c1[0], c2[0], t)),
  Math.round(lerp(c1[1], c2[1], t)),
  Math.round(lerp(c1[2], c2[2], t)),
];

const CYAN = [62, 242, 240];
const VIOLET = [176, 108, 255];
const BG = [5, 7, 13];
const PANEL = [10, 16, 32];

/** Diamond signed distance in normalised space, centred on (cx, cy). */
const diamond = (cx, cy, r) => (x, y) => Math.abs(x - cx) + Math.abs(y - cy) - r;

function drawIcon(size, { maskable = false } = {}) {
  const canvas = new Canvas(size);
  // Maskable icons must survive an aggressive circular crop, so the artwork
  // is scaled into the guaranteed-safe centre and the background is bled to
  // every edge.
  const scale = maskable ? 0.62 : 0.84;

  // Background
  canvas.fillSDF(() => -1, (x, y) => {
    const t = (x + y) / 2;
    const c = mixColor(BG, PANEL, t);
    return [c[0], c[1], c[2], 1];
  });

  // Corner rounding only for the non-maskable icon.
  if (!maskable) {
    const r = 0.18;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const ny = y / size;
        const dx = Math.max(r - nx, 0, nx - (1 - r));
        const dy = Math.max(r - ny, 0, ny - (1 - r));
        if (Math.hypot(dx, dy) > r) {
          const i = (y * size + x) * 4;
          canvas.data[i + 3] = 0;
        }
      }
    }
  }

  // Faint lane bars behind the mark — reads as "network" at large sizes and
  // disappears cleanly at 32px.
  const laneCount = 5;
  for (let i = 0; i < laneCount; i++) {
    const y0 = 0.5 - (scale * 0.5) + (i + 0.5) * ((scale * 1.0) / laneCount);
    const half = (scale * 0.04);
    canvas.fillSDF(
      (x, y) => Math.max(Math.abs(y - y0) - half, Math.abs(x - 0.5) - scale * 0.44),
      () => [90, 130, 190, 0.16],
    );
  }

  // Outer diamond ring
  const outer = scale * 0.42;
  const inner = scale * 0.32;
  canvas.fillSDF(
    (x, y) => Math.max(diamond(0.5, 0.5, outer)(x, y), -diamond(0.5, 0.5, inner)(x, y)),
    (x) => {
      const c = mixColor(CYAN, VIOLET, Math.min(1, Math.max(0, (x - 0.25) / 0.5)));
      return [c[0], c[1], c[2], 1];
    },
  );

  // Core diamond
  canvas.fillSDF(diamond(0.5, 0.5, scale * 0.22), (x, y) => {
    const t = Math.min(1, Math.hypot(x - 0.5, y - 0.5) / (scale * 0.22));
    const c = mixColor([242, 247, 255], CYAN, t);
    return [c[0], c[1], c[2], 1];
  });

  return encodePNG(size, size, canvas.data);
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, {}],
  ['favicon.png', 32, {}],
];

for (const [name, size, opts] of targets) {
  const png = drawIcon(size, opts);
  writeFileSync(join(OUT_DIR, name), png);
  console.log(`  wrote icons/${name} (${size}x${size}, ${(png.length / 1024).toFixed(1)} kB)`);
}

console.log('\nIcons generated.');
