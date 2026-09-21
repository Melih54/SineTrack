"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Star, LucideIcon } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";

export interface ShelfItem {
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

interface MediaShelfProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconGradient?: string;
  iconColor?: string;
  items: ShelfItem[];
  viewAllHref?: string;
  badgeText?: string;
}

export default function MediaShelf({
  id,
  title,
  subtitle,
  icon: Icon,
  iconGradient = "from-red-600/20 to-orange-500/20",
  iconColor = "text-red-500",
  items,
  viewAllHref,
  badgeText,
}: MediaShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -460 : 460;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  if (!items || items.length === 0) return null;

  return (
    <section id={id} className="space-y-4 relative group">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl bg-gradient-to-br ${iconGradient} ${iconColor} border border-white/10 shadow-lg`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {title}
              </h2>
              {badgeText && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/10 text-gray-200 border border-white/15">
                  {badgeText}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-400 font-medium mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Actions: View All Link + Scroll Controls */}
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs font-bold text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              Tümünü Gör →
            </Link>
          )}

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
      </div>

      {/* Horizontal Scroll Shelf */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
      >
        {items.map((item, idx) => {
          const isMovie = item.mediaType === "movie";
          const itemId = item.tmdbId || item.id;
          const detailUrl = isMovie ? `/movie/${itemId}` : `/tv/${itemId}`;

          return (
            <Link
              key={item.id || idx}
              href={detailUrl}
              className="group/item relative w-36 sm:w-44 md:w-48 shrink-0 rounded-2xl overflow-hidden glass-card border border-white/10 hover:border-red-500/50 hover:shadow-[0_10px_30px_rgba(229,9,20,0.25)] hover:-translate-y-1.5 transition-all duration-300 block bg-[#0a0c14]"
            >
              {/* Poster Image Container */}
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                <img
                  src={getImageUrl(item.posterPath, "w500")}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500"
                />

                {/* Hover Play Button */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-black/40 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50 transform scale-75 group-hover/item:scale-100 transition-transform duration-300">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Top Badges */}
                <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none z-10">
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-md text-gray-200 border border-white/15">
                    {isMovie ? "Film" : "Dizi"}
                  </span>

                  {item.voteAverage > 0 && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      <span>{item.voteAverage.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Metadata Footer */}
              <div className="p-3 flex flex-col justify-between bg-gradient-to-b from-transparent to-black/40">
                <h4 className="font-bold text-xs sm:text-sm text-gray-100 group-hover/item:text-red-400 transition-colors truncate">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                  <span>{item.releaseYear || "—"}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/5 border border-white/10 text-gray-300">
                    1080p
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
