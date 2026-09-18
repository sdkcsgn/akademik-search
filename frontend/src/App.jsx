import React, { useState } from 'react';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      // Hem yazar hem başlık aramalarında en doğru eşleşmeyi almak için genel search parametresi
      const response = await fetch(
        `https://api.openalex.org/works?search=${encodeURIComponent(query)}&sort=relevance_score:desc`
      );
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#0f172a' }}>Türkiye Odaklı Akademik Arama Motoru</h1>
        <p style={{ color: '#475569' }}>Milyonlarca akademik makale ve yazar arasında arama yapın</p>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Makale, yazar (ör: Emrah Koparan) veya konu ara..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px' }}
          />
          <button
            type="submit"
            style={{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </form>

        {results.length > 0 && (
          <p style={{ color: '#64748b', marginBottom: '15px' }}>
            Toplam <strong>{results.length}</strong> sonuç bulundu.
          </p>
        )}

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {results.map((item) => (
              <div key={item.id} style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: '#1e293b' }}>{item.title}</h3>
                <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#475569' }}>
                  <strong>Yazarlar: </strong>
                  {item.authorships && item.authorships.length > 0
                    ? item.authorships.map(a => a.author.display_name).join(', ')
                    : 'Bilinmiyor'}
                </p>
                {item.primary_location && item.primary_location.source && (
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b' }}>
                    <strong>Dergiler/Kaynak: </strong>{item.primary_location.source.display_name}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                  <span>📅 Yıl: {item.publication_year || 'N/A'}</span>
                  <span>📊 Atıf Sayısı: {item.cited_by_count}</span>
                </div>
                {item.doi && (
                  <a
                    href={item.doi}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-block', marginTop: '12px', color: '#4f46e5', fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}
                  >
                    Makaleye Git (DOI) →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;