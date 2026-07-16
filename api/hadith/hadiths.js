const https = require('https');

const API_KEY =
  process.env.HADITH_API_KEY ||
  '$2y$10$zSijdF10JGzOS8ZyQDf5xO1rYuVOiEWV71IogIVeivmQXGjGxkS';

const BASE = 'https://hadithapi.com/api';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch {
            reject(new Error('Invalid JSON from hadithapi.com'));
          }
        });
      })
      .on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { book, chapter, page = '1', paginate = '10' } = req.query;
  if (!book) {
    res.status(400).json({ error: 'book is required' });
    return;
  }
  try {
    let url = `${BASE}/hadiths?apiKey=${encodeURIComponent(API_KEY)}&book=${encodeURIComponent(book)}&paginate=${paginate}&page=${page}`;
    if (chapter) url += `&chapter=${encodeURIComponent(chapter)}`;
    const data = await httpsGet(url);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hadiths' });
  }
};
