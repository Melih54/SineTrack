const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const TMDB_KEY = process.env.TMDB_API_KEY || "e366d974f76226875904620b27b96020";

async function main() {
  console.log("TMDB üzerinden yüzlerce film ve dizi çekilip veritabanına ekleniyor...");
  let count = 0;

  // 1. Popüler & En İyi Filmler (Sayfa 1-8 -> ~160 Film)
  for (let page = 1; page <= 8; page++) {
    try {
      const endpoint = page % 2 === 1 ? "popular" : "top_rated";
      const res = await fetch(`https://api.themoviedb.org/3/movie/${endpoint}?api_key=${TMDB_KEY}&language=tr-TR&page=${page}`);
      if (res.ok) {
        const data = await res.json();
        for (const m of data.results || []) {
          if (!m.poster_path || !m.title) continue;
          await prisma.mediaItem.upsert({
            where: { tmdbId: m.id },
            update: {},
            create: {
              tmdbId: m.id,
              mediaType: "movie",
              title: m.title,
              originalTitle: m.original_title,
              overview: m.overview || "Konu özeti henüz eklenmedi.",
              posterPath: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
              backdropPath: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : null,
              releaseYear: (m.release_date || "").split("-")[0] || "2024",
              voteAverage: m.vote_average || 7.5,
              voteCount: m.vote_count || 100,
              genres: "Sinema, Popüler",
              videoUrl: `https://player.videasy.net/movie/${m.id}`,
              dubUrl: `https://multiembed.mov/?video_id=${m.id}&tmdb=1&audio=tr`,
              subUrl: `https://multiembed.mov/?video_id=${m.id}&tmdb=1&sub=Turkish`,
            },
          });
          count++;
        }
      }
    } catch (err) {
      console.warn(`Movie page ${page} failed:`, err);
    }
  }

  // 2. Popüler Diziler (Sayfa 1-4 -> ~80 Dizi)
  for (let page = 1; page <= 4; page++) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_KEY}&language=tr-TR&page=${page}`);
      if (res.ok) {
        const data = await res.json();
        for (const t of data.results || []) {
          if (!t.poster_path || !t.name) continue;
          await prisma.mediaItem.upsert({
            where: { tmdbId: t.id },
            update: {},
            create: {
              tmdbId: t.id,
              mediaType: "tv",
              title: t.name,
              originalTitle: t.original_name,
              overview: t.overview || "Dizi özeti henüz eklenmedi.",
              posterPath: `https://image.tmdb.org/t/p/w500${t.poster_path}`,
              backdropPath: t.backdrop_path ? `https://image.tmdb.org/t/p/original${t.backdrop_path}` : null,
              releaseYear: (t.first_air_date || "").split("-")[0] || "2024",
              voteAverage: t.vote_average || 8.0,
              voteCount: t.vote_count || 100,
              genres: "Dizi, Trend",
              videoUrl: `https://player.videasy.net/tv/${t.id}/1/1`,
              dubUrl: `https://multiembed.mov/?video_id=${t.id}&tmdb=1&s=1&e=1&audio=tr`,
              subUrl: `https://multiembed.mov/?video_id=${t.id}&tmdb=1&s=1&e=1&sub=Turkish`,
            },
          });
          count++;
        }
      }
    } catch (err) {
      console.warn(`TV page ${page} failed:`, err);
    }
  }

  console.log(`Tamamlandı! Toplam ${count} adet yeni film ve dizi sisteme kaydedildi.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
