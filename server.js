const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Türkçe karakter dönüştürücü
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
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
    
    // OpenAlex isteği için User-Agent başlığı eklendi
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'AkademikSearchApp/1.0 (mailto:admin@akademiksearch.com.tr)'
      }
    });

    const rawResults = response.data?.results || [];

    const results = rawResults.map(item => {
      // Yazarları güvenli şekilde çıkar
      const authors = Array.isArray(item.authorships)
        ? item.authorships
            .map(a => a?.author?.display_name || '')
            .filter(name => typeof name === 'string' && name.trim() !== '')
        : [];

      // Yayın yerini güvenli şekilde çıkar
      const venue = item?.primary_location?.source?.display_name || null;

      // Akıllı Önceliklendirme Skoru
      let score = 0;
      const normalizedTitle = normalizeText(item.title);
      
      // Aranan isim yazarlar arasında geçiyorsa en yüksek önceliği ver
      const hasAuthorMatch = authors.some(author => 
        normalizeText(author).includes(normalizedQuery)
      );
      if (hasAuthorMatch) score += 100;

      // Başlıkta geçiyorsa ek puan ver
      if (normalizedTitle.includes(normalizedQuery)) score += 50;

      return {
        id: item.id,
        title: item.title || 'Başlıksız Çalışma',
        publication_year: item.publication_year || null,
        doi: item.doi || null,
        cited_by_count: item.cited_by_count || 0,
        authors: authors.slice(0, 5),
        venue: venue,
        score: score
      };
    });

    // Önce skora göre (yazar/başlık eşleşenler üstte), sonra atıf sayısına göre sırala
    results.sort((a, b) => b.score - a.score || (b.cited_by_count || 0) - (a.cited_by_count || 0));

    return res.json({ results });
  } catch (error) {
    console.error('API Arama Hatası:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Arama sırasında bir sunucu hatası oluştu.' });
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