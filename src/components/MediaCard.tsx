"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, Bookmark, Play, Check } from "lucide-react";
import { MediaItem, getImageUrl } from "@/lib/tmdb";
import { useAuth } from "@/context/AuthContext";

interface MediaCardProps {
  item: MediaItem;
  initialInWatchlist?: boolean;
}

export default function MediaCard({ item, initialInWatchlist = false }: MediaCardProps) {
  const { user } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [loading, setLoading] = useState(false);

  const isMovie = item.media_type === "movie" || !item.name;
  const title = item.title || item.name || "Bilinmeyen Başlık";
  const date = item.release_date || item.first_air_date;
  const year = date ? new Date(date).getFullYear() : "";
  const detailUrl = isMovie ? `/movie/${item.id}` : `/tv/${item.id}`;

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("İzleme listenize eklemek için lütfen giriş yapın.");
      return;
    }

    setLoading(true);
    try {
      if (inWatchlist) {
        await fetch(`/api/watchlist?mediaType=${isMovie ? "movie" : "tv"}&tmdbId=${item.id}`, {
          method: "DELETE",
        });
        setInWatchlist(false);
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaType: isMovie ? "movie" : "tv",
            tmdbId: item.id,
            title,
            posterPath: item.poster_path,
            voteAverage: item.vote_average,
          }),
        });
        setInWatchlist(true);
      }
    } catch (err) {
      console.error("Watchlist toggle error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden glass-card border border-white/10 hover:border-red-500/50 hover:shadow-[0_8px_32px_rgba(229,9,20,0.22)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col">
      {/* Poster Image Container */}
      <Link href={detailUrl} className="relative aspect-[2/3] w-full overflow-hidden block bg-[#0a0c14]">
        <img
          src={getImageUrl(item.poster_path, "w500")}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Hover Gradient Overlay & Play Icon */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wider uppercase bg-black/70 backdrop-blur-md text-gray-200 border border-white/15 shadow-sm">
            {isMovie ? "Film" : "Dizi"}
          </span>

          {item.vote_average > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-400 text-xs font-bold shadow-sm">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{item.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Quick Watchlist Action Button */}
        <button
          onClick={toggleWatchlist}
          disabled={loading}
          title={inWatchlist ? "Listeden Çıkar" : "İzleme Listeme Ekle"}
          className={`absolute bottom-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md transition-all z-10 cursor-pointer ${
            inWatchlist
              ? "bg-red-600 text-white shadow-lg shadow-red-600/50 ring-2 ring-red-400/50"
              : "bg-black/70 text-gray-300 hover:text-white hover:bg-black/90 border border-white/15"
          }`}
        >
          {inWatchlist ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </Link>

      {/* Title & Metadata */}
      <div className="p-3.5 flex flex-col flex-1 justify-between bg-gradient-to-b from-transparent to-black/30">
        <Link href={detailUrl}>
          <h3 className="font-bold text-sm text-gray-100 group-hover:text-red-400 transition-colors line-clamp-1">
            {title}
          </h3>
        </Link>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-1.5">
          <span className="font-medium text-gray-400">{year || "—"}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-gray-300">
            1080p
          </span>
        </div>
      </div>
    </div>
  );
}
