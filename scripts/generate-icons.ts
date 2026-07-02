// Deterministic PWA icon generation (PWA-001, BLD-004): draws a stopwatch
// glyph with signed-distance functions and encodes PNGs from scratch, so no
// binary assets live in the repository and builds are reproducible.

import { deflateSync } from "node:zlib";

// ---------- PNG encoding ----------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const b of bytes) crc = (CRC_TABLE[(crc ^ b) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  const typed = new Uint8Array(4 + data.length);
  typed.set([...type].map((c) => c.charCodeAt(0)));
  typed.set(data, 4);
  out.set(typed, 4);
  view.setUint32(8 + data.length, crc32(typed));
  return out;
}

/** Encode an RGBA buffer as a PNG file. */
export function encodePng(rgba: Uint8Array, width: number, height: number): Uint8Array {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA, no interlace

  // Raw scanlines, each prefixed with filter type 0 (None).
  const raw = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (1 + width * 4) + 1);
  }
  const idat = new Uint8Array(deflateSync(raw, { level: 9 }));

  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", new Uint8Array(0))];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const png = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    png.set(p, offset);
    offset += p.length;
  }
  return png;
}

// ---------- Glyph drawing (signed distance fields, antialiased) ----------

type Rgb = readonly [number, number, number];

const BG: Rgb = [11, 11, 16];
const RING: Rgb = [245, 245, 247];
const HAND: Rgb = [47, 111, 237];

function sdRoundedRect(x: number, y: number, cx: number, cy: number, w: number, h: number, r: number): number {
  const dx = Math.abs(x - cx) - (w / 2 - r);
  const dy = Math.abs(y - cy) - (h / 2 - r);
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - r;
}

function sdSegment(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax;
  const aby = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * abx + (y - ay) * aby) / (abx * abx + aby * aby)));
  return Math.hypot(x - (ax + t * abx), y - (ay + t * aby));
}

/** Distance → antialiased coverage (d <= 0 is inside). */
const coverage = (d: number) => Math.max(0, Math.min(1, 0.5 - d));

function blend(px: Float64Array, i: number, color: Rgb, alpha: number): void {
  if (alpha <= 0) return;
  const [r, g, b] = color;
  px[i] = r * alpha + (px[i] ?? 0) * (1 - alpha);
  px[i + 1] = g * alpha + (px[i + 1] ?? 0) * (1 - alpha);
  px[i + 2] = b * alpha + (px[i + 2] ?? 0) * (1 - alpha);
  px[i + 3] = Math.min(1, alpha + (px[i + 3] ?? 0) * (1 - alpha));
}

/** Draw the GiantChrono stopwatch icon; maskable variants fill the square. */
export function drawIcon(size: number, maskable: boolean): Uint8Array {
  const px = new Float64Array(size * size * 4); // premultiplied-free float RGBA (alpha 0..1)
  const s = size;
  const glyphScale = maskable ? 0.72 : 1; // keep the glyph inside the maskable safe zone
  const cx = s / 2;
  const cy = s * 0.54;
  const R = s * 0.3 * glyphScale;
  const ringHalf = s * 0.042 * glyphScale;
  const cornerRadius = maskable ? 0 : s * 0.22;

  // Stopwatch hand pointing to "10 minutes past".
  const angle = -Math.PI / 3;
  const hx = cx + Math.cos(angle) * R * 0.62;
  const hy = cy + Math.sin(angle) * R * 0.62;

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const fx = x + 0.5;
      const fy = y + 0.5;

      blend(px, i, BG, coverage(sdRoundedRect(fx, fy, s / 2, s / 2, s, s, cornerRadius)));

      // Crown stem and knob above the ring.
      const stemTop = cy - R - s * 0.1 * glyphScale;
      blend(px, i, RING, coverage(sdRoundedRect(fx, fy, cx, cy - R - s * 0.045 * glyphScale, s * 0.05 * glyphScale, s * 0.1 * glyphScale, s * 0.01)));
      blend(px, i, RING, coverage(sdRoundedRect(fx, fy, cx, stemTop, s * 0.14 * glyphScale, s * 0.05 * glyphScale, s * 0.02)));

      // Watch ring.
      blend(px, i, RING, coverage(Math.abs(Math.hypot(fx - cx, fy - cy) - R) - ringHalf));

      // Hand + center hub.
      blend(px, i, HAND, coverage(sdSegment(fx, fy, cx, cy, hx, hy) - s * 0.028 * glyphScale));
      blend(px, i, HAND, coverage(Math.hypot(fx - cx, fy - cy) - s * 0.045 * glyphScale));
    }
  }

  const rgba = new Uint8Array(s * s * 4);
  for (let i = 0; i < px.length; i += 4) {
    rgba[i] = Math.round(px[i] ?? 0);
    rgba[i + 1] = Math.round(px[i + 1] ?? 0);
    rgba[i + 2] = Math.round(px[i + 2] ?? 0);
    rgba[i + 3] = Math.round((px[i + 3] ?? 0) * 255);
  }
  return rgba;
}

export interface IconSpec {
  name: string;
  size: number;
  maskable: boolean;
}

export const ICONS: IconSpec[] = [
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
];

export async function generateIcons(outDir: string): Promise<void> {
  for (const spec of ICONS) {
    const png = encodePng(drawIcon(spec.size, spec.maskable), spec.size, spec.size);
    await Bun.write(`${outDir}/${spec.name}`, png);
  }
}
