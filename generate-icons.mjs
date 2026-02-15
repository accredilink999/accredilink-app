import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

const publicDir = join(import.meta.dirname, 'public');
const logoPath = join(publicDir, 'logo.png');

// Generate PWA icons from the actual logo.png
const sizes = [
  { name: 'pwa-64x64.png', size: 64 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
];

for (const { name, size } of sizes) {
  const buf = await sharp(logoPath)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();
  writeFileSync(join(publicDir, name), buf);
  console.log(`Created ${name} (${size}x${size})`);
}

// Maskable icon needs safe zone padding (10% on each side)
const maskableSize = 512;
const innerSize = Math.round(maskableSize * 0.8);
const maskableBuf = await sharp(logoPath)
  .resize(innerSize, innerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .extend({
    top: Math.round((maskableSize - innerSize) / 2),
    bottom: Math.round((maskableSize - innerSize) / 2),
    left: Math.round((maskableSize - innerSize) / 2),
    right: Math.round((maskableSize - innerSize) / 2),
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .png()
  .toBuffer();
writeFileSync(join(publicDir, 'maskable-icon-512x512.png'), maskableBuf);
console.log(`Created maskable-icon-512x512.png (${maskableSize}x${maskableSize} maskable)`);

// favicon.ico (32x32 and 16x16)
const ico32 = await sharp(logoPath)
  .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toBuffer();
const ico16 = await sharp(logoPath)
  .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toBuffer();

// favicon.svg — just use a small PNG reference since we have the real logo
const faviconPng = await sharp(logoPath)
  .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toBuffer();
writeFileSync(join(publicDir, 'favicon.png'), faviconPng);
console.log('Created favicon.png');

// Simple ICO file: header + directory entries + image data
function createIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let dataOffset = 6 + (images.length * 16);
  const entries = [];
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    entries.push(entry);
    dataOffset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map(i => i.data)]);
}

const icoBuffer = createIco([
  { size: 16, data: ico16 },
  { size: 32, data: ico32 },
]);
writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer);
console.log('Created favicon.ico');

console.log('\nAll icons generated from logo.png successfully!');
