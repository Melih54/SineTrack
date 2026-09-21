import { prisma } from "@/lib/prisma";
import HeroBannerCarousel from "@/components/home/HeroBannerCarousel";
import CategoryPills from "@/components/home/CategoryPills";
import Top10Shelf from "@/components/home/Top10Shelf";
import MediaShelf from "@/components/home/MediaShelf";
import PlatformFeatures from "@/components/home/PlatformFeatures";
import ContinueWatching from "@/components/home/ContinueWatching";
import { Film, Tv, Trophy, Rocket, Sparkles, Clapperboard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch curated sets of movies & series from database
  const [
    heroItemsRaw,
    popularMovies,
    popularTV,
    topRated,
    turkishClassics,
    actionSciFi,
  ] = await Promise.all([
    // 1. Top 5 items for the Hero Banner Carousel
    prisma.mediaItem.findMany({
      where: {
        OR: [{ isFeatured: true }, { voteAverage: { gte: 8.0 } }],
      },
      orderBy: { voteAverage: "desc" },
      take: 5,
    }),

    // 2. Popular / Newest Movies
    prisma.mediaItem.findMany({
      where: { mediaType: "movie" },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),

    // 3. Popular / Binge-worthy TV Series
    prisma.mediaItem.findMany({
      where: { mediaType: "tv" },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),

    // 4. Top Rated (IMDb 8+)
    prisma.mediaItem.findMany({
      where: { voteAverage: { gte: 8.0 } },
      orderBy: { voteAverage: "desc" },
      take: 12,
    }),

    // 5. Turkish Cinema & Classics
    prisma.mediaItem.findMany({
      where: {
        OR: [
          { genres: { contains: "Yerli" } },
          { genres: { contains: "Komedi" } },
        ],
      },
      orderBy: { voteAverage: "desc" },
      take: 12,
    }),

    // 6. Action & Sci-Fi Thrillers
    prisma.mediaItem.findMany({
      where: {
        OR: [
          { genres: { contains: "Aksiyon" } },
          { genres: { contains: "Bilim" } },
        ],
      },
      orderBy: { voteAverage: "desc" },
      take: 12,
    }),
  ]);

  // Fallback if hero items are fewer than 3
  const heroItems =
    heroItemsRaw.length >= 3
      ? heroItemsRaw
      : await prisma.mediaItem.findMany({
          orderBy: { voteAverage: "desc" },
          take: 5,
        });

  // Helper formatter for components
  const formatItem = (item: any) => ({
    id: item.id,
    tmdbId: item.tmdbId,
    title: item.title,
    overview: item.overview,
    posterPath: item.posterPath,
    backdropPath: item.backdropPath,
    mediaType: item.mediaType as "movie" | "tv",
    voteAverage: item.voteAverage,
    releaseYear: item.releaseYear,
    genres: item.genres,
  });

  const heroFormatted = heroItems.map(formatItem);
  const top10Formatted = [...popularMovies, ...popularTV]
    .sort((a, b) => b.voteAverage - a.voteAverage)
    .slice(0, 10)
    .map(formatItem);

  return (
    <div className="relative min-h-screen space-y-12 sm:space-y-16 pb-20 overflow-x-hidden">
      {/* Ambient Lighting Background Accents */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[80vw] h-[400px] bg-gradient-to-b from-red-600/10 via-purple-600/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[1600px] left-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. CINEMATIC HERO CAROUSEL */}
      <HeroBannerCarousel items={heroFormatted} />

      {/* 2. CATEGORY / MOOD FILTER PILLS */}
      <CategoryPills />

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* KALDIĞIN YERDEN DEVAM ET (CLIENT COMPONENT) */}
        <ContinueWatching />

        {/* TÜRKİYE TOP 10 (NETFLIX STYLE) */}
        <Top10Shelf items={top10Formatted} />

        {/* POPÜLER FİLMLER SHELF */}
        <MediaShelf
          id="movies-shelf"
          title="Popüler ve Vizyondaki Filmler"
          subtitle="En çok aranan, soluksuz izlenen popüler sinema filmleri"
          icon={Film}
          iconGradient="from-red-600/20 to-orange-500/20"
          iconColor="text-red-500"
          badgeText="1080p & 4K"
          items={popularMovies.map(formatItem)}
          viewAllHref="/movies"
        />

        {/* POPÜLER DİZİLER & SEZONLAR */}
        <MediaShelf
          id="series-shelf"
          title="Dünyayı Kasıp Kavuran Diziler"
          subtitle="Tüm sezonları ve bölümleriyle kesintisiz dizi maratonu"
          icon={Tv}
          iconGradient="from-rose-500/20 to-purple-600/20"
          iconColor="text-rose-400"
          badgeText="Tüm Sezonlar"
          items={popularTV.map(formatItem)}
          viewAllHref="/series"
        />

        {/* PLATFORM STANDARTLARI & ÖZELLİKLERİ BANNER */}
        <PlatformFeatures />

        {/* SİNEMA TARİHİNİN ZİRVESİ (IMDb 8.0+ BAŞYAPITLAR) */}
        <MediaShelf
          id="top-rated"
          title="Sinema Tarihinin Zirvesi (IMDb 8.0+)"
          subtitle="Kült klasikler, Oscar ödüllü şaheserler ve yüksek puanlı başyapıtlar"
          icon={Trophy}
          iconGradient="from-amber-500/20 to-yellow-600/20"
          iconColor="text-amber-400"
          badgeText="Ödüllü Seçki"
          items={topRated.map(formatItem)}
          viewAllHref="/movies"
        />

        {/* TÜRK SİNEMASI & YERLİ KLASİKLER */}
        {turkishClassics.length > 0 && (
          <MediaShelf
            id="turkish-classics"
            title="Türk Sineması & Sevilen Yerli Klasikler"
            subtitle="Gönüllerde taht kurmuş efsane yerli dizi ve komedi klasikleri"
            icon={Clapperboard}
            iconGradient="from-cyan-500/20 to-blue-600/20"
            iconColor="text-cyan-400"
            badgeText="Yerli Yapım"
            items={turkishClassics.map(formatItem)}
            viewAllHref="/movies?genre=Yerli%20Yapım"
          />
        )}

        {/* AKSİYON & BİLİM KURGU SEÇKİSİ */}
        {actionSciFi.length > 0 && (
          <MediaShelf
            id="4k-uhd"
            title="Aksiyon & Bilim Kurgu Tutkunları İçin"
            subtitle="Görsel şölen sunan yüksek bütçeli 4K ve Full HD maceralar"
            icon={Rocket}
            iconGradient="from-purple-600/20 to-indigo-600/20"
            iconColor="text-purple-400"
            badgeText="Ultra HD"
            items={actionSciFi.map(formatItem)}
            viewAllHref="/movies?genre=Aksiyon"
          />
        )}
      </div>
    </div>
  );
}
