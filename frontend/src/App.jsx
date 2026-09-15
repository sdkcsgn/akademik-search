import React, { useState, useEffect } from 'react';

export default function App() {
  const [query, setQuery] = useState('personality');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const cleanText = (text) => {
    if (!text) return '';
    return text.replace(/\uFFFD/g, '').replace(/Yay.n/g, 'Yayın');
  };

  const fetchArticles = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(searchQuery)}`);
      const result = await response.json();
      if (result.status === 'success') {
        setArticles(result.data);
      }
    } catch (error) {
      console.error("Arama hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles('personality');
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      fetchArticles(query);
    }
  };

  const copyCitation = (article) => {
    const citation = `${article.authors.join(', ')} (${article.year}). ${article.title}. ${article.publisher}.`;
    navigator.clipboard.writeText(citation);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: 'sans-serif', padding: '20px' }}>
      <header style={{ backgroundColor: '#ffffff', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#4f46e5', margin: 0 }}>
          Akademik Search
        </h1>
        <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
          Canlı API Bağlı (Node.js)
        </span>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Makale başlığı, yazar adı veya konu girin..."
            style={{ flex: 1, padding: '14px 18px', fontSize: '16px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none' }}
          />
          <button
            type="submit"
            style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '14px 24px', fontSize: '16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {articles.length === 0 && !loading && (
            <p style={{ textAlign: 'center', color: '#64748b' }}>Arama yapmak için yukarıya bir kelime yazıp "Ara" butonuna basın.</p>
          )}

          {articles.map((item) => (
            <div key={item.id} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#0f172a' }}>
                  {cleanText(item.title)}
                </h3>
                <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {item.year || 'Tarihsiz'}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <span><strong>Yazar:</strong> {item.authors.length > 0 ? cleanText(item.authors.join(', ')) : 'Bilinmiyor'}</span>
                <span><strong>Kurum:</strong> {cleanText(item.institution)}</span>
                <span><strong>Atıf:</strong> {item.citations}</span>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ fontStyle: 'italic', color: '#64748b' }}>{cleanText(item.publisher)}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => copyCitation(item)}
                    style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: '500' }}
                  >
                    {copiedId === item.id ? 'Atıf Kopyalandı' : 'Atıf Yap'}
                  </button>

                  {item.pdf_url && (
                    <a
                      href={item.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ backgroundColor: '#eef2ff', color: '#4f46e5', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '500' }}
                    >
                      Yayına Git
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}