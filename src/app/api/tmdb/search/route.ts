import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchMulti } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

/**
 * Turkish and diacritic normalization for robust searching:
 * Handles:
 * - Turkish lowercase/uppercase (İ -> i, I -> i, ı -> i)
 * - Diacritics (ç -> c, ş -> s, ğ -> g, ü -> u, ö -> o)
 * - Punctuation and spacing
 */
function normalizeTurkish(text: string): string {
  if (!text) return "";
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDbItem(item: any) {
  const isTv = item.mediaType === "tv";
  return {
    id: item.tmdbId || item.id,
    title: item.title,
    name: isTv ? item.title : undefined,
    overview: item.overview,
    poster_path: item.posterPath,
    backdrop_path: item.backdropPath,
    media_type: item.mediaType as "movie" | "tv",
    vote_average: item.voteAverage || 8.0,
    vote_count: item.voteCount || 0,
    release_date: item.releaseYear ? `${item.releaseYear}-01-01` : undefined,
    first_air_date: item.releaseYear ? `${item.releaseYear}-01-01` : undefined,
    genres: item.genres,
    isAlreadyAdded: true,
    localId: item.id,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();
    const source = searchParams.get("source");

    // Admin paneli için doğrudan TMDB araması (yeni dizi/film içe aktarırken kullanılır)
    if (source === "tmdb" && query) {
      const tmdbResults = await searchMulti(query);
      const tmdbIds = tmdbResults.map((r) => r.id).filter(Boolean);

      const existingItems = await prisma.mediaItem.findMany({
        where: { tmdbId: { in: tmdbIds } },
        select: { id: true, tmdbId: true },
      });
      const existingMap = new Set(existingItems.map((i) => i.tmdbId));

      const enriched = tmdbResults.map((item) => ({
        ...item,
        isAlreadyAdded: existingMap.has(item.id),
        localId: existingItems.find((i) => i.tmdbId === item.id)?.id || null,
      }));

      return NextResponse.json({ results: enriched });
    }

    // Kullanıcı araması: KESİNLİKLE VE SADECE sitemizde/veritabanımızda kayıtlı olan içerikleri ara!
    const allDbItems = await prisma.mediaItem.findMany({
      orderBy: [
        { voteAverage: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Eğer arama kutusu boşsa tüm site kataloğunu döndür (özellikle mobilde /search sayfasında)
    if (!query) {
      return NextResponse.json({ results: allDbItems.map(formatDbItem) });
    }

    const normQuery = normalizeTurkish(query);
    const queryTokens = normQuery.split(" ").filter(Boolean);

    // 1. Başlık, Orijinal Başlık veya Türlerde arama yap (Ana eşleşmeler)
    const titleMatches = allDbItems.filter((item) => {
      const normTitle = normalizeTurkish(item.title);
      const normOriginal = normalizeTurkish(item.originalTitle || "");
      const normGenres = normalizeTurkish(item.genres || "");
      const headerText = `${normTitle} ${normOriginal} ${normGenres}`;

      return queryTokens.every((token) => headerText.includes(token));
    });

    // 2. Eğer başlık/türde doğrudan eşleşme varsa onu kullan; yoksa özet (karakter/konu) araması yap
    let finalMatches = titleMatches;
    if (finalMatches.length === 0) {
      finalMatches = allDbItems.filter((item) => {
        const normOverview = normalizeTurkish(item.overview || "");
        return queryTokens.every((token) => normOverview.includes(token));
      });
    }

    // Sonuçları alaka düzeyine göre sırala
    finalMatches.sort((a, b) => {
      const normA = normalizeTurkish(a.title);
      const normB = normalizeTurkish(b.title);

      // 1. Doğrudan aranan kelimeyle başlayan başlıklar en öne
      const startsA = normA.startsWith(normQuery);
      const startsB = normB.startsWith(normQuery);
      if (startsA && !startsB) return -1;
      if (!startsA && startsB) return 1;

      // 2. Başlığın içinde aranan kelime geçenler
      const titleHasA = normA.includes(normQuery);
      const titleHasB = normB.includes(normQuery);
      if (titleHasA && !titleHasB) return -1;
      if (!titleHasA && titleHasB) return 1;

      // 3. Puanına göre sırala
      return (b.voteAverage || 0) - (a.voteAverage || 0);
    });

    return NextResponse.json({ results: finalMatches.map(formatDbItem) });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
