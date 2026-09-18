// One-shot brand asset generator — pure Node (zlib), no image deps.
// Draws the Caleb's Library mark: an open book whose pages curve into a
// "C", in ink (#1c1917) on paper (#f7f4ec). Emits every PNG app.json needs:
// icon 1024, android foreground 1024 (66% safe zone), monochrome 1024,
// splash 1284, adaptive background 1024, favicon 48.
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const PAPER = [247, 244, 236]; // #f7f4ec
const INK = [28, 25, 23]; // #1c1917

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

// RGBA raster → PNG (alpha as coverage).
function encodePNG(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function makeCanvas(w, h, bg) {
  const buf = Buffer.alloc(w * h * 4);
  if (bg) {
    for (let i = 0; i < w * h; i++) {
      buf[i * 4] = bg[0];
      buf[i * 4 + 1] = bg[1];
      buf[i * 4 + 2] = bg[2];
      buf[i * 4 + 3] = 255;
    }
  }
  return { w, h, buf };
}

// Supersampled coverage: 4×4 jittered samples per pixel.
// sample(x, y) receives DESIGN-space coordinates (0..100).
function stamp(canvas, sample, scale, ox, oy) {
  const SS = 4;
  for (let py = 0; py < canvas.h; py++) {
    for (let px = 0; px < canvas.w; px++) {
      let hit = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          // Device pixel → design space: d = (device − origin) / scale.
          const x = (px + (sx + 0.5) / SS - ox) / scale;
          const y = (py + (sy + 0.5) / SS - oy) / scale;
          if (sample(x, y)) hit++;
        }
      }
      if (!hit) continue;
      const a = hit / (SS * SS);
      const i = (py * canvas.w + px) * 4;
      // Source-over: ink over whatever is on the tile (opaque paper or
      // transparency), and always write the resulting alpha.
      canvas.buf[i] = Math.round(INK[0] * a + canvas.buf[i] * (1 - a));
      canvas.buf[i + 1] = Math.round(INK[1] * a + canvas.buf[i + 1] * (1 - a));
      canvas.buf[i + 2] = Math.round(INK[2] * a + canvas.buf[i + 2] * (1 - a));
      canvas.buf[i + 3] = Math.round(255 * Math.min(1, a + canvas.buf[i + 3] / 255));
    }
  }
}

// Variant: fill pass first (opaque tile), then stamp ink on top.
function renderOpaque(size, inset) {
  const canvas = makeCanvas(size, size, PAPER);
  const content = size * (1 - inset * 2);
  const scale = content / DESIGN;
  stamp(canvas, markSample, scale, inset * size, inset * size);
  return encodePNG(canvas.w, canvas.h, canvas.buf);
}

const DESIGN = 100;
// - a left/right book-cover wedge pair (the "open book")
// - page ribs sweeping between them (the pages)
// - a C-shaped counterweight arc forming the "C" on the right
function markSample(x, y) {
  // Book: two slanted cover wedges, apex at (50, 78), tops splayed.
  const inWedge = (x0, x1, topY, slant) => {
    // slant: left edge moves outward as we rise
    const t = Math.max(0, Math.min(1, (topY - y) / (topY - 78)));
    const l = x0 - slant * t;
    const r = x1 + slant * t;
    return y >= topY && y <= 78 && x >= l && x <= r;
  };
  if (inWedge(24, 47, 30, 8)) return true; // left cover
  if (inWedge(53, 76, 30, 8)) return true; // right cover
  // Spine/base bar
  if (y >= 74 && y <= 78 && x >= 22 && x <= 78) return true;
  // Page ribs: three arcs fanning from the spine
  for (let i = 0; i < 3; i++) {
    const yy = 40 + i * 11; // rib center rows
    const dx = Math.abs(x - 50);
    const rib = Math.sin((dx / 26) * Math.PI) * 9;
    if (Math.abs(y - (yy - rib)) <= 2.1 && x >= 28 && x <= 72) return true;
  }
  // The C: open ring around (50,54), radius 40..48, gap facing right (−35°..35°)
  const dx = x - 50;
  const dy = y - 54;
  const r = Math.hypot(dx, dy);
  if (r >= 40 && r <= 48) {
    const ang = Math.atan2(dy, dx); // -π..π, 0 = right
    const a = Math.abs(ang);
    if (a >= 0.62) return true;
  }
  return false;
}

function render(size, opts) {
  const { bg = PAPER, inset = 0 } = opts || {};
  const canvas = makeCanvas(size, size, bg);
  // Content box: mark occupies (inset..1-inset) of the tile.
  const content = size * (1 - inset * 2);
  const scale = content / DESIGN;
  const ox = inset * size;
  const oy = inset * size;
  stamp(canvas, markSample, scale, ox, oy);
  return encodePNG(canvas.w, canvas.h, canvas.buf);
}

// Splash is not square: 1284×1284-ish phone + tablet handled by Expo's
// contain-mode scaling from a single square 1284 source. Keep square.
const outDir = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { file: 'icon.png', size: 1024, bg: PAPER, inset: 0.12 },
  { file: 'android-icon-foreground.png', size: 1024, bg: null, inset: 0.22 },
  { file: 'android-icon-monochrome.png', size: 1024, bg: null, inset: 0.22 },
  { file: 'splash-icon.png', size: 1284, bg: null, inset: 0.06 },
  { file: 'favicon.png', size: 48, bg: null, inset: 0.1 },
];

for (const t of targets) {
  const png = t.bg
    ? renderOpaque(t.size, t.inset) // ink over opaque paper (launcher icon)
    : render(t.size, { bg: t.bg, inset: t.inset }); // ink w/ transparency
  fs.writeFileSync(path.join(outDir, t.file), png);
  process.stdout.write(`${t.file}: ${(png.length / 1024).toFixed(0)} KB\n`);
}

// Adaptive background: flat paper tile (no mark).
const bgCanvas = makeCanvas(1024, 1024, PAPER);
fs.writeFileSync(path.join(outDir, 'android-icon-background.png'), encodePNG(1024, 1024, bgCanvas.buf));
process.stdout.write('android-icon-background.png: flat #f7f4ec\n');
process.stdout.write('Done.\n');
