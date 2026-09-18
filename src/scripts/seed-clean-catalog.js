const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TMDB_KEY = process.env.TMDB_API_KEY || "4e44d9029b1270a757cddc766a1bcb63";

const SEED_CATALOG = [
  // --- POPÜLER YERLİ DİZİLER ---
  { tmdbId: 32519, mediaType: "tv" },   // Ezel
  { tmdbId: 34587, mediaType: "tv" },   // Kurtlar Vadisi
  { tmdbId: 39176, mediaType: "tv" },   // Behzat Ç.
  { tmdbId: 115678, mediaType: "tv" },  // Gibi

  // --- POPÜLER YERLİ FİLMLER ---
  { tmdbId: 27275, mediaType: "movie" }, // G.O.R.A.
  { tmdbId: 24426, mediaType: "movie" }, // A.R.O.G
  { tmdbId: 13393, mediaType: "movie" }, // Babam ve Oğlum

  // --- POPÜLER YABANCI DİZİLER ---
  { tmdbId: 1399, mediaType: "tv" },   // Game of Thrones
  { tmdbId: 1396, mediaType: "tv" },   // Breaking Bad
  { tmdbId: 66732, mediaType: "tv" },  // Stranger Things
  { tmdbId: 100088, mediaType: "tv" }, // The Last of Us
  { tmdbId: 60059, mediaType: "tv" },  // Better Call Saul
  { tmdbId: 87108, mediaType: "tv" },  // Chernobyl
  { tmdbId: 94605, mediaType: "tv" },  // Arcane
  { tmdbId: 19885, mediaType: "tv" },  // Sherlock
  { tmdbId: 76479, mediaType: "tv" },  // The Boys
  { tmdbId: 60625, mediaType: "tv" },  // Rick and Morty

  // --- POPÜLER YABANCI FİLMLER ---
  { tmdbId: 157336, mediaType: "movie" }, // Interstellar
  { tmdbId: 27205, mediaType: "movie" },  // Inception
  { tmdbId: 155, mediaType: "movie" },    // The Dark Knight
  { tmdbId: 693134, mediaType: "movie" }, // Dune: Part Two
  { tmdbId: 872585, mediaType: "movie" }, // Oppenheimer
  { tmdbId: 550, mediaType: "movie" },    // Fight Club
  { tmdbId: 603, mediaType: "movie" },    // The Matrix
  { tmdbId: 680, mediaType: "movie" },    // Pulp Fiction
  { tmdbId: 278, mediaType: "movie" },    // The Shawshank Redemption
  { tmdbId: 238, mediaType: "movie" },    // The Godfather
  { tmdbId: 98, mediaType: "movie" },     // Gladiator
  { tmdbId: 299534, mediaType: "movie" }, // Avengers: Endgame
  { tmdbId: 19995, mediaType: "movie" },  // Avatar
];

async function importItem(item) {
  const { tmdbId, mediaType } = item;
  let res = await fetch(
    `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_KEY}&language=tr-TR`
  );
  if (!res.ok) {
    res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_KEY}&language=en-US`
    );
  }
  if (!res.ok) {
    console.error("TMDB fetch failed for", tmdbId);
    return;
  }

  const d = await res.json();
  const title = d.title || d.name || "İsimsiz";
  const originalTitle = d.original_title || d.original_name || title;
  const posterPath = d.poster_path
    ? `https://image.tmdb.org/t/p/w500${d.poster_path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80";
  const backdropPath = d.backdrop_path
    ? `https://image.tmdb.org/t/p/original${d.backdrop_path}`
    : null;
  const releaseYear = (d.release_date || d.first_air_date || "").split("-")[0] || "2024";

  const isTv = mediaType === "tv";
  const origLang = d.original_language || "";
  const isTurkish =
    origLang === "tr" ||
    (d.origin_country && d.origin_country.includes("TR")) ||
    (d.production_countries && d.production_countries.some((c) => c.iso_3166_1 === "TR"));

  let genres = (d.genres || []).map((g) => g.name).join(", ") || (isTv ? "Dizi" : "Film");
  if (isTurkish && !genres.includes("Yerli")) {
    genres = "Yerli Yapım, " + genres;
  }

  let videoUrl = "";
  let dubUrl = "";
  let subUrl = "";

  // Tüm yapımlar VidLink Pro + Videasy ile açılır (yerli/yabancı fark etmez)
  if (isTv) {
    videoUrl = `https://vidlink.pro/tv/${tmdbId}/{season}/{episode}?primaryColor=e50914`;
    subUrl = `https://player.videasy.net/tv/${tmdbId}/{season}/{episode}`;
    dubUrl = isTurkish
      ? `https://vidlink.pro/tv/${tmdbId}/{season}/{episode}?primaryColor=e50914`
      : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s={season}&e={episode}&audio=tr`;
  } else {
    videoUrl = `https://vidlink.pro/movie/${tmdbId}?primaryColor=e50914`;
    subUrl = `https://player.videasy.net/movie/${tmdbId}`;
    dubUrl = isTurkish
      ? `https://vidlink.pro/movie/${tmdbId}?primaryColor=e50914`
      : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&audio=tr`;
  }

  const seasonsCount = isTv
    ? (d.number_of_seasons || (d.seasons ? d.seasons.filter((s) => s.season_number > 0).length : 1))
    : 1;
  const episodesCount = isTv ? (d.number_of_episodes || seasonsCount * 10) : 1;

  await prisma.mediaItem.upsert({
    where: { tmdbId: Number(tmdbId) },
    update: {
      title,
      originalTitle,
      overview: d.overview || "Özet hazırlandı.",
      posterPath,
      backdropPath,
      releaseYear,
      voteAverage: d.vote_average || 8.0,
      voteCount: d.vote_count || 100,
      genres,
      duration: d.runtime || null,
      videoUrl,
      dubUrl,
      subUrl,
      seasonsCount,
      episodesCount,
    },
    create: {
      tmdbId: Number(tmdbId),
      mediaType,
      title,
      originalTitle,
      overview: d.overview || "Özet hazırlandı.",
      posterPath,
      backdropPath,
      releaseYear,
      voteAverage: d.vote_average || 8.0,
      voteCount: d.vote_count || 100,
      genres,
      duration: d.runtime || null,
      videoUrl,
      dubUrl,
      subUrl,
      seasonsCount,
      episodesCount,
    },
  });

  console.log(`[OK] ${isTurkish ? "🇹🇷 Yerli" : "🌐 Yabancı"} - ${title}`);
}

async function main() {
  console.log("Wiping old items...");
  await prisma.mediaSource.deleteMany({});
  await prisma.mediaItem.deleteMany({});
  await prisma.watchedItem.deleteMany({});
  await prisma.watchlistItem.deleteMany({});

  console.log(`Seeding ${SEED_CATALOG.length} verified high quality movies & series...`);
  for (const item of SEED_CATALOG) {
    try {
      await importItem(item);
    } catch (e) {
      console.error(`Error importing tmdbId ${item.tmdbId}:`, e);
    }
  }
  console.log("Seeding completed successfully!");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
