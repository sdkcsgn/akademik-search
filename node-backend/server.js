const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// Türkçe karakterleri İngilizceye çeviren yardımcı fonksiyon
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

app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Arama terimi girilmedi.' });
    }

    const searchUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl);
    let rawResults = response.data.results || [];

    let results = rawResults.map(item => {
      const authors = item.authorships 
        ? item.authorships.map(a => a.author ? a.author.display_name : '').filter(Boolean)
        : [];

      const venue = item.primary_location && item.primary_location.source 
        ? item.primary_location.source.display_name 
        : null;

      return {
        id: item.id,
        title: item.title,
        publication_year: item.publication_year,
        doi: item.doi,
        cited_by_count: item.cited_by_count,
        authors: authors.slice(0, 5),
        venue: venue
      };
    });

    // Arama terimlerini kelime kelime normalize et
    const queryNormalized = normalizeText(query);
    const queryWords = queryNormalized.split(' ').filter(w => w.length > 2);

    // Sıralama Algoritması: Yazar adında aranan kelimeler geçen makaleleri en üste taşı
    results.sort((a, b) => {
      const aAuthorsNorm = a.authors.map(name => normalizeText(name)).join(' ');
      const bAuthorsNorm = b.authors.map(name => normalizeText(name)).join(' ');

      // Aranan kelimelerden kaç tanesi yazarda geçiyor?
      const aMatches = queryWords.filter(word => aAuthorsNorm.includes(word)).length;
      const bMatches = queryWords.filter(word => bAuthorsNorm.includes(word)).length;

      return bMatches - aMatches; // En çok eşleşen yazarı en tepeye koy
    });

    res.json({ results });
  } catch (error) {
    console.error('API Hatası:', error.message);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));