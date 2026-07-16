const path = require('path');
const fs = require('fs');
const Jimp = require('/home/runner/workspace/node_modules/.pnpm/jimp@0.22.12/node_modules/jimp/dist/index.js');

const FRAMES_DIR = '/tmp/widget_frames';
const SHEETS_DIR = '/tmp/widget_sheets';
const COLS = 10, ROWS = 6, PER_SHEET = 60;
const FW = 160, FH = 352;

const frames = fs.readdirSync(FRAMES_DIR).filter(f => f.endsWith('.jpg')).sort();
console.log(`Total frames: ${frames.length}`);
const numSheets = Math.ceil(frames.length / PER_SHEET);

async function run() {
  for (let s = 0; s < numSheets; s++) {
    const batch = frames.slice(s * PER_SHEET, (s+1) * PER_SHEET);
    const sheet = new Jimp(COLS * FW, ROWS * FH, 0x000000ff);
    for (let i = 0; i < batch.length; i++) {
      const img = await Jimp.read(path.join(FRAMES_DIR, batch[i]));
      sheet.blit(img, (i % COLS) * FW, Math.floor(i / COLS) * FH);
    }
    await sheet.quality(82).writeAsync(path.join(SHEETS_DIR, `sheet_${String(s+1).padStart(2,'0')}.jpg`));
    if ((s+1) % 5 === 0 || s+1 === numSheets) process.stdout.write(`Sheet ${s+1}/${numSheets}\n`);
  }
  console.log('ALL DONE');
}
run().catch(e => { console.error(e.message); process.exit(1); });
