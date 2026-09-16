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

    const response = await axios.get(`https://api.openalex.org/works?search=${encodeURIComponent(query)}`);
    
    const results = response.data.results.map(item => {
      // Yazarların isimlerini çek
      const authors = item.authorships 
        ? item.authorships.map(a => a.author ? a.author.display_name : '').filter(Boolean).slice(0, 5)
        : [];

      // Yayınlandığı Dergi / Konferans adı
      const venue = item.primary_location && item.primary_location.source 
        ? item.primary_location.source.display_name 
        : null;

      return {
        id: item.id,
        title: item.title,
        publication_year: item.publication_year,
        doi: item.doi,
        cited_by_count: item.cited_by_count,
        authors: authors,
        venue: venue
      };
    });

    res.json({ results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));