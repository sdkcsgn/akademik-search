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
      const response = await fetch(`https://akademik-search-api.onrender.com/api/search?q=${encodeURIComponent(query)}`);
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

        <div>
          {results.map((item, index) => (
            <div key={index} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '10px', background: '#fff' }}>
              <h3 style={{ margin: '0 0 5px 0' }}>
                <a href={item.doi || item.id} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8', textDecoration: 'none' }}>
                  {item.title}
                </a>
              </h3>
              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Yayın Yılı: {item.publication_year}</p>
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER & YASAL SAYFALAR */}
      <footer style={{ borderTop: '1px solid #eee', padding: '20px', textAlign: 'center', background: '#f9fafb', fontSize: '14px' }}>
        <p>© 2026 akademiksearch.com.tr - Tüm Hakları Saklıdır.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px' }}>
          <button onClick={() => setActiveModal('about')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}>Hakkımızda</button> |
          <button onClick={() => setActiveModal('privacy')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}>Gizlilik Politikası</button> |
          <button onClick={() => setActiveModal('contact')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}>İletişim</button>
        </div>
      </footer>

      {/* MODAL PENCERELERİ */}
      {activeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            {activeModal === 'about' && (
              <>
                <h2>Hakkımızda</h2>
                <p>Akademik Search, dünya genelindeki bilimsel yayınlara, akademik makalelere ve araştırmalara hızlı erişim sağlamak amacıyla geliştirilmiş açık bir arama motorudur. Verilerimiz OpenAlex altyapısıyla anlık olarak sunulmaktadır.</p>
              </>
            )}
            {activeModal === 'privacy' && (
              <>
                <h2>Gizlilik Politikası</h2>
                <p>akademiksearch.com.tr üzerinde kullanıcıların kişisel verileri saklanmaz. Sitemiz üçüncü taraf reklam sağlayıcıları (Google AdSense gibi) aracılığıyla çerezler kullanabilir.</p>
              </>
            )}
            {activeModal === 'contact' && (
              <>
                <h2>İletişim</h2>
                <p>Görüş, öneri ve işbirliği talepleriniz için bizimle iletişime geçebilirsiniz:</p>
                <p><strong>E-posta:</strong> info@akademiksearch.com.tr</p>
              </>
            )}
            <button onClick={() => setActiveModal(null)} style={{ marginTop: '20px', padding: '8px 16px', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;