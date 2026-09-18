const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 1. Tüm mevcut kullanıcıları Admin yap (Özellikle sinemasiken)
  const updatedUsers = await prisma.user.updateMany({
    data: { isAdmin: true },
  });
  console.log(`Updated ${updatedUsers.count} users to isAdmin = true`);

  // 2. Örnek Popüler Filmlere ve Dizilere Türkçe Dublaj & Altyazı Kaynakları Ekle
  // Dune 2 (693134)
  await prisma.mediaSource.deleteMany({
    where: {
      tmdbId: { in: [693134, 1396] },
    },
  });

  await prisma.mediaSource.createMany({
    data: [
      {
        mediaType: "movie",
        tmdbId: 693134,
        title: "Dune: Çöl Gezegeni Bölüm İki",
        language: "tr_dub",
        sourceName: "Özel TR Dublaj (VIP)",
        url: "https://multiembed.mov/?video_id=693134&tmdb=1&audio=tr",
      },
      {
        mediaType: "movie",
        tmdbId: 693134,
        title: "Dune: Çöl Gezegeni Bölüm İki",
        language: "tr_sub",
        sourceName: "Özel TR Altyazı (4K)",
        url: "https://multiembed.mov/?video_id=693134&tmdb=1&sub=Turkish",
      },
      // Breaking Bad S1 E1 (1396)
      {
        mediaType: "tv",
        tmdbId: 1396,
        seasonNum: 1,
        episodeNum: 1,
        title: "Breaking Bad",
        language: "tr_dub",
        sourceName: "Breaking Bad S01E01 TR Dublaj",
        url: "https://multiembed.mov/?video_id=1396&tmdb=1&s=1&e=1&audio=tr",
      },
      {
        mediaType: "tv",
        tmdbId: 1396,
        seasonNum: 1,
        episodeNum: 1,
        title: "Breaking Bad",
        language: "tr_sub",
        sourceName: "Breaking Bad S01E01 TR Altyazı",
        url: "https://multiembed.mov/?video_id=1396&tmdb=1&s=1&e=1&sub=Turkish",
      },
    ],
  });

  console.log("Sample Turkish Dub & Sub sources inserted successfully!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
