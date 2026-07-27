/**
 * tools/gen-icons.mjs — generates the PWA icon set.
 *
 * Draws the Gridlock mark procedurally with signed-distance fields and encodes
 * the result as PNG using only Node's built-in zlib, so the repo needs no image
 * tooling and the icons can be regenerated from source at any time.
 *
 * Run: node tools/gen-icons.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../icons');
mkdirSync(OUT, { recursive: true });

// ── PNG encoding ────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** @param {Uint8Array} rgba width*height*4 */
function encodePng(rgba, width, height) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Drawing ─────────────────────────────────────────────────────────────────
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Signed distance to a rounded rectangle centred on the origin. */
function sdRoundRect(px, py, bx, by, r) {
  const qx = Math.abs(px) - bx + r;
  const qy = Math.abs(py) - by + r;
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

const RGB = {
  bg0: [11, 20, 32],
  bg1: [5, 7, 11],
  cyan: [63, 240, 255],
  violet: [192, 123, 255],
  amber: [255, 180, 77],
  white: [255, 255, 255],
};

/**
 * Composites a colour onto the buffer with alpha.
 */
function blend(px, i, color, alpha) {
  if (alpha <= 0) return;
  const a = clamp01(alpha);
  px[i] = px[i] * (1 - a) + color[0] * a;
  px[i + 1] = px[i + 1] * (1 - a) + color[1] * a;
  px[i + 2] = px[i + 2] * (1 - a) + color[2] * a;
  px[i + 3] = Math.max(px[i + 3], Math.round(a * 255));
}

/**
 * @param {number} size square icon size in pixels
 * @param {number} inset fraction of the canvas left as padding (maskable icons
 *   need ~20% so the platform can crop to a circle without clipping the mark)
 */
function drawIcon(size, inset) {
  const px = new Float64Array(size * size * 4);
  const half = size / 2;
  const scale = size * (0.5 - inset); // half-extent of the artwork

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const cx = x + 0.5 - half;
      const cy = y + 0.5 - half;

      // Background: a soft radial core fading to near-black.
      const rad = Math.hypot(cx, cy) / half;
      const t = clamp01(rad);
      px[i] = RGB.bg0[0] * (1 - t) + RGB.bg1[0] * t;
      px[i + 1] = RGB.bg0[1] * (1 - t) + RGB.bg1[1] * t;
      px[i + 2] = RGB.bg0[2] * (1 - t) + RGB.bg1[2] * t;
      px[i + 3] = 255;

      const aa = size * 0.006; // antialias width

      // Outer grid frame.
      const d1 = Math.abs(sdRoundRect(cx, cy, scale, scale, scale * 0.28));
      blend(px, i, RGB.cyan, (1 - smoothstep(scale * 0.055, scale * 0.055 + aa, d1)) * 0.95);
      // Outer glow.
      blend(px, i, RGB.cyan, Math.max(0, 1 - d1 / (scale * 0.34)) * 0.14);

      // Inner frame, rotated in feel by using a tighter radius and violet ink.
      const d2 = Math.abs(sdRoundRect(cx, cy, scale * 0.58, scale * 0.58, scale * 0.16));
      blend(px, i, RGB.violet, (1 - smoothstep(scale * 0.04, scale * 0.04 + aa, d2)) * 0.9);

      // The Grid Shift gap: erase a slice of the inner frame so the mark reads
      // as a maze with a route through it rather than as a plain target.
      if (cy < -scale * 0.42 && Math.abs(cx) < scale * 0.2) {
        const fade = 1 - smoothstep(scale * 0.14, scale * 0.2, Math.abs(cx));
        const rad2 = Math.hypot(cx, cy) / half;
        const bgR = RGB.bg0[0] * (1 - rad2) + RGB.bg1[0] * rad2;
        const bgG = RGB.bg0[1] * (1 - rad2) + RGB.bg1[1] * rad2;
        const bgB = RGB.bg0[2] * (1 - rad2) + RGB.bg1[2] * rad2;
        px[i] = px[i] * (1 - fade) + bgR * fade;
        px[i + 1] = px[i + 1] * (1 - fade) + bgG * fade;
        px[i + 2] = px[i + 2] * (1 - fade) + bgB * fade;
      }

      // Energy core.
      const dc = Math.hypot(cx, cy);
      blend(px, i, RGB.cyan, Math.max(0, 1 - dc / (scale * 0.5)) * 0.3);
      blend(px, i, RGB.white, 1 - smoothstep(scale * 0.15, scale * 0.15 + aa * 2, dc));

      // Four energy nodes on the diagonals.
      for (const [nx, ny, col] of [
        [-0.78, -0.78, RGB.amber],
        [0.78, -0.78, RGB.cyan],
        [-0.78, 0.78, RGB.cyan],
        [0.78, 0.78, RGB.amber],
      ]) {
        const dd = Math.hypot(cx - nx * scale, cy - ny * scale);
        blend(px, i, col, 1 - smoothstep(scale * 0.06, scale * 0.06 + aa * 2, dd));
        blend(px, i, col, Math.max(0, 1 - dd / (scale * 0.2)) * 0.25);
      }
    }
  }

  const out = new Uint8Array(size * size * 4);
  for (let k = 0; k < out.length; k++) out[k] = Math.round(clamp01(px[k] / 255) * 255);
  return encodePng(out, size, size);
}

const jobs = [
  ['icon-192.png', 192, 0.1],
  ['icon-512.png', 512, 0.1],
  ['icon-maskable-512.png', 512, 0.21],
  ['apple-touch-icon.png', 180, 0.1],
];

for (const [name, size, inset] of jobs) {
  const png = drawIcon(size, inset);
  writeFileSync(resolve(OUT, name), png);
  console.log(`  ${name.padEnd(24)} ${size}×${size}  ${(png.length / 1024).toFixed(1)} KB`);
}

// A crisp vector favicon for desktop tabs.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#05070b"/>
  <rect x="10" y="10" width="44" height="44" rx="13" fill="none" stroke="#3ff0ff" stroke-width="4"/>
  <path d="M26 10h12" stroke="#05070b" stroke-width="6"/>
  <rect x="21" y="21" width="22" height="22" rx="7" fill="none" stroke="#c07bff" stroke-width="3"/>
  <circle cx="32" cy="32" r="5" fill="#ffffff"/>
  <circle cx="16" cy="16" r="2.6" fill="#ffb44d"/>
  <circle cx="48" cy="48" r="2.6" fill="#ffb44d"/>
</svg>
`;
writeFileSync(resolve(OUT, 'favicon.svg'), favicon, 'utf8');
console.log('  favicon.svg');
