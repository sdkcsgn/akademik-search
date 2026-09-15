const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// Bozuk karakterleri ve Unicode eksikliklerini temizleme fonksiyonu
const cleanText = (str) => {
    if (!str) return '';
    return str
        .replace(/\uFFFD/g, '')                      // Bozuk Unicode simgesini siler
        .replace(/Akademik Yay.*n/gi, 'Akademik Yayın') // "Akademik Yayn" hatalarını düzeltir
        .replace(/Yay\.?n/gi, 'Yayın')                // "Yayn" kelimelerini düzeltir
        .trim();
};

app.get('/api/search', async (req, res) => {
    const query = req.query.q || 'personality';
    try {
        const response = await axios.get(`https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=10`);
        
        const results = response.data.results.map(item => ({
            id: item.id,
            title: cleanText(item.display_name || "Başlıksız Makale"),
            authors: item.authorships ? item.authorships.map(a => cleanText(a.author ? a.author.display_name : '')).filter(Boolean).slice(0, 3) : [],
            institution: (item.authorships && item.authorships[0] && item.authorships[0].institutions && item.authorships[0].institutions[0]) ? cleanText(item.authorships[0].institutions[0].display_name) : "Bilinmiyor",
            publisher: (item.primary_location && item.primary_location.source) ? cleanText(item.primary_location.source.display_name) : "Akademik Yayın",
            year: item.publication_year,
            citations: item.cited_by_count || 0,
            doi: item.doi,
            pdf_url: (item.primary_location && item.primary_location.pdf_url) ? item.primary_location.pdf_url : item.doi
        }));

        res.json({ status: 'success', count: results.length, data: results });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(5000, () => console.log('Sunucu 5000 portunda çalışıyor...'));