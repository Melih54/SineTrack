import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MediaCard from "@/components/MediaCard";
import { Play, Info, Flame, Trophy, Tv, Sparkles, Film } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Veritabanımızdaki 70+ film ve diziden verileri çek
  const [featuredItem, popularMovies, popularTV, topRated, turkishClassics] = await Promise.all([
    prisma.mediaItem.findFirst({
      where: { isFeatured: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.mediaItem.findMany({
      where: { mediaType: "movie" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.mediaItem.findMany({
      where: { mediaType: "tv" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.mediaItem.findMany({
      where: { mediaType: "movie" },
      orderBy: { voteAverage: "desc" },
      take: 10,
    }),
    prisma.mediaItem.findMany({
      where: { genres: { contains: "Komedi" } },
      orderBy: { voteAverage: "desc" },
      take: 10,
    }),
  ]);

  const hero = featuredItem || popularMovies[0];
  const isHeroMovie = hero ? hero.mediaType === "movie" : true;
  const heroId = hero?.tmdbId || hero?.id;
  const heroLink = isHeroMovie ? `/movie/${heroId}` : `/tv/${heroId}`;

  // Helper format
  const toMediaItemFormat = (item: any) => ({
    id: item.tmdbId || item.id,
    title: item.title,
    name: item.mediaType === "tv" ? item.title : undefined,
    overview: item.overview,
    poster_path: item.posterPath,
    backdrop_path: item.backdropPath,
    media_type: item.mediaType as "movie" | "tv",
    vote_average: item.voteAverage,
    release_date: item.releaseYear ? `${item.releaseYear}-01-01` : undefined,
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      {hero && (
        <div className="relative w-full h-[65vh] sm:h-[72vh] min-h-[480px] max-h-[750px] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={hero.backdropPath || hero.posterPath}
              alt={hero.title}
              className="w-full h-full object-cover object-center scale-105"
            />
            {/* Multi-layered cinematic gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#08090e] via-[#08090e]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08090e] via-[#08090e]/50 to-transparent" />
            <div className="absolute inset-0 bg-radial from-transparent via-[#08090e]/20 to-[#08090e]/80 pointer-events-none" />
          </div>

          <div className="relative max-w-7xl mx-auto h-full flex flex-col justify-end px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Öne Çıkan Başyapıt</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 border border-white/15 text-gray-200">
                  {hero.releaseYear || "2024"}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-red-600 text-white shadow-sm">
                  1080p Full HD
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md leading-tight">
                {hero.title}
              </h1>

              <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed drop-shadow max-w-xl">
                {hero.overview}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={heroLink}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/40 hover:scale-105 transition-all"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Hemen İzle</span>
                </Link>
                <Link
                  href={heroLink}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-md border border-white/15 transition-all"
                >
                  <Info className="w-5 h-5" />
                  <span>Detaylar & Bölümler</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Vizyondaki Popüler Filmler */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Popüler Filmler</h2>
            </div>
            <Link
              href="/movies"
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Tüm Filmleri Gör ({popularMovies.length}+) →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {popularMovies.map((item) => (
              <MediaCard key={item.id} item={toMediaItemFormat(item)} />
            ))}
          </div>
        </section>

        {/* Popüler Diziler */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Tv className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Popüler Diziler & Sezonlar</h2>
            </div>
            <Link
              href="/series"
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Tüm Dizileri Gör ({popularTV.length}+) →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {popularTV.map((item) => (
              <MediaCard key={item.id} item={toMediaItemFormat(item)} />
            ))}
          </div>
        </section>

        {/* En Yüksek Puanlı Filmler */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Trophy className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">En Yüksek Puanlı Başyapıtlar</h2>
            </div>
            <Link
              href="/movies"
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Tümünü Gör →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topRated.map((item) => (
              <MediaCard key={item.id} item={toMediaItemFormat(item)} />
            ))}
          </div>
        </section>

        {/* Sevilen Komediler & Türk Sineması */}
        {turkishClassics.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Film className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Komedi & Klasikler</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {turkishClassics.map((item) => (
                <MediaCard key={item.id} item={toMediaItemFormat(item)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
