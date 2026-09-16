const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Arama terimi girilmedi.' });
    }

    let rawResults = [];

    // 1. Öncelik: Doğrudan yazar adı araması (Yazara özel arama)
    try {
      const authorSearchUrl = `https://api.openalex.org/works?filter=author.display_name.search:${encodeURIComponent(query)}`;
      const authorResponse = await axios.get(authorSearchUrl);
      if (authorResponse.data && authorResponse.data.results) {
        rawResults = authorResponse.data.results;
      }
    } catch (e) {
      console.log('Yazar filtresi eslesmedi, genel aramaya geciliyor...');
    }

    // 2. Öncelik: Yazar filtresi boş dönerse genel kelime araması
    if (!rawResults || rawResults.length === 0) {
      const generalSearchUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}`;
      const generalResponse = await axios.get(generalSearchUrl);
      if (generalResponse.data && generalResponse.data.results) {
        rawResults = generalResponse.data.results;
      }
    }

    const results = rawResults.map(item => {
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

    res.json({ results });
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));