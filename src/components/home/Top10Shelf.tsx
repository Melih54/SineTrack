"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Star, Flame, Trophy } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";

export interface Top10Item {
  id: string | number;
  tmdbId?: number | null;
  title: string;
  posterPath: string;
  backdropPath?: string | null;
  mediaType: "movie" | "tv";
  voteAverage: number;
  releaseYear?: string | null;
  genres?: string;
}

interface Top10ShelfProps {
  items: Top10Item[];
}

export default function Top10Shelf({ items }: Top10ShelfProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const offset = direction === "left" ? -420 : 420;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (!items || items.length === 0) return null;

  const top10 = items.slice(0, 10);

  return (
    <section id="trending" className="space-y-4 relative group">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-600/20 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/10">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Bugün Türkiye'de Top 10
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm">
                Canlı
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              SineTrack izleyicilerinin şu anda en çok izlediği 10 yapım
            </p>
          </div>
        </div>

        {/* Desktop Arrow Controls */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white border border-white/10 transition-all cursor-pointer active:scale-90"
            title="Sola Kaydır"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white border border-white/10 transition-all cursor-pointer active:scale-90"
            title="Sağa Kaydır"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Shelf */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1"
      >
        {top10.map((item, index) => {
          const rank = index + 1;
          const isMovie = item.mediaType === "movie";
          const itemId = item.tmdbId || item.id;
          const detailUrl = isMovie ? `/movie/${itemId}` : `/tv/${itemId}`;

          return (
            <div
              key={item.id || index}
              className="relative flex items-center shrink-0 group/card cursor-pointer"
            >
              {/* Giant Rank Number (Netflix Styled) */}
              <div className="relative select-none pointer-events-none -mr-8 sm:-mr-10 z-0">
                <span
                  className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-none text-transparent"
                  style={{
                    WebkitTextStroke: "3px rgba(255, 255, 255, 0.25)",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    textShadow: "0 10px 30px rgba(0,0,0,0.8)",
                  }}
                >
                  {rank}
                </span>
              </div>

              {/* Poster Card */}
              <Link
                href={detailUrl}
                className="relative z-10 w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-2xl overflow-hidden glass-card border border-white/15 group-hover/card:border-red-500/60 group-hover/card:shadow-[0_12px_36px_rgba(229,9,20,0.35)] group-hover/card:-translate-y-2 transition-all duration-300 block bg-[#0a0c14]"
              >
                <img
                  src={getImageUrl(item.posterPath, "w500")}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                />

                {/* Dark Vignette & Hover Play */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08090e] via-black/30 to-transparent opacity-40 group-hover/card:opacity-90 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/50 transform scale-50 opacity-0 group-hover/card:scale-100 group-hover/card:opacity-100 transition-all duration-300">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Top Badges */}
                <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/80 backdrop-blur-md text-white border border-white/20">
                    {isMovie ? "Film" : "Dizi"}
                  </span>
                  {item.voteAverage > 0 && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{item.voteAverage.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Title & Res */}
                <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-[#08090e] via-[#08090e]/90 to-transparent pointer-events-none">
                  <h4 className="text-xs font-bold text-white truncate drop-shadow-md">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                    <span>{item.releaseYear || "2024"}</span>
                    <span className="px-1 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      4K UHD
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
