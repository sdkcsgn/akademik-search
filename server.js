const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Türkçe karakter dönüştürücü
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
};

// API Arama Rotası
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Arama terimi girilmedi.' });
    }

    const normalizedQuery = normalizeText(query).trim();
    const searchUrl = `https://api.openalex.org/works?search=${encodeURIComponent(normalizedQuery)}`;
    const response = await axios.get(searchUrl);
    let rawResults = response.data.results || [];

    let results = rawResults.map(item => {
      const authors = item.authorships
        ? item.authorships.map(a => a.author ? a.author.display_name : '').filter(Boolean)
        : [];

      const venue = item.primary_location && item.primary_location.source
        ? item.primary_location.source.display_name
        : null;

      // Akıllı Önceliklendirme Skoru
      let score = 0;
      const normalizedTitle = normalizeText(item.title);
      
      // Aranan isim yazarlar arasında birebir geçiyorsa en yüksek önceliği ver
      const hasAuthorMatch = authors.some(author => 
        normalizeText(author).includes(normalizedQuery)
      );
      if (hasAuthorMatch) score += 100;

      // Başlıkta geçiyorsa ek puan ver
      if (normalizedTitle.includes(normalizedQuery)) score += 50;

      return {
        id: item.id,
        title: item.title,
        publication_year: item.publication_year,
        doi: item.doi,
        cited_by_count: item.cited_by_count,
        authors: authors.slice(0, 5),
        venue: venue,
        score: score
      };
    });

    // Önce skora göre (yazarı/başlığı eşleşenler en üste), ardından atıf sayısına göre sırala
    results.sort((a, b) => b.score - a.score || (b.cited_by_count || 0) - (a.cited_by_count || 0));

    return res.json({ results });
  } catch (error) {
    console.error('API Hatası:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// React Statik Dosyaları
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Fallback Yönlendirmesi
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sunucu ${PORT} portunda aktif.`);
});
