export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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
      return res.status(400).json({ error: 'Aramak için query veya workId gereklidir.' });
    }

    const apiRes = await fetch(targetUrl);

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: `OpenAlex API hatasý: ${apiRes.status}` });
    }

    const data = await apiRes.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Serverless Function Hatasý:', error);
    return res.status(500).json({ error: 'Sunucu tarafýnda arama yapýlýrken hata oluþtu.' });
  }
}