import { writeFileSync, mkdirSync, existsSync } from 'fs';

const DATA_DIR = './artifacts/noor/public/data';
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const BOOKS = [
  { slug: 'sahih-bukhari',  name: 'صحيح البخاري',   edition: 'ara-bukhari'  },
  { slug: 'sahih-muslim',   name: 'صحيح مسلم',      edition: 'ara-muslim'   },
  { slug: 'al-tirmidhi',    name: 'جامع الترمذي',   edition: 'ara-tirmidhi' },
  { slug: 'abu-dawood',     name: 'سنن أبي داود',   edition: 'ara-abudawud' },
  { slug: 'ibn-e-majah',    name: 'سنن ابن ماجه',   edition: 'ara-ibnmajah' },
  { slug: 'sunan-nasai',    name: 'سنن النسائي',    edition: 'ara-nasai'    },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      const wait = 1500 * (i + 1);
      console.log(`     Retry ${i+1}/${retries-1} after ${wait}ms: ${e.message}`);
      await sleep(wait);
    }
  }
}

async function fetchBook(book) {
  const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${book.edition}.json`;
  console.log(`\n  Fetching ${book.name} (${book.edition})...`);
  const json = await fetchWithRetry(url);

  const hadiths = json.hadiths ?? [];
  console.log(`  → ${hadiths.length} hadiths`);

  const outPath = `${DATA_DIR}/hadith-${book.slug}.json`;
  const compact = hadiths.map(h => ({
    n: Number(h.hadithnumber) || Number(h.arabicnumber) || 0,
    t: (h.text || '').trim(),
  })).filter(h => h.t);

  writeFileSync(outPath, JSON.stringify(compact));
  console.log(`  → Saved to ${outPath}  (${Math.round(JSON.stringify(compact).length / 1024)}KB)`);
  return compact.length;
}

async function main() {
  console.log('=== Noor: Fetching Hadith JSON data ===\n');

  const meta = [];
  for (const book of BOOKS) {
    try {
      const count = await fetchBook(book);
      meta.push({ slug: book.slug, name: book.name, edition: book.edition, count });
    } catch (e) {
      console.error(`\n  !! FAILED ${book.slug}: ${e.message}`);
      meta.push({ slug: book.slug, name: book.name, edition: book.edition, count: 0, error: e.message });
    }
    await sleep(1000);
  }

  writeFileSync(`${DATA_DIR}/hadith-meta.json`, JSON.stringify(meta, null, 2));
  console.log('\n=== Done! hadith-meta.json saved ===');
  console.log(meta.map(m => `  ${m.name}: ${m.count}`).join('\n'));
}

main().catch(err => { console.error(err); process.exit(1); });
