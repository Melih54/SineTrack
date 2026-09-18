import { prisma } from "@/lib/prisma";
import SearchClient from "./SearchClient";
import { MediaItem } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }> | { q?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const initialQuery = resolvedParams?.q || "";

  // Fetch all library items from the database
  const dbItems = await prisma.mediaItem.findMany({
    orderBy: [
      { voteAverage: "desc" },
      { title: "asc" },
    ],
  });

  const initialItems: MediaItem[] = dbItems.map((item) => ({
    id: item.tmdbId || Number(item.id.replace(/\D/g, "")) || 1,
    title: item.title,
    name: item.mediaType === "tv" ? item.title : undefined,
    original_title: item.originalTitle || undefined,
    original_name: item.originalTitle || undefined,
    overview: item.overview || "",
    poster_path: item.posterPath,
    backdrop_path: item.backdropPath,
    media_type: item.mediaType as "movie" | "tv",
    vote_average: item.voteAverage,
    release_date:
      item.mediaType === "movie" && item.releaseYear
        ? `${item.releaseYear}-01-01`
        : undefined,
    first_air_date:
      item.mediaType === "tv" && item.releaseYear
        ? `${item.releaseYear}-01-01`
        : undefined,
  }));

  return <SearchClient initialItems={initialItems} initialQuery={initialQuery} />;
}
