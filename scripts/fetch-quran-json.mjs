import { writeFileSync, mkdirSync, existsSync } from 'fs';

const DATA_DIR = './artifacts/noor/public/data';
const IRAAB_DIR = `${DATA_DIR}/iraab`;

if (!existsSync(IRAAB_DIR)) mkdirSync(IRAAB_DIR, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1000 * (i + 1));
    }
  }
}

async function fetchQuranText() {
  console.log('1/3  Fetching Quran text for search index (quran-simple, alquran.cloud)...');
  const json = await fetchWithRetry('https://api.alquran.cloud/v1/quran/quran-simple');
  const surahs = json.data.surahs;
  const result = [];
  for (const surah of surahs) {
    for (const ayah of surah.ayahs) {
      result.push({ s: surah.number, a: ayah.numberInSurah, t: ayah.text });
    }
  }
  writeFileSync(`${DATA_DIR}/quran-search.json`, JSON.stringify(result));
  console.log(`     Saved ${result.length} ayahs  (${Math.round(JSON.stringify(result).length / 1024)}KB)`);
}

async function fetchTafsir() {
  console.log('2/3  Fetching Tafsir Muyassar (alquran.cloud)...');
  const json = await fetchWithRetry('https://api.alquran.cloud/v1/quran/ar.muyassar');
  const surahs = json.data.surahs;
  const result = {};
  for (const surah of surahs) {
    for (const ayah of surah.ayahs) {
      result[`${surah.number}:${ayah.numberInSurah}`] = ayah.text;
    }
  }
  writeFileSync(`${DATA_DIR}/tafsir-muyassar.json`, JSON.stringify(result));
  console.log(`     Saved ${Object.keys(result).length} entries  (${Math.round(JSON.stringify(result).length / 1024)}KB)`);
}

async function fetchIraabSurah(surahNum) {
  const json = await fetchWithRetry(
    `https://api.quran.com/api/v4/verses/by_chapter/${surahNum}?words=true&per_page=300&word_fields=text_uthmani,transliteration,translation&page=1`
  );
  const verses = json.verses ?? [];
  const result = {};
  for (const verse of verses) {
    result[verse.verse_number] = (verse.words ?? [])
      .filter(w => w.char_type_name === 'word')
      .map(w => ({
        w: w.text_uthmani,
        m: w.translation?.text ?? '',
        r: w.transliteration?.text ?? '',
      }));
  }
  writeFileSync(`${IRAAB_DIR}/${surahNum}.json`, JSON.stringify(result));
}

async function fetchAllIraab() {
  console.log('3/3  Fetching word-by-word data (quran.com) – 114 surahs...');
  for (let i = 1; i <= 114; i++) {
    process.stdout.write(`     Surah ${String(i).padStart(3, ' ')}/114\r`);
    try {
      await fetchIraabSurah(i);
    } catch (e) {
      console.error(`\n     !! Failed surah ${i}: ${e.message}`);
    }
    await sleep(400);
  }
  console.log('\n     All iraab files saved.');
}

async function fetchQuranUthmani() {
  console.log('4/4  Fetching Quran Uthmani (for HifzTest offline)...');
  const json = await fetchWithRetry('https://api.alquran.cloud/v1/quran/quran-uthmani');
  const surahs = json.data.surahs;
  const result = [];
  let id = 1;
  for (const surah of surahs) {
    for (const ayah of surah.ayahs) {
      result.push({ id: id++, verse_key: `${surah.number}:${ayah.numberInSurah}`, text_uthmani: ayah.text });
    }
  }
  writeFileSync(`${DATA_DIR}/quran-uthmani-full.json`, JSON.stringify(result));
  console.log(`     Saved ${result.length} ayahs  (${Math.round(JSON.stringify(result).length / 1024)}KB)`);
}

async function main() {
  console.log('=== Noor: Fetching Quran JSON data ===\n');
  const args = process.argv.slice(2);
  const onlyUthmani = args.includes('--uthmani-only');
  if (onlyUthmani) {
    await fetchQuranUthmani();
  } else {
    await fetchQuranText();
    await fetchTafsir();
    await fetchAllIraab();
    await fetchQuranUthmani();
  }
  console.log('\n=== Done! ===');
}

main().catch(err => { console.error(err); process.exit(1); });
