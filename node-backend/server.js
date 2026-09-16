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

    // Hem başlık/özet hem de yazar ismi aramasını daha doğru harmanlayan sorgu
    const response = await axios.get(`https://api.openalex.org/works?filter=author.displayName.search:${encodeURIComponent(query)}`);
    
    // Eğer yazar filtresi sonuç vermezse genel aramaya düş (Fallback)
    let rawResults = response.data.results;
    if (!rawResults || rawResults.length === 0) {
      const fallbackResponse = await axios.get(`https://api.openalex.org/works?search=${encodeURIComponent(query)}`);
      rawResults = fallbackResponse.data.results;
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
    console.error(error);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));