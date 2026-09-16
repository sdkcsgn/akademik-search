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
    
    const results = response.data.results.map(item => ({
      id: item.id,
      title: item.title,
      publication_year: item.publication_year,
      doi: item.doi
    }));

    res.json({ results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));