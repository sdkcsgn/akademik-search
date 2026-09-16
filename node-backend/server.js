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

    // OpenAlex genel arama sorgusu
    const searchUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl);
    let rawResults = response.data.results || [];

    // Gelen sonuçları işleme
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

    // Arama terimi yazar isimlerinde geçen makaleleri listenin en başına taşı
    const searchLower = query.toLowerCase();
    results.sort((a, b) => {
      const aHasAuthor = a.authors.some(name => name.toLowerCase().includes(searchLower));
      const bHasAuthor = b.authors.some(name => name.toLowerCase().includes(searchLower));
      if (aHasAuthor && !bHasAuthor) return -1;
      if (!aHasAuthor && bHasAuthor) return 1;
      return 0;
    });

    res.json({ results });
  } catch (error) {
    console.error('API Hatası:', error.message);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));