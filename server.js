const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Türkçe karakterleri Ýngilizce karakterlere çeviren yardýmcý fonksiyon
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/ð/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/þ/g, 's')
    .replace(/ý/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
};

// 1. Önce API rotamýz tanýmlanýr
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Arama terimi girilmedi.' });
    }

    const searchUrl = `https://api.openalex.org/works?search=${encodeURIComponent(normalizeText(query))}`;
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

    return res.json({ results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Sunucu hatasý' });
  }
});

// 2. Sonra frontend statik dosyalarý dýþ dünyaya açýlýr
app.use(express.static(path.join(__dirname, 'frontend/build')));

// 3. En sonda React Router / fallback yönlendirmesi yer alýr
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));