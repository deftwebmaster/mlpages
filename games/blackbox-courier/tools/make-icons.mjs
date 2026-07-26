/**
 * Procedurally generates every PNG the app ships (icons + social card).
 *
 *   node tools/make-icons.mjs
 *
 * Written by hand rather than pulled from a library so the repo has no build
 * dependencies at all. Pixels are evaluated analytically, which gives clean
 * antialiasing without a rasteriser.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'icons');

/* ----------------------------- PNG encoding ----------------------------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------- Drawing -------------------------------- */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Signed distance to a line segment. */
function sdSegment(px, py, ax, ay, bx, by) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = clamp01((pax * bax + pay * bay) / (bax * bax + bay * bay));
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  return Math.hypot(dx, dy);
}

/** Signed distance to a triangle (negative inside). */
function sdTriangle(px, py, p0, p1, p2) {
  const e = [
    [p1[0] - p0[0], p1[1] - p0[1]],
    [p2[0] - p1[0], p2[1] - p1[1]],
    [p0[0] - p2[0], p0[1] - p2[1]],
  ];
  const v = [
    [px - p0[0], py - p0[1]],
    [px - p1[0], py - p1[1]],
    [px - p2[0], py - p2[1]],
  ];
  let d = Infinity;
  let s = 1;
  for (let i = 0; i < 3; i++) {
    const h = clamp01((v[i][0] * e[i][0] + v[i][1] * e[i][1]) / (e[i][0] ** 2 + e[i][1] ** 2));
    const qx = v[i][0] - e[i][0] * h;
    const qy = v[i][1] - e[i][1] * h;
    d = Math.min(d, qx * qx + qy * qy);
    const c = [py >= p0[1], py < p1[1], e[i][0] * v[i][1] - e[i][1] * v[i][0] > 0];
    void c;
  }
  // Winding sign via barycentric orientation.
  const sign =
    (p1[0] - p0[0]) * (py - p0[1]) - (p1[1] - p0[1]) * (px - p0[0]) > 0 &&
    (p2[0] - p1[0]) * (py - p1[1]) - (p2[1] - p1[1]) * (px - p1[0]) > 0 &&
    (p0[0] - p2[0]) * (py - p2[1]) - (p0[1] - p2[1]) * (px - p2[0]) > 0
      ? -1
      : 1;
  s = sign;
  return s * Math.sqrt(d);
}

/**
 * The shared artwork, evaluated in normalised space where the design occupies
 * [-1, 1] on both axes. `inset` shrinks the composition for maskable icons.
 */
function shade(u, v, opts) {
  const { inset = 1, aa } = opts;
  const x = u / inset;
  const y = v / inset;

  // Background: deep radial field.
  const r = Math.hypot(x, y * 0.9);
  let cr = mix(0.051, 0.016, clamp01(r * 0.85));
  let cg = mix(0.090, 0.024, clamp01(r * 0.85));
  let cb = mix(0.188, 0.055, clamp01(r * 0.85));

  const add = (rr, gg, bb, a) => {
    if (a <= 0) return;
    const k = clamp01(a);
    cr = cr + rr * k;
    cg = cg + gg * k;
    cb = cb + bb * k;
  };

  // Perspective tunnel: nested trapezoid outlines converging on the horizon.
  const horizonY = -0.42;
  for (let i = 0; i < 6; i++) {
    const t = 0.16 + i * 0.16;               // 0 = far, 1 = near
    const w = 0.10 + Math.pow(t, 1.55) * 0.95;
    const yy = mix(horizonY, 0.92, Math.pow(t, 1.35));
    const d = Math.min(
      sdSegment(x, y, -w, yy, w, yy),
      Math.min(sdSegment(x, y, -w, yy, -w * 0.86, yy - 0.06 * t),
               sdSegment(x, y, w, yy, w * 0.86, yy - 0.06 * t))
    );
    const line = 1 - smooth(0.006, 0.006 + aa * 2.2, d);
    add(0.10, 0.62, 0.72, line * (0.25 + t * 0.6));
  }

  // Converging side rails.
  for (const s of [-1, 1]) {
    const d = sdSegment(x, y, s * 0.10, horizonY, s * 1.12, 1.02);
    const line = 1 - smooth(0.008, 0.008 + aa * 2.4, d);
    add(0.16, 0.72, 0.82, line * 0.85);
  }

  // Horizon bloom.
  const hb = Math.exp(-(Math.hypot(x * 1.1, (y - horizonY) * 2.2) ** 2) * 7);
  add(0.10, 0.45, 0.55, hb * 0.75);

  // Craft.
  const p0 = [0, 0.02];
  const p1 = [0.34, 0.62];
  const p2 = [-0.34, 0.62];
  const dt = sdTriangle(x, y, p0, p1, p2);
  const body = 1 - smooth(0, aa * 2, dt);
  const edge = 1 - smooth(0.028, 0.028 + aa * 2.4, Math.abs(dt));
  // Dark hull, then a bright cyan rim.
  cr = mix(cr, 0.035, body * 0.9);
  cg = mix(cg, 0.086, body * 0.9);
  cb = mix(cb, 0.157, body * 0.9);
  add(0.25, 0.95, 1.0, edge * 1.15);

  // Violet payload core.
  const core = Math.exp(-(Math.hypot(x, (y - 0.36) * 1.05) ** 2) * 95);
  add(0.66, 0.47, 1.0, core * 1.5);
  const spark = Math.exp(-(Math.hypot(x, (y - 0.36) * 1.05) ** 2) * 700);
  add(1, 1, 1, spark * 1.2);

  // Engine glow beneath.
  const gl = Math.exp(-(Math.hypot(x * 1.8, (y - 0.72) * 2.6) ** 2) * 26);
  add(0.24, 0.9, 1.0, gl * 0.7);

  // Vignette.
  const vig = 1 - smooth(0.72, 1.5, r);
  cr *= mix(0.42, 1, vig);
  cg *= mix(0.42, 1, vig);
  cb *= mix(0.42, 1, vig);

  return [cr, cg, cb];
}

