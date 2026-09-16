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
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Türkiye ve dünya genelinde milyonlarca akademik makale ve yazarda arama yapın
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px 20px', maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '35px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Makale başlığı, yazar adı veya konu girin..."
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '16px',
              outline: 'none',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '14px 28px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
            }}
          >
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </form>

        {/* Results Count */}
        {results.length > 0 && (
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            Toplam <strong>{results.length}</strong> sonuç bulundu.
          </p>
        )}

        {/* Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {results.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '24px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
              }}
            >
              {/* Title */}
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '700', lineHeight: '1.4', color: '#1e293b' }}>
                {item.title}
              </h3>

              {/* Authors */}
              {item.authors && item.authors.length > 0 && (
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                  ✍️ <strong>Yazarlar:</strong> {item.authors.join(', ')}
                </p>
              )}

              {/* Meta Stats (Year, Venue, Citations) */}
              <div style={{ display: 'flex', wrap: 'wrap', gap: '15px', fontSize: '13px', color: '#64748b', marginBottom: '15px', borderTop: '1px border-bottom: 1px solid #f1f5f9', padding: '8px 0' }}>
                <span>📅 <strong>Yıl:</strong> {item.publication_year || 'Belirtilmedi'}</span>
                {item.venue && <span>📖 <strong>Dergi/Konferans:</strong> {item.venue}</span>}
                <span>📊 <strong>Atıf Sayısı:</strong> {item.cited_by_count ?? 0}</span>
              </div>

              {/* Action Link */}
              {item.doi ? (
                <a
                  href={item.doi}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#4f46e5',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  Makaleye Git (DOI) →
                </a>
              ) : (
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Açık erişim bağlantısı mevcut değil</span>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#ffffff', padding: '24px 20px', textAlign: 'center', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
        <p style={{ margin: '0 0 12px 0' }}>© 2026 akademiksearch.com.tr - Tüm Hakları Saklıdır.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <button onClick={() => setActiveModal('about')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: '500' }}>Hakkımızda</button>
          <span>|</span>
          <button onClick={() => setActiveModal('privacy')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: '500' }}>Gizlilik Politikası</button>
          <span>|</span>
          <button onClick={() => setActiveModal('contact')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: '500' }}>İletişim</button>
        </div>
      </footer>

      {/* Modals */}
      {activeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '14px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            {activeModal === 'about' && <h2 style={{ marginTop: 0, color: '#0f172a' }}>Hakkımızda</h2>}
            {activeModal === 'privacy' && <h2 style={{ marginTop: 0, color: '#0f172a' }}>Gizlilik Politikası</h2>}
            {activeModal === 'contact' && <h2 style={{ marginTop: 0, color: '#0f172a' }}>İletişim</h2>}
            <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '15px' }}>
              {activeModal === 'about' && 'Akademik Search, dünya çapındaki açık erişimli akademik yayınları, yazarları ve atıf istatistiklerini ücretsiz olarak taramanızı sağlayan akademik bir arama motorudur.'}
              {activeModal === 'privacy' && 'Sitemizde kullanıcı gizliliği esastır. Çerezler yalnızca kullanıcı deneyimini iyileştirmek ve Google AdSense hizmetlerini sunmak amacıyla kullanılmaktadır.'}
              {activeModal === 'contact' && 'Görüş, öneri ve iş birliği talepleriniz için bize info@akademiksearch.com.tr adresinden ulaşabilirsiniz.'}
            </p>
            <button onClick={() => setActiveModal(null)} style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;