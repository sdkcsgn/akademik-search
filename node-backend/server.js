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

    const queryNormalized = normalizeText(query);
    const queryWords = queryNormalized.split(' ').filter(w => w.length > 2);

    // Gelişmiş Puanlama ve Sıralama Algoritması
    results.sort((a, b) => {
      const aAuthorsNorm = a.authors.map(name => normalizeText(name));
      const bAuthorsNorm = b.authors.map(name => normalizeText(name));

      // 1. Tam İsim Eşleşmesi Kontrolü (Örn: "sevcan yildiz")
      const aExactMatch = aAuthorsNorm.some(name => name.includes(queryNormalized));
      const bExactMatch = bAuthorsNorm.some(name => name.includes(queryNormalized));

      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      // 2. Kelime Bazlı Eşleşme Puanı (Örn: Kaç kelime eşleşiyor?)
      const aJoined = aAuthorsNorm.join(' ');
      const bJoined = bAuthorsNorm.join(' ');

      const aScore = queryWords.filter(word => aJoined.includes(word)).length;
      const bScore = queryWords.filter(word => bJoined.includes(word)).length;

      return bScore - aScore;
    });

    res.json({ results });
  } catch (error) {
    console.error('API Hatası:', error.message);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));