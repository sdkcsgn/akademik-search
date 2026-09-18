import React, { useState, useEffect } from 'react';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');

  // Geri / İleri Tuşlarını Dinleme
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ query: '', results: [], searchTitle: '' }, '');
    }

    const handlePopState = (event) => {
      const state = event.state;
      if (state) {
        setQuery(state.query || '');
        setResults(state.results || []);
        setSearchTitle(state.searchTitle || '');
      } else {
        setQuery('');
        setResults([]);
        setSearchTitle('');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const executeSearch = async (searchTerm, isHistoryNavigation = false) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setResults([]);
    const title = `"${searchTerm}" için sonuçlar`;
    setSearchTitle(title);

    try {
      const cleanQuery = searchTerm.trim().toLowerCase();

      // 1. Genel Makale ve Başlık Araması (OpenAlex Works API)
      const worksRes = await fetch(
        `https://api.openalex.org/works?search=${encodeURIComponent(cleanQuery)}&per-page=100`
      );
      const worksData = await worksRes.json();
      const generalWorks = worksData.results || [];

      // 2. Yazar Araması (OpenAlex Authors API)
      const authorRes = await fetch(
        `https://api.openalex.org/authors?search=${encodeURIComponent(cleanQuery)}`
      );
      const authorData = await authorRes.json();

      let authorWorks = [];
      if (authorData.results && authorData.results.length > 0) {
        // En üstteki eşleşen yazarın makalelerini çek
        const topAuthor = authorData.results[0];
        if (topAuthor && topAuthor.id) {
          const authorWorksRes = await fetch(
            `https://api.openalex.org/works?filter=author.id:${topAuthor.id}&per-page=100`
          );
          const authorWorksData = await authorWorksRes.json();
          authorWorks = authorWorksData.results || [];
        }
      }

      // 3. Sonuçları birleştir, mükerrerleri sil
      const combined = [...authorWorks, ...generalWorks];
      const uniqueResults = Array.from(new Map(combined.map((item) => [item.id, item])).values());

      setResults(uniqueResults);

      if (!isHistoryNavigation) {
        window.history.pushState(
          { query: searchTerm, results: uniqueResults, searchTitle: title },
          ''
        );
      }
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

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

      window.history.pushState(
        { query, results: fetchedResults, searchTitle: title },
        ''
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '15px', boxSizing: 'border-box' }}>
      <header style={{ textAlign: 'center', marginBottom: '25px', padding: '0 10px' }}>
        <h1 style={{ color: '#0f172a', fontSize: '24px', lineHeight: '1.3', margin: '0 0 8px 0', fontWeight: '700' }}>
          Türkiye Odaklı Akademik Arama Motoru
        </h1>
        <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
          Milyonlarca akademik makale ve yazar arasında arama yapın
        </p>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Makale, yazar adı (ör: Emrah Koparan) veya konu girin..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '15px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              outline: 'none',
              WebkitAppearance: 'none'
            }}
          />
          <button
            type="submit"
            style={{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '12px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}
          >
            {loading ? '...' : 'Ara'}
          </button>
        </form>

        {searchTitle && results.length > 0 && (
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>
            {searchTitle} — Toplam <strong>{results.length}</strong> sonuç bulundu.
          </p>
        )}

        {results.length === 0 && !loading && query && (
          <div style={{ textAlign: 'center', marginTop: '30px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '12px' }}>
              Aramanızla eşleşen sonuç bulunamadı.
            </p>
            <a
              href={`https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', backgroundColor: '#0284c7', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}
            >
              🔍 Google Scholar üzerinde "{query}" Araması Yap ↗
            </a>
          </div>
        )}

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {results.map((item) => {
              const journalName = item.primary_location?.source?.display_name;
              const journalUrl = item.primary_location?.source?.landing_page_url || item.primary_location?.source?.id;

              const articleUrl = 
                item.open_access?.oa_url || 
                item.primary_location?.landing_page_url || 
                item.primary_location?.pdf_url || 
                item.doi;

              const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(item.title)}`;

              return (
                <div key={item.id} style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: '#1e293b', lineHeight: '1.4' }}>
                    {item.title || 'Başlıksız Yayın'}
                  </h3>

                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#475569' }}>
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
                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#64748b' }}>
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

                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>📅 Yıl: {item.publication_year || 'N/A'}</span>
                    
                    {item.cited_by_count > 0 ? (
                      <button
                        onClick={() => fetchCitations(item.id, item.title)}
                        style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline', fontWeight: '600' }}
                      >
                        📊 Atıf Sayısı: {item.cited_by_count} (Atıfları Gör →)
                      </button>
                    ) : (
                      <span>📊 Atıf Sayısı: 0</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {articleUrl && (
                      <a
                        href={articleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#4f46e5', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}
                      >
                        📄 Makaleye Git / Oku →
                      </a>
                    )}
                    <a
                      href={scholarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284c7', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}
                    >
                      🔍 Google Scholar'da Ara ↗
                    </a>
                  </div>
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