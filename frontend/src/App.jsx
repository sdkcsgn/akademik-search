import React, { useState } from 'react';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const response = await fetch('https://akademik-search.onrender.com/api/search?q=' + encodeURIComponent(query));
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '20px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#4f46e5', letterSpacing: '-0.5px' }}>
            Akademik Search
          </h1>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>
            Türkiye ve dünya genelinde milyonlarca akademik makale ve yazar da arama yapın
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto', padding: '40px 20px 20px', boxSizing: 'border-box' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Akademik makale veya yazar adı arayın..."
            style={{ 
              flex: 1, 
              padding: '14px 18px', 
              fontSize: '16px', 
              border: '1px solid #cbd5e1', 
              borderRadius: '10px', 
              outline: 'none',
              backgroundColor: '#ffffff', 
              color: '#0f172a',
              WebkitTextFillColor: '#0f172a'
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              padding: '0 28px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </form>

        {results.length > 0 && (
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            Toplam <strong>{results.length}</strong> sonuç bulundu.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {results.map((item) => (
            <div key={item.id} style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: '#1e293b' }}>{item.title}</h3>
              <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#475569' }}>
                ✍️ <strong>Yazarlar:</strong> {item.authors ? item.authors.join(', ') : 'Bilinmiyor'}
              </p>
              <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                <span>📅 Yıl: {item.publication_year || 'N/A'}</span>
                <span>📖 Dergi/Konferans: {item.venue || 'Belirtilmedi'}</span>
                <span>📊 Atıf Sayısı: {item.cited_by_count}</span>
              </div>
              {item.doi && (
                <a href={item.doi} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '12px', color: '#4f46e5', fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}>
                  Makaleye Git (DOI) →
                </a>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;