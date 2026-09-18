"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Bookmark, Star, Trash2, Play, Film, Tv } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";

interface WatchlistItem {
  id: string;
  mediaType: "movie" | "tv";
  tmdbId: number;
  title: string;
  posterPath: string | null;
  voteAverage: number | null;
  createdAt: string;
}

export default function WatchlistPage() {
  const { user, isLoading } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");

  const fetchWatchlist = async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [user, isLoading]);

  const removeItem = async (mediaType: string, tmdbId: number) => {
    try {
      const res = await fetch(`/api/watchlist?mediaType=${mediaType}&tmdbId=${tmdbId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => !(i.mediaType === mediaType && i.tmdbId === tmdbId)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || loading) {
    return <div className="py-24 text-center text-sm text-gray-400">Listeniz yükleniyor...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <Bookmark className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">İzleme Listeniz</h2>
        <p className="text-sm text-gray-400">
          İzlemek istediğiniz film ve dizileri kaydetmek için lütfen giriş yapın.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.mediaType === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">İzleme Listem</h1>
            <p className="text-xs text-gray-400 mt-1">
              Daha sonra izlemek üzere kaydettiğiniz içerikler ({items.length})
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "all" ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            Tümü ({items.length})
          </button>
          <button
            onClick={() => setFilter("movie")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "movie" ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            Filmler
          </button>
          <button
            onClick={() => setFilter("tv")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "tv" ? "bg-rose-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            Diziler
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <Bookmark className="w-10 h-10 text-gray-600 mx-auto" />
          <p className="text-base font-semibold text-gray-300">İzleme listeniz şu an boş.</p>
          <p className="text-xs text-gray-500">
            Keşfet veya arama sayfalarından beğendiğiniz yapımları ekleyebilirsiniz.
          </p>
          <Link
            href="/"
            className="inline-block mt-3 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
          >
            İçerik Keşfet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const detailUrl = item.mediaType === "movie" ? `/movie/${item.tmdbId}` : `/tv/${item.tmdbId}`;
            return (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden bg-[#131622] border border-white/5 hover:border-red-500/30 transition-all flex flex-col"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden block">
                  <img
                    src={getImageUrl(item.posterPath, "w500")}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Play Hover */}
                  <Link
                    href={detailUrl}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </Link>

                  {/* Badges */}
                  <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/70 text-gray-200">
                      {item.mediaType === "movie" ? "Film" : "Dizi"}
                    </span>
                    {item.voteAverage && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-amber-400 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {item.voteAverage.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.mediaType, item.tmdbId)}
                    title="Listeden Kaldır"
                    className="absolute bottom-2 right-2 p-2 rounded-xl bg-red-950/80 hover:bg-red-700 text-red-300 hover:text-white transition-colors border border-red-500/30 shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3">
                  <Link href={detailUrl}>
                    <h3 className="font-semibold text-sm text-gray-100 group-hover:text-red-400 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
