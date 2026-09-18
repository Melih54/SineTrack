import { notFound } from "next/navigation";
import { getMediaDetails } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";
import MovieDetailClient from "./MovieDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MovieDetailPage({ params }: PageProps) {
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
    const movieData: any = {
      id: dbItem.tmdbId || numericId || 1000,
      title: dbItem.title,
      overview: dbItem.overview,
      poster_path: dbItem.posterPath,
      backdrop_path: dbItem.backdropPath || dbItem.posterPath,
      media_type: "movie",
      vote_average: dbItem.voteAverage,
      release_date: dbItem.releaseYear ? `${dbItem.releaseYear}-01-01` : "2024-01-01",
      runtime: dbItem.duration || 120,
      genres: (dbItem.genres || "Genel").split(",").map((g, idx) => ({ id: idx, name: g.trim() })),
      videoUrl: dbItem.videoUrl,
      dubUrl: dbItem.dubUrl,
      subUrl: dbItem.subUrl,
    };
    return <MovieDetailClient movie={movieData} />;
  }

  // 2. Veritabanında yoksa TMDB servisinden çek
  if (isNaN(numericId)) {
    notFound();
  }

  const movie = await getMediaDetails("movie", numericId);

  if (!movie) {
    notFound();
  }

  return <MovieDetailClient movie={movie} />;
}
