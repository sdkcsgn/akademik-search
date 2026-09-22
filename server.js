const express = require("express");
const cors = require("cors");
const path = require("path");
const https = require("https");

const app = express();

app.use(cors());
app.use(express.json());

// Türkçe karakterleri karşılaştırma için normalize et
const normalizeText = (text = "") => {
  if (!text || typeof text !== "string") return "";

  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
};

// OpenAlex HTTPS isteği
const openAlexRequest = (url) => {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent":
          "AkademikSearch/1.0 (mailto:admin@akademiksearch.com.tr)",
        Accept: "application/json",
      },
    };

    https
      .get(url, options, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(
                new Error(`JSON Parse Error: ${error.message}`)
              );
            }
          } else {
            reject(
              new Error(
                `OpenAlex API HTTP ${response.statusCode}: ${data.substring(
                  0,
                  200
                )}`
              )
            );
          }
        });
      })
      .on("error", reject);
  });
};

// Yazar adına göre OpenAlex yazarlarını bul
const findAuthors = async (query) => {
  const encodedQuery = encodeURIComponent(query);

  const url =
    `https://api.openalex.org/authors?search=${encodedQuery}` +
    `&per-page=100`;

  const data = await openAlexRequest(url);

  const authors = Array.isArray(data.results)
    ? data.results
    : [];

  const normalizedQuery = normalizeText(query);

  // Önce tam isim eşleşmesi
  const exactAuthors = authors.filter((author) => {
    return (
      normalizeText(author?.display_name || "") ===
      normalizedQuery
    );
  });

  // ORCID ile doğru kişiyi belirle
const targetOrcid = "0000-0003-2066-1941";

const orcidMatches = exactAuthors.filter((author) => {
  return (
    (author.orcid || "")
      .replace("https://orcid.org/", "")
      .trim() === targetOrcid
  );
});

if (orcidMatches.length > 0) {
  return orcidMatches;
}

  return exactAuthors;
};

// Bir OpenAlex yazar ID'sine ait yayınları getir
const getWorksByAuthor = async (authorId) => {
  const cleanAuthorId = String(authorId)
    .replace("https://openalex.org/", "")
    .trim();

  let allWorks = [];
  let cursor = "*";
  let pageCount = 0;

  // Cursor pagination:
  // Böylece ilk 25 sonuçla sınırlı kalmayız.
  while (cursor && pageCount < 20) {
    const url =
      `https://api.openalex.org/works` +
      `?filter=authorships.author.id:${encodeURIComponent(cleanAuthorId)}` +
      `&per-page=200` +
      `&cursor=${encodeURIComponent(cursor)}`;

    const data = await openAlexRequest(url);

    const works = Array.isArray(data.results)
      ? data.results
      : [];

    allWorks.push(...works);

    const nextCursor = data?.meta?.next_cursor;

    if (!nextCursor || works.length === 0) {
      break;
    }

    cursor = nextCursor;
    pageCount++;
  }

  return allWorks;
};

// Sonuç formatı
const formatWork = (item, index) => {
  const authors = Array.isArray(item?.authorships)
    ? item.authorships
        .map(
          (authorship) =>
            authorship?.author?.display_name || ""
        )
        .filter(Boolean)
    : [];

  const venue =
    item?.primary_location?.source?.display_name ||
    item?.locations?.find(
      (location) => location?.source?.display_name
    )?.source?.display_name ||
    null;

  return {
    id: item?.id || `item-${index}`,
    title: item?.title || "Başlıksız Çalışma",
    publication_year: item?.publication_year || null,
    doi: item?.doi || null,
    cited_by_count: item?.cited_by_count || 0,
    authors: authors,
    venue: venue,
  };
};

// API arama rotası
app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Arama terimi girilmedi.",
      });
    }

    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return res.json({
        results: [],
      });
    }

    console.log(`[SEARCH] Yazar aranıyor: "${query}"`);

    // 1. İsmi tam eşleşen OpenAlex yazarlarını bul
    const authors = await findAuthors(query);

    console.log(
  "[AUTHOR PROFILES]",
  authors.map((author) => ({
    id: author.id,
    name: author.display_name,
    works_count: author.works_count,
    orcid: author.orcid,
    institutions: author.last_known_institutions?.map(
      (institution) => institution.display_name
    ),
  }))
);

    console.log(
      `[SEARCH] Tam eşleşen yazar sayısı: ${authors.length}`
    );

    if (authors.length === 0) {
      return res.json({
        results: [],
        authorsFound: 0,
      });
    }

    // 2. Aynı isimde birden fazla OpenAlex profili olabilir.
    // Hepsinin yayınlarını topla.
    const worksArrays = await Promise.all(
      authors.map((author) => getWorksByAuthor(author.id))
    );

    const allWorks = worksArrays.flat();

    // 3. Aynı yayın birden fazla profilden geldiyse tekilleştir
    const uniqueWorksMap = new Map();

    for (const work of allWorks) {
      const key =
        work?.id ||
        work?.doi ||
        `${work?.title}-${work?.publication_year}`;

      if (!uniqueWorksMap.has(key)) {
        uniqueWorksMap.set(key, work);
      }
    }

    const uniqueWorks = Array.from(
      uniqueWorksMap.values()
    );

    // 4. Güvenlik kontrolü:
    // Yayının yazarları arasında aranan tam isim gerçekten var mı?
    const verifiedWorks = uniqueWorks.filter((work) => {
      if (!Array.isArray(work?.authorships)) {
        return false;
      }

      return work.authorships.some((authorship) => {
        const authorName =
          authorship?.author?.display_name || "";

        return (
          normalizeText(authorName) === normalizedQuery
        );
      });
    });

    // 5. Frontend formatına dönüştür
    const results = verifiedWorks.map(formatWork);

    // En yeni yayınlar önce.
    // Aynı yılda daha çok atıf alan üstte.
    results.sort((a, b) => {
      const yearDifference =
        (b.publication_year || 0) -
        (a.publication_year || 0);

      if (yearDifference !== 0) {
        return yearDifference;
      }

      return (
        (b.cited_by_count || 0) -
        (a.cited_by_count || 0)
      );
    });

    console.log(
      `[SEARCH] "${query}" için ${results.length} yayın bulundu.`
    );

    return res.json({
      results,
      authorsFound: authors.length,
      total: results.length,
    });
  } catch (error) {
    console.error(
      "[SERVER ERROR] /api/search:",
      error
    );

    return res.status(500).json({
      error: "Arama sırasında bir sunucu hatası oluştu.",
      details: error.message,
    });
  }
});

// React build dosyalarını yayınla
app.use(
  express.static(
    path.join(__dirname, "frontend", "build")
  )
);

// React fallback
app.get("*", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "frontend",
      "build",
      "index.html"
    )
  );
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Akademik Search sunucusu ${PORT} portunda çalışıyor.`
  );
});