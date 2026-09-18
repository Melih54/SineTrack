import { prisma } from "@/lib/prisma";
import MediaCard from "@/components/MediaCard";
import { Tv, Filter } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface SeriesPageProps {
  searchParams: Promise<{ genre?: string }>;
}

export default async function SeriesPage({ searchParams }: SeriesPageProps) {
  const { genre } = await searchParams;

  const where: any = { mediaType: "tv" };
  if (genre && genre !== "all") {
    where.genres = { contains: genre };
  }

  const series = await prisma.mediaItem.findMany({
    where,
    orderBy: { voteAverage: "desc" },
  });

  const genresList = [
    "all",
    "Dram",
    "Suç",
    "Aksiyon",
    "Bilim Kurgu",
    "Animasyon",
    "Komedi",
    "Gizem",
    "Fantezi",
    "Tarih",
  ];

  const toMediaItemFormat = (item: any) => ({
    id: item.tmdbId || item.id,
    name: item.title,
    overview: item.overview,
    poster_path: item.posterPath,
    backdrop_path: item.backdropPath,
    media_type: "tv" as const,
    vote_average: item.voteAverage,
    first_air_date: item.releaseYear ? `${item.releaseYear}-01-01` : undefined,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-600/20 text-rose-500 border border-rose-500/30">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Dizi Kataloğu</h1>
            <p className="text-xs text-gray-400 mt-1">
              Veritabanımızdaki tüm sezon ve bölümleriyle diziler ({series.length} Dizi Mevcut)
            </p>
          </div>
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-rose-500" />
          Türler:
        </span>
        {genresList.map((g) => {
          const isSelected = (!genre && g === "all") || genre === g;
          return (
            <Link
              key={g}
              href={g === "all" ? "/series" : `/series?genre=${encodeURIComponent(g)}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                isSelected
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {g === "all" ? "Tüm Diziler" : g}
            </Link>
          );
        })}
      </div>

      {/* Grid */}
      {series.length === 0 ? (
        <div className="py-20 text-center space-y-2">
          <Tv className="w-10 h-10 text-gray-600 mx-auto" />
          <p className="text-base font-semibold text-gray-300">Bu türde dizi bulunamadı.</p>
          <Link href="/series" className="text-xs text-rose-400 hover:underline">
            Tüm dizilere dön
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {series.map((s) => (
            <MediaCard key={s.id} item={toMediaItemFormat(s)} />
          ))}
        </div>
      )}
    </div>
  );
}
