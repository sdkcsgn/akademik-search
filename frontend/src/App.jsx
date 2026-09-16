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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <main style={{ flex: 1, padding: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ textAlign: 'center', color: '#4f46e5' }}>Akademik Search</h1>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Makale, yazar veya konu ara..."
            style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '12px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {results.map((item) => (
            <div key={item.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px', background: '#f9fafb' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{item.title}</h3>
              <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                Yıl: {item.publication_year || 'Belirtilmedi'}
              </p>
              {item.doi && (
                <a href={item.doi} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontSize: '14px', textDecoration: 'none' }}>
                  Makaleye Git (DOI) →
                </a>
              )}
            </div>
          ))}
        </div>
      </main>

      <footer style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #eee', color: '#6b7280', fontSize: '14px' }}>
        <p>© 2026 akademiksearch.com.tr - Tüm Hakları Saklıdır.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button onClick={() => setActiveModal('about')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}>Hakkımızda</button>
          <span>|</span>
          <button onClick={() => setActiveModal('privacy')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}>Gizlilik Politikası</button>
          <span>|</span>
          <button onClick={() => setActiveModal('contact')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}>İletişim</button>
        </div>
      </footer>

      {activeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', maxWidth: '500px', width: '90%' }}>
            {activeModal === 'about' && <h2>Hakkımızda</h2>}
            {activeModal === 'privacy' && <h2>Gizlilik Politikası</h2>}
            {activeModal === 'contact' && <h2>İletişim</h2>}
            <p style={{ marginTop: '15px', color: '#4b5563' }}>
              {activeModal === 'about' && 'Akademik Search, açık erişimli akademik yayınları taramanızı sağlayan yerli bir arama motorudur.'}
              {activeModal === 'privacy' && 'Sitemizde kullanıcı gizliliği esastır. Çerezler yalnızca kullanıcı deneyimini iyileştirmek ve AdSense hizmetleri için kullanılır.'}
              {activeModal === 'contact' && 'Bize info@akademiksearch.com.tr adresinden ulaşabilirsiniz.'}
            </p>
            <button onClick={() => setActiveModal(null)} style={{ marginTop: '15px', padding: '8px 16px', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;