function renderIcon(size, opts = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const aa = 2 / size;
  const inset = opts.inset ?? 1;
  const rounded = opts.rounded ?? 0;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const u = (px + 0.5) / size * 2 - 1;
      const v = (py + 0.5) / size * 2 - 1;
      const [r, g, b] = shade(u, v, { inset, aa });
      let a = 1;
      if (rounded > 0) {
        // Rounded-square mask for the Apple touch icon.
        const q = Math.max(Math.abs(u), Math.abs(v));
        void q;
        const dx = Math.max(Math.abs(u) - (1 - rounded), 0);
        const dy = Math.max(Math.abs(v) - (1 - rounded), 0);
        const d = Math.hypot(dx, dy) - rounded;
        a = 1 - smooth(0, aa * 2, d);
      }
      const i = (py * size + px) * 4;
      buf[i] = Math.round(clamp01(r) * 255);
      buf[i + 1] = Math.round(clamp01(g) * 255);
      buf[i + 2] = Math.round(clamp01(b) * 255);
      buf[i + 3] = Math.round(clamp01(a) * 255);
    }
  }
  return encodePng(size, size, buf);
}

/** Wide social preview: the same tunnel with a title block. */
function renderSocial(w, h) {
  const buf = Buffer.alloc(w * h * 4);
  const aa = 2 / h;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const u = ((px + 0.5) / w * 2 - 1) * (w / h) * 0.55;
      const v = (py + 0.5) / h * 2 - 1;
      const [r, g, b] = shade(u, v, { inset: 1.05, aa });
      // Darken the lower band so overlaid text reads well.
      const band = smooth(0.45, 0.62, v) * 0.55;
      const i = (py * w + px) * 4;
      buf[i] = Math.round(clamp01(r * (1 - band)) * 255);
      buf[i + 1] = Math.round(clamp01(g * (1 - band)) * 255);
      buf[i + 2] = Math.round(clamp01(b * (1 - band)) * 255);
      buf[i + 3] = 255;
    }
  }
  return encodePng(w, h, buf);
}

/* -------------------------------- Main ---------------------------------- */

mkdirSync(OUT, { recursive: true });

const jobs = [
  ['icon-192.png', () => renderIcon(192)],
  ['icon-512.png', () => renderIcon(512)],
  // Maskable icons must survive a circular crop: keep art inside the safe zone.
  ['maskable-512.png', () => renderIcon(512, { inset: 0.62 })],
  ['apple-touch-icon.png', () => renderIcon(180, { rounded: 0.0 })],
  ['social.png', () => renderSocial(1200, 630)],
];

for (const [name, make] of jobs) {
  const png = make();
  writeFileSync(join(OUT, name), png);
  process.stdout.write(`${name} — ${(png.length / 1024).toFixed(1)} KB\n`);
}
