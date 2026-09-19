import React, { useState } from 'react';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Arama sırasında bir hata oluştu.');
      }
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#1a202c', marginBottom: '8px' }}>Akademik Search</h1>
      <p style={{ textAlign: 'center', color: '#718096', marginBottom: '30px' }}>
        OpenAlex altyapısı ile akademik makale ve yayınlarda arama yapın
      </p>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Makale başlığı, yazar veya konu yazın..."
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e0',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#3182ce',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          {loading ? 'Aranıyor...' : 'Ara'}
        </button>
      </form>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fed7d7', color: '#9b2c2c', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div>
        {results.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '16px',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
              {item.doi ? (
                <a href={item.doi} target="_blank" rel="noopener noreferrer" style={{ color: '#2b6cb0', textDecoration: 'none' }}>
                  {item.title}
                </a>
              ) : (
                <span style={{ color: '#2d3748' }}>{item.title}</span>
              )}
            </h3>
            
            <p style={{ margin: '0 0 8px 0', color: '#4a5568', fontSize: '14px' }}>
              <strong>Yazarlar:</strong> {item.authors && item.authors.length > 0 ? item.authors.join(', ') : 'Bilinmiyor'}
            </p>

            <div style={{ display: 'flex', gap: '15px', color: '#718096', fontSize: '13px' }}>
              {item.publication_year && <span>Yıl: <strong>{item.publication_year}</strong></span>}
              {item.venue && <span>Yayın: <strong>{item.venue}</strong></span>}
              <span>Atıf: <strong>{item.cited_by_count ?? 0}</strong></span>
            </div>
          </div>
        ))}

        {!loading && searched && results.length === 0 && (
          <p style={{ textAlign: 'center', color: '#718096', marginTop: '40px' }}>
            Aramanızla eşleşen sonuç bulunamadı.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;