import sharp from 'sharp';
import { mkdirSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO = join(__dirname, 'public', 'logo.png');
const RES = join(__dirname, 'android', 'app', 'src', 'main', 'res');

// Android icon sizes per density
const ICON_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Splash screen sizes (width x height)
const SPLASH_PORT = {
  'drawable-port-mdpi': [320, 480],
  'drawable-port-hdpi': [480, 800],
  'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600],
  'drawable-port-xxxhdpi': [1280, 1920],
};

const SPLASH_LAND = {
  'drawable-land-mdpi': [480, 320],
  'drawable-land-hdpi': [800, 480],
  'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960],
  'drawable-land-xxxhdpi': [1920, 1280],
};

async function generateIcons() {
  console.log('Generating app icons...');

  // Load logo metadata
  const meta = await sharp(LOGO).metadata();

  // Create a square canvas with the logo centered, white background
  const squareSize = Math.max(meta.width, meta.height);

  // Create padded square version of logo with white bg
  const squareLogo = await sharp(LOGO)
    .resize(Math.round(squareSize * 0.7), null, { fit: 'inside' })
    .extend({
      top: 0, bottom: 0, left: 0, right: 0,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .toBuffer();

  const paddedMeta = await sharp(squareLogo).metadata();

  // Make it truly square with padding
  const maxDim = Math.max(paddedMeta.width, paddedMeta.height);
  const padTop = Math.floor((maxDim - paddedMeta.height) / 2);
  const padBottom = maxDim - paddedMeta.height - padTop;
  const padLeft = Math.floor((maxDim - paddedMeta.width) / 2);
  const padRight = maxDim - paddedMeta.width - padLeft;

  const squareBuffer = await sharp(squareLogo)
    .extend({
      top: Math.max(0, padTop) + Math.round(maxDim * 0.15),
      bottom: Math.max(0, padBottom) + Math.round(maxDim * 0.15),
      left: Math.max(0, padLeft) + Math.round(maxDim * 0.15),
      right: Math.max(0, padRight) + Math.round(maxDim * 0.15),
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toBuffer();

  for (const [folder, size] of Object.entries(ICON_SIZES)) {
    const dir = join(RES, folder);
    mkdirSync(dir, { recursive: true });

    // Standard icon
    await sharp(squareBuffer)
      .resize(size, size)
      .png()
      .toFile(join(dir, 'ic_launcher.png'));

    // Foreground icon (for adaptive icons)
    await sharp(squareBuffer)
      .resize(size, size)
      .png()
      .toFile(join(dir, 'ic_launcher_foreground.png'));

    // Round icon
    const roundSize = size;
    const roundMask = Buffer.from(
      `<svg width="${roundSize}" height="${roundSize}">
        <circle cx="${roundSize/2}" cy="${roundSize/2}" r="${roundSize/2}" fill="white"/>
      </svg>`
    );

    await sharp(squareBuffer)
      .resize(roundSize, roundSize)
      .composite([{ input: roundMask, blend: 'dest-in' }])
      .png()
      .toFile(join(dir, 'ic_launcher_round.png'));

    console.log(`  ${folder}: ${size}x${size} - done`);
  }
}

async function generateSplash() {
  console.log('Generating splash screens...');

  // For splash: white background with centered logo (smaller, ~40% of width)
  const allSplash = { ...SPLASH_PORT, ...SPLASH_LAND };

  for (const [folder, [w, h]] of Object.entries(allSplash)) {
    const dir = join(RES, folder);
    mkdirSync(dir, { recursive: true });

    // Resize logo to fit ~35% of the smaller dimension
    const logoWidth = Math.round(Math.min(w, h) * 0.45);

    const resizedLogo = await sharp(LOGO)
      .resize(logoWidth, null, { fit: 'inside' })
      .toBuffer();

    const logoMeta = await sharp(resizedLogo).metadata();

    // Create white background and composite logo in center
    await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{
        input: resizedLogo,
        left: Math.round((w - logoMeta.width) / 2),
        top: Math.round((h - logoMeta.height) / 2),
      }])
      .png()
      .toFile(join(dir, 'splash.png'));

    console.log(`  ${folder}: ${w}x${h} - done`);
  }
}

async function main() {
  try {
    await generateIcons();
    await generateSplash();
    console.log('\nAll assets generated successfully!');
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

main();
