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

    // 1. Aşamada yazar ismi odaklı arama yapılır
    try {
      const authorUrl = `https://api.openalex.org/works?filter=raw_author_name.search:${encodeURIComponent(query)}`;
      const authorRes = await axios.get(authorUrl);
      if (authorRes.data && authorRes.data.results && authorRes.data.results.length > 0) {
        rawResults = authorRes.data.results;
      }
    } catch (e) {
      console.log('Yazar filtre hatasi pas gecildi.');
    }

    // 2. Aşamada yazar sonucu gelmezse genel aramaya düşer
    if (rawResults.length === 0) {
      const generalUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}`;
      const generalRes = await axios.get(generalUrl);
      if (generalRes.data && generalRes.data.results) {
        rawResults = generalRes.data.results;
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
    console.error('API Hatası:', error.message);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));