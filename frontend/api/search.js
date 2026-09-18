const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'frontend/dist')));

app.get('/api/search', async (req, res) => {
  const { query, workId } = req.query;
  const userMail = 'info@akademiksearch.com.tr';

  try {
    let targetUrl = '';
    if (workId) {
      const cleanWorkId = workId.replace('https://openalex.org/', '');
      targetUrl = `https://api.openalex.org/works?filter=cites:${cleanWorkId}&per-page=25&mailto=${userMail}`;
    } else if (query) {
      targetUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=25&mailto=${userMail}`;
    } else {
      return res.status(400).json({ error: 'Query veya workId gerekli.' });
    }

    const apiRes = await fetch(targetUrl);
    const data = await apiRes.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatasý oluþtu.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalýþýyor.`);
});