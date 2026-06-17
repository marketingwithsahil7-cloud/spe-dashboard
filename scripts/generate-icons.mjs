// Generates public/icons/icon-192.png, icon-512.png, apple-touch-icon.png
// No external dependencies — uses only Node.js built-ins (zlib, fs, Buffer)
import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';

// CRC32 for PNG chunks
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

// Soccer ball icon: dark bg + green circle + classic pentagon pattern
function generateIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2, cy = size / 2;
  const ballR = size * 0.40;
  const bg  = [10, 10, 15];       // #0A0A0F
  const grn = [0, 255, 135];      // #00FF87
  const drk = [0, 60, 35];        // dark green — pentagon patches

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx, dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);

      let [r, g, b] = bg;
      let a = 255;

      if (d <= ballR + 0.5) {
        // Green ball fill
        const blend = Math.max(0, Math.min(1, ballR + 0.5 - d)); // anti-alias edge
        [r, g, b] = [
          Math.round(bg[0] + (grn[0] - bg[0]) * blend),
          Math.round(bg[1] + (grn[1] - bg[1]) * blend),
          Math.round(bg[2] + (grn[2] - bg[2]) * blend),
        ];

        if (d <= ballR) {
          [r, g, b] = [...grn];

          // Central pentagon (circle approx)
          if (d <= ballR * 0.22) {
            [r, g, b] = [...drk];
          }

          // 5 surrounding pentagons at 72° intervals
          const pR = ballR * 0.20;
          const pDist = ballR * 0.54;
          for (let p = 0; p < 5; p++) {
            const angle = (p * Math.PI * 2) / 5 - Math.PI / 2;
            const px = cx + pDist * Math.cos(angle);
            const py = cy + pDist * Math.sin(angle);
            const ddx = x - px, ddy = y - py;
            if (Math.sqrt(ddx * ddx + ddy * ddy) <= pR) {
              [r, g, b] = [...drk];
            }
          }

          // Subtle top-left highlight
          const hl = 1 + 0.15 * Math.max(0, (-dx - dy) / (ballR * 1.5));
          r = Math.min(255, Math.round(r * hl));
          g = Math.min(255, Math.round(g * hl));
          b = Math.min(255, Math.round(b * hl));
        }
      }

      pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = a;
    }
  }

  // Build scanlines — filter byte 0 (None) per row
  const scanlines = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowOffset = y * (size * 4 + 1);
    scanlines[rowOffset] = 0;
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = rowOffset + 1 + x * 4;
      scanlines[dst]     = pixels[src];
      scanlines[dst + 1] = pixels[src + 1];
      scanlines[dst + 2] = pixels[src + 2];
      scanlines[dst + 3] = pixels[src + 3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', generateIcon(192));
writeFileSync('public/icons/icon-512.png', generateIcon(512));
writeFileSync('public/icons/apple-touch-icon.png', generateIcon(180));
console.log('✓ Icons generated: icon-192.png, icon-512.png, apple-touch-icon.png');
