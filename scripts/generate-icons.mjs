/**
 * Noor App — Android Icon & Splash Screen Generator
 * Generates all required Android icon sizes and splash screens from logo.png
 * Run: node scripts/generate-icons.mjs
 */

import Jimp from 'jimp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.resolve(__dirname, '..');
const LOGO_PATH  = path.join(ROOT, 'artifacts/noor/public/logo.png');
const ANDROID_RES = path.join(ROOT, 'android/app/src/main/res');

// Brand colors (from index.css)
const GOLD_COLOR = 0xC19A6BFF;   // #C19A6B — primary gold
const CREAM_COLOR = 0xFDFBF0FF;  // #FDFBF0 — app background

// Android launcher icon sizes per density
const ICON_DENSITIES = {
  'mipmap-mdpi':    { launcher: 48,  foreground: 108 },
  'mipmap-hdpi':    { launcher: 72,  foreground: 162 },
  'mipmap-xhdpi':   { launcher: 96,  foreground: 216 },
  'mipmap-xxhdpi':  { launcher: 144, foreground: 324 },
  'mipmap-xxxhdpi': { launcher: 192, foreground: 432 },
};

// Splash screen sizes per density/orientation
const SPLASH_DENSITIES = {
  'drawable':               { w: 1080, h: 1920 },
  'drawable-port-mdpi':    { w: 320,  h: 480  },
  'drawable-port-hdpi':    { w: 480,  h: 800  },
  'drawable-port-xhdpi':   { w: 720,  h: 1280 },
  'drawable-port-xxhdpi':  { w: 1080, h: 1920 },
  'drawable-port-xxxhdpi': { w: 1440, h: 2560 },
  'drawable-land-mdpi':    { w: 480,  h: 320  },
  'drawable-land-hdpi':    { w: 800,  h: 480  },
  'drawable-land-xhdpi':   { w: 1280, h: 720  },
  'drawable-land-xxhdpi':  { w: 1920, h: 1080 },
  'drawable-land-xxxhdpi': { w: 2560, h: 1440 },
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function generateIcons(logo) {
  console.log('\n📱 Generating launcher icons...\n');

  for (const [folder, sizes] of Object.entries(ICON_DENSITIES)) {
    const dir = path.join(ANDROID_RES, folder);
    ensureDir(dir);

    const { launcher: sz, foreground: fgSz } = sizes;
    const logoInset = Math.round(sz * 0.72); // 72% of icon = logo area

    // ── ic_launcher.png (gold bg + logo centered) ──────────────────
    const bg = new Jimp(sz, sz, GOLD_COLOR);
    const logoResized = logo.clone().resize(logoInset, logoInset);
    const x = Math.round((sz - logoInset) / 2);
    const y = Math.round((sz - logoInset) / 2);
    bg.composite(logoResized, x, y);
    await bg.writeAsync(path.join(dir, 'ic_launcher.png'));

    // ── ic_launcher_round.png (same as launcher) ────────────────────
    const bgRound = new Jimp(sz, sz, GOLD_COLOR);
    bgRound.composite(logoResized.clone(), x, y);
    await bgRound.writeAsync(path.join(dir, 'ic_launcher_round.png'));

    // ── ic_launcher_foreground.png (transparent bg, logo centered) ─
    // Safe zone for adaptive icon = 66% of foreground canvas
    const safeSize = Math.round(fgSz * 0.58);
    const fg = new Jimp(fgSz, fgSz, 0x00000000); // transparent
    const logoFg = logo.clone().resize(safeSize, safeSize);
    const xf = Math.round((fgSz - safeSize) / 2);
    const yf = Math.round((fgSz - safeSize) / 2);
    fg.composite(logoFg, xf, yf);
    await fg.writeAsync(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`  ✅ ${folder}: ${sz}px launcher, ${fgSz}px foreground`);
  }
}

async function generateSplash(logo) {
  console.log('\n🌅 Generating splash screens...\n');

  for (const [folder, size] of Object.entries(SPLASH_DENSITIES)) {
    const dir = path.join(ANDROID_RES, folder);
    ensureDir(dir);

    const { w, h } = size;
    const splash = new Jimp(w, h, CREAM_COLOR);

    // Logo takes up 38% of the shorter dimension, centered vertically slightly above center
    const logoSize = Math.round(Math.min(w, h) * 0.38);
    const splashLogo = logo.clone().resize(logoSize, logoSize);
    const sx = Math.round((w - logoSize) / 2);
    // Vertical center, nudged 8% up for visual balance
    const sy = Math.round((h - logoSize) / 2) - Math.round(h * 0.04);
    splash.composite(splashLogo, sx, sy);

    await splash.writeAsync(path.join(dir, 'splash.png'));
    console.log(`  ✅ ${folder}/splash.png (${w}×${h})`);
  }
}

async function main() {
  console.log('🎨 Noor Icon Generator — Starting...');
  console.log(`📂 Logo: ${LOGO_PATH}`);
  console.log(`📂 Output: ${ANDROID_RES}\n`);

  if (!fs.existsSync(LOGO_PATH)) {
    console.error('❌ Logo not found at:', LOGO_PATH);
    process.exit(1);
  }

  const logo = await Jimp.read(LOGO_PATH);
  const { width, height } = logo.bitmap;
  console.log(`📐 Logo dimensions: ${width}×${height}px`);

  await generateIcons(logo);
  await generateSplash(logo);

  console.log('\n🎉 All icons and splash screens generated successfully!\n');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
