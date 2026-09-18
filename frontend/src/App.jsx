import React, { useState, useEffect } from 'react';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');

  // Tarayıcı ve Telefon Geri / İleri Tuşlarını Dinleme
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state) {
        setQuery(event.state.query || '');
        setResults(event.state.results || []);
        setSearchTitle(event.state.searchTitle || '');
      } else {
        setResults([]);
        setSearchTitle('');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Genel Arama İşlemi
  const executeSearch = async (searchTerm, isHistoryNavigation = false) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setResults([]);
    const title = `"${searchTerm}" için sonuçlar`;
    setSearchTitle(title);

    try {
      const cleanQuery = searchTerm.trim().toLowerCase();
      
      // 1. Yazar Araması
      const authorRes = await fetch(
        `https://api.openalex.org/authors?search=${encodeURIComponent(cleanQuery)}`
      );
      const authorData = await authorRes.json();

      let authorWorks = [];
      if (authorData.results && authorData.results.length > 0) {
        const exactAuthor = authorData.results.find((author) => {
          const name = author.display_name ? author.display_name.toLowerCase() : '';
          const parts = cleanQuery.split(' ');
          return parts.every((part) => name.includes(part));
        }) || authorData.results[0];

        const authorNameLower = exactAuthor.display_name ? exactAuthor.display_name.toLowerCase() : '';
        const searchParts = cleanQuery.split(' ');
        const isMatch = searchParts.every((part) => authorNameLower.includes(part));

        if (isMatch) {
          const worksRes = await fetch(
            `https://api.openalex.org/works?filter=author.id:${exactAuthor.id}&per-page=100`
          );
          const worksData = await worksRes.json();
          authorWorks = worksData.results || [];
        }
      }

      // 2. Genel Makale Araması
      const generalWorksRes = await fetch(
        `https://api.openalex.org/works?search="${encodeURIComponent(cleanQuery)}"&per-page=100`
      );
      const generalWorksData = await generalWorksRes.json();
      const generalWorks = generalWorksData.results || [];

      const combined = [...authorWorks, ...generalWorks];
      const uniqueResults = Array.from(new Map(combined.map((item) => [item.id, item])).values());

      setResults(uniqueResults);

      // Geçmişe Kaydet (Geri Tuşu Çalışması İçin)
      if (!isHistoryNavigation) {
        window.history.pushState(
          { query: searchTerm, results: uniqueResults, searchTitle: title },
          '',
          window.location.href
        );
      }
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Atıf Yapan Makaleleri Getirme Fonksiyonu
  const fetchCitations = async (workId, articleTitle) => {
    setLoading(true);
    setResults([]);
    const title = `"${articleTitle}" makalesine atıf yapan çalışmalar`;
    setSearchTitle(title);

    try {
      const cleanWorkId = workId.replace('https://openalex.org/', '');
      const response = await fetch(
        `https://api.openalex.org/works?filter=cites:${cleanWorkId}&per-page=100`
      );
      const data = await response.json();
      const fetchedResults = data.results || [];
      setResults(fetchedResults);

      // Geçmişe Kaydet
      window.history.pushState(
        { query, results: fetchedResults, searchTitle: title },
        '',
        window.location.href
      );
    } catch (error) {
      console.error('Atıf listesi çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleAuthorClick = (authorName) => {
    setQuery(authorName);
    executeSearch(authorName);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#0f172a' }}>Türkiye Odaklı Akademik Arama Motoru</h1>
        <p style={{ color: '#475569' }}>Milyonlarca akademik makale ve yazar arasında arama yapın</p>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Makale, yazar adı (ör: Emrah Koparan) veya konu girin..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px' }}
          />
          <button
            type="submit"
            style={{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </form>

        {searchTitle && results.length > 0 && (
          <p style={{ color: '#64748b', marginBottom: '15px' }}>
            {searchTitle} — Toplam <strong>{results.length}</strong> sonuç bulundu.
          </p>
        )}

        {results.length === 0 && !loading && query && (
          <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>
            Aramanızla eşleşen sonuç bulunamadı.
          </p>
        )}

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {results.map((item) => {
              const journalName = item.primary_location?.source?.display_name;
              const journalUrl = item.primary_location?.source?.landing_page_url || item.primary_location?.source?.id;

              return (
                <div key={item.id} style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: '#1e293b' }}>
                    {item.title || 'Başlıksız Yayın'}
                  </h3>

                  <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#475569' }}>
                    <strong>Yazarlar: </strong>
                    {item.authorships && item.authorships.length > 0
                      ? item.authorships.map((a, index) => (
                          <span key={index}>
                            <button
                              onClick={() => handleAuthorClick(a.author.display_name)}
                              style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline', fontWeight: '500' }}
                            >
                              {a.author.display_name}
                            </button>
                            {index < item.authorships.length - 1 ? ', ' : ''}
                          </span>
                        ))
                      : 'Bilinmiyor'}
                  </p>

                  {journalName && (
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b' }}>
                      <strong>Kaynak / Dergi: </strong>
                      {journalUrl ? (
                        <a
                          href={journalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#0284c7', textDecoration: 'underline', fontWeight: '500' }}
                        >
                          {journalName} ↗
                        </a>
                      ) : (
                        journalName
                      )}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>📅 Yıl: {item.publication_year || 'N/A'}</span>
                    
                    {item.cited_by_count > 0 ? (
                      <button
                        onClick={() => fetchCitations(item.id, item.title)}
                        style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline', fontWeight: '600' }}
                        title="Bu makaleye atıf yapan yayınları gör"
                      >
                        📊 Atıf Sayısı: {item.cited_by_count} (Atıfları Gör →)
                      </button>
                    ) : (
                      <span>📊 Atıf Sayısı: 0</span>
                    )}
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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;