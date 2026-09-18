import { notFound } from "next/navigation";
import { getMediaDetails } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";
import TvDetailClient from "./TvDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TvDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  // 1. Önce yerel veritabanımızda kayıtlı mı kontrol et
  const dbItem = await prisma.mediaItem.findFirst({
    where: {
      OR: [
        { id },
        ...(isNaN(numericId) ? [] : [{ tmdbId: numericId }]),
      ],
    },
  });

  if (dbItem) {
    // TMDB'den gerçek sezon ve bölüm sayılarını çek
    const tmdbIdToUse = dbItem.tmdbId || (!isNaN(numericId) ? numericId : null);
    const tmdbData = tmdbIdToUse ? await getMediaDetails("tv", tmdbIdToUse) : null;

    const realSeasons =
      tmdbData?.seasons && tmdbData.seasons.length > 0
        ? tmdbData.seasons.filter((s) => s.season_number > 0)
        : null;

    const seasonsCount = realSeasons ? realSeasons.length : dbItem.seasonsCount || 1;

    const tvData: any = {
      id: dbItem.tmdbId || numericId || 2000,
      name: dbItem.title,
      overview: dbItem.overview || tmdbData?.overview,
      poster_path: dbItem.posterPath || tmdbData?.poster_path,
      backdrop_path: dbItem.backdropPath || tmdbData?.backdrop_path || dbItem.posterPath,
      media_type: "tv",
      vote_average: dbItem.voteAverage || tmdbData?.vote_average || 8.0,
      first_air_date:
        tmdbData?.first_air_date || (dbItem.releaseYear ? `${dbItem.releaseYear}-01-01` : "2024-01-01"),
      number_of_seasons: seasonsCount,
      number_of_episodes: tmdbData?.number_of_episodes || dbItem.episodesCount || seasonsCount * 8,
      genres:
        tmdbData?.genres && tmdbData.genres.length > 0
          ? tmdbData.genres
          : (dbItem.genres || "Genel").split(",").map((g, idx) => ({ id: idx, name: g.trim() })),
      videoUrl: dbItem.videoUrl,
      dubUrl: dbItem.dubUrl,
      subUrl: dbItem.subUrl,
      seasons:
        realSeasons ||
        Array.from({ length: seasonsCount }, (_, i) => ({
          id: (dbItem.tmdbId || 2000) * 10 + (i + 1),
          name: `${i + 1}. Sezon`,
          season_number: i + 1,
          episode_count: 10,
          poster_path: dbItem.posterPath,
          overview: `${dbItem.title} ${i + 1}. Sezon`,
        })),
    };
    return <TvDetailClient tv={tvData} />;
  }

  // 2. Veritabanında yoksa TMDB'den çek
  if (isNaN(numericId)) {
    notFound();
  }

  const tv = await getMediaDetails("tv", numericId);

  if (!tv) {
    notFound();
  }

  return <TvDetailClient tv={tv} />;
}
