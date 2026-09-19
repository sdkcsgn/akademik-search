const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// Türkçe karakter ve metin temizleme fonksiyonu
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
};

// OpenAlex Güvenli HTTPS Çağrısı (Cloudflare Uyumlu User-Agent)
const searchOpenAlex = (query) => {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.openalex.org/works?search=${encodedQuery}`;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (mailto:admin@akademiksearch.com.tr)',
        'Accept': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON Parse Error: ${e.message}`));
          }
        } else {
          reject(new Error(`OpenAlex API HTTP ${res.statusCode}: ${data.substring(0, 150)}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// API Arama Rotası
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Arama terimi girilmedi.' });
    }

    const normalizedQuery = normalizeText(query).trim();
    if (!normalizedQuery) {
      return res.json({ results: [] });
    }

    console.log(`[SEARCH] Arama yapılıyor: "${normalizedQuery}"`);

    const data = await searchOpenAlex(normalizedQuery);
    const rawResults = Array.isArray(data?.results) ? data.results : [];

    const results = rawResults.map((item, index) => {
      try {
        const authors = Array.isArray(item?.authorships)
          ? item.authorships
              .map(a => a?.author?.display_name || '')
              .filter(name => typeof name === 'string' && name.trim() !== '')
          : [];

        const venue = item?.primary_location?.source?.display_name || null;

        let score = 0;
        const normalizedTitle = normalizeText(item?.title);

        if (normalizedQuery && authors.some(author => normalizeText(author).includes(normalizedQuery))) {
          score += 100;
        }

        if (normalizedQuery && normalizedTitle.includes(normalizedQuery)) {
          score += 50;
        }

        return {
          id: item?.id || `item-${index}`,
          title: item?.title || 'Başlıksız Çalışma',
          publication_year: item?.publication_year || null,
          doi: item?.doi || null,
          cited_by_count: item?.cited_by_count || 0,
          authors: authors.slice(0, 5),
          venue: venue,
          score: score
        };
      } catch (err) {
        console.error(`[MAP ERROR] Eleman işlenirken hata:`, err.message);
        return null;
      }
    }).filter(Boolean);

// Sadece aranan yazarın TAM adıyla eşleşen yayınları göster
const exactAuthorResults = results.filter(item =>
  item.authors.some(author =>
    normalizeText(author).trim() === normalizedQuery
  )
);

exactAuthorResults.sort(
  (a, b) => (b.cited_by_count || 0) - (a.cited_by_count || 0)
);

return res.json({ results: exactAuthorResults });
  } catch (error) {
    console.error('[SERVER ERROR] /api/search hatası:', error.message);
    return res.status(500).json({ 
      error: 'Arama sırasında bir sunucu hatası oluştu.',
      details: error.message 
    });
  }
});

// React Statik Derleme Dosyaları Servisi
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Yönlendirme (Fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sunucu ${PORT} portunda aktif.`);
});
