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

// OpenAlex HTTPS İstek Fonksiyonu
const fetchOpenAlex = (searchQuery) => {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(searchQuery);
    const url = `https://api.openalex.org/works?search=${encoded}`;
    
    const options = {
      headers: {
        'User-Agent': 'AkademikSearchApp/1.0 (mailto:admin@akademiksearch.com.tr)',
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
          } catch (err) {
            reject(new Error('JSON Parse Hatası: ' + err.message));
          }
        } else {
          reject(new Error(`OpenAlex Yanıt Kodu ${res.statusCode}: ${data}`));
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
    if (!query) {
      return res.status(400).json({ error: 'Arama terimi girilmedi.' });
    }

    const normalizedQuery = normalizeText(query).trim();
    const data = await fetchOpenAlex(normalizedQuery);
    const rawResults = data?.results || [];

    const results = rawResults.map(item => {
      const authors = Array.isArray(item.authorships)
        ? item.authorships
            .map(a => a?.author?.display_name || '')
            .filter(name => typeof name === 'string' && name.trim() !== '')
        : [];

      const venue = item?.primary_location?.source?.display_name || null;

      let score = 0;
      const normalizedTitle = normalizeText(item.title);
      
      if (normalizedQuery && authors.some(author => normalizeText(author).includes(normalizedQuery))) {
        score += 100;
      }

      if (normalizedQuery && normalizedTitle.includes(normalizedQuery)) {
        score += 50;
      }

      return {
        id: item.id || Math.random().toString(),
        title: item.title || 'Başlıksız Çalışma',
        publication_year: item.publication_year || null,
        doi: item.doi || null,
        cited_by_count: item.cited_by_count || 0,
        authors: authors.slice(0, 5),
        venue: venue,
        score: score
      };
    });

    results.sort((a, b) => b.score - a.score || (b.cited_by_count || 0) - (a.cited_by_count || 0));

    return res.json({ results });
  } catch (error) {
    console.error('API Arama Hatası:', error.message);
    return res.status(500).json({ error: error.message || 'Arama sırasında bir sunucu hatası oluştu.' });
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