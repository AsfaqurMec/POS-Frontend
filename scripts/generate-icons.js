const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
function createCrcTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, getPixelRgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bits per channel
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines
  const rowBytes = width * 4;
  const rawData = Buffer.alloc(height * (1 + rowBytes));

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRgba(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw icon: Amber gradient background + coffee mug
function generatePosIcon(width, height, isMaskable = false) {
  return createPng(width, height, (x, y, w, h) => {
    // Normalised coordinates [0, 1]
    const nx = x / w;
    const ny = y / h;

    // Check corner radius if not maskable
    if (!isMaskable) {
      const radius = 0.22;
      const cornerDx = nx < radius ? radius - nx : nx > 1 - radius ? nx - (1 - radius) : 0;
      const cornerDy = ny < radius ? radius - ny : ny > 1 - radius ? ny - (1 - radius) : 0;
      if (cornerDx > 0 && cornerDy > 0) {
        const dist = Math.sqrt(cornerDx * cornerDx + cornerDy * cornerDy);
        if (dist > radius) {
          return [0, 0, 0, 0]; // Transparent outside rounded corner
        }
      }
    }

    // Gradient background: #b45309 (180, 83, 9) to #78350f (120, 53, 15)
    const t = (nx + ny) / 2;
    const rBg = Math.round(180 + (120 - 180) * t);
    const gBg = Math.round(83 + (53 - 83) * t);
    const bBg = Math.round(9 + (15 - 9) * t);

    // Coffee mug drawing (centered in [0.2, 0.8] range)
    const mugLeft = 0.28;
    const mugRight = 0.60;
    const mugTop = 0.45;
    const mugBottom = 0.72;
    const mugRadius = 0.08;

    // Coffee cup body
    let inMug = false;
    if (nx >= mugLeft && nx <= mugRight && ny >= mugTop && ny <= mugBottom) {
      if (ny > mugBottom - mugRadius) {
        const botDx = nx < mugLeft + mugRadius ? (mugLeft + mugRadius) - nx : nx > mugRight - mugRadius ? nx - (mugRight - mugRadius) : 0;
        const botDy = ny - (mugBottom - mugRadius);
        if (botDx === 0 || Math.hypot(botDx, botDy) <= mugRadius) {
          inMug = true;
        }
      } else {
        inMug = true;
      }
    }

    // Mug handle (on right: from x=0.60 to 0.73, y=0.48 to 0.65)
    let inHandle = false;
    const handleCenterX = 0.60;
    const handleCenterY = 0.56;
    const hDx = (nx - handleCenterX) / 0.13;
    const hDy = (ny - handleCenterY) / 0.09;
    const hDist = Math.hypot(hDx, hDy);
    if (hDist <= 1.0 && hDist >= 0.55 && nx >= handleCenterX) {
      inHandle = true;
    }

    // Steam lines: 3 vertical wavy lines above mug (y from 0.26 to 0.38)
    let inSteam = false;
    if (ny >= 0.26 && ny <= 0.38) {
      const steamY = (ny - 0.26) / 0.12;
      const steamXs = [0.35, 0.44, 0.53];
      for (const sx of steamXs) {
        const waveX = sx + 0.015 * Math.sin(steamY * Math.PI * 2);
        if (Math.abs(nx - waveX) < 0.014) {
          inSteam = true;
          break;
        }
      }
    }

    if (inMug || inHandle || inSteam) {
      return [255, 255, 255, 255]; // Crisp White icon
    }

    return [rBg, gBg, bBg, 255];
  });
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating PWA icons in:', outDir);
fs.writeFileSync(path.join(outDir, 'icon-192x192.png'), generatePosIcon(192, 192, false));
fs.writeFileSync(path.join(outDir, 'icon-512x512.png'), generatePosIcon(512, 512, false));
fs.writeFileSync(path.join(outDir, 'icon-maskable-512x512.png'), generatePosIcon(512, 512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), generatePosIcon(180, 180, false));
console.log('Successfully generated all PWA icons.');
