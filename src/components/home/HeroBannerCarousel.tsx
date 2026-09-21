"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Play, Info, Star, Sparkles, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";

export interface HeroMediaItem {
  id: string | number;
  tmdbId?: number | null;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath?: string | null;
  mediaType: "movie" | "tv";
  voteAverage: number;
  releaseYear?: string | null;
  genres?: string;
}

interface HeroBannerCarouselProps {
  items: HeroMediaItem[];
}

export default function HeroBannerCarousel({ items }: HeroBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = items.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-advance timer (6.5 seconds)
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused, total, nextSlide]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex] || items[0];
  const isMovie = current.mediaType === "movie";
  const itemId = current.tmdbId || current.id;
  const detailLink = isMovie ? `/movie/${itemId}` : `/tv/${itemId}`;

  // Parse genres to array
  const genreList = current.genres
    ? current.genres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean)
        .slice(0, 3)
    : ["Popüler", isMovie ? "Film" : "Dizi"];

  return (
    <div
      className="relative w-full h-[70vh] sm:h-[78vh] min-h-[520px] max-h-[820px] overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (diff > 50) nextSlide();
        if (diff < -50) prevSlide();
        touchStartX.current = null;
      }}
    >
      {/* Background Images with Cross-fade Transition */}
      {items.map((item, idx) => {
        const isActive = idx === currentIndex;
        const bgUrl = item.backdropPath
          ? getImageUrl(item.backdropPath, "original")
          : getImageUrl(item.posterPath, "original");

        return (
          <div
            key={item.id || idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <img
              src={bgUrl}
              alt={item.title}
              className={`w-full h-full object-cover object-center transition-transform duration-10000 ease-out ${
                isActive ? "scale-105" : "scale-100"
              }`}
            />
          </div>
        );
      })}

      {/* Multi-layered Cinematic Overlays */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {/* Bottom Fade to Dark Surface */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090e] via-[#08090e]/65 to-transparent" />
        {/* Left Shadow for High Contrast Typography */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090e]/95 via-[#08090e]/60 to-transparent" />
        {/* Top Vignette for Navbar Visibility */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#08090e]/80 to-transparent" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-30 max-w-7xl mx-auto h-full flex flex-col justify-end px-4 sm:px-6 lg:px-8 pb-14 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-4 max-w-2xl">
            {/* Top Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/25 border border-red-500/40 text-red-400 text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg shadow-red-600/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SineTrack Özel</span>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold backdrop-blur-md">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{current.voteAverage > 0 ? current.voteAverage.toFixed(1) : "8.5"}</span>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-gray-200 backdrop-blur-md">
                {current.releaseYear || "2024"}
              </span>

              <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                4K UHD
              </span>

              <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-white/10 text-white border border-white/20">
                🇹🇷 Dublaj & Altyazı
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-2xl leading-[1.1] animate-in fade-in slide-in-from-bottom-3 duration-500">
              {current.title}
            </h1>

            {/* Genre Pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-300 font-medium">
              {genreList.map((genre, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300"
                >
                  {genre}
                </span>
              ))}
              <span className="text-gray-500">•</span>
              <span className="text-gray-400">
                {isMovie ? "Sinema Filmi" : "Dizi Serisi"}
              </span>
            </div>

            {/* Overview / Synopsis */}
            <p className="text-sm sm:text-base text-gray-200/90 line-clamp-3 leading-relaxed drop-shadow-md max-w-xl font-normal">
              {current.overview ||
                "Soluksuz izleyeceğiniz yüksek prodüksiyonlu sürükleyici bir yapım. SineTrack ile 4K ve çift ses seçeneğiyle hemen keşfedin."}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                href={detailLink}
                className="flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white ml-0.5" />
                <span>Hemen İzle</span>
              </Link>

              <Link
                href={detailLink}
                className="flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-200 cursor-pointer"
              >
                <Info className="w-5 h-5" />
                <span>Detaylar & Bölümler</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Thumbnail Selector Cards (Desktop) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-2.5 items-end justify-end">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Öne Çıkanlar ({currentIndex + 1}/{total})</span>
            </span>

            <div className="space-y-2 w-full max-w-xs">
              {items.map((item, idx) => {
                const isSelected = idx === currentIndex;
                const thumb = item.backdropPath
                  ? getImageUrl(item.backdropPath, "w500")
                  : getImageUrl(item.posterPath, "w500");

                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white/15 border-l-4 border-red-500 backdrop-blur-xl shadow-lg ring-1 ring-white/20"
                        : "bg-black/40 hover:bg-white/10 border-l-4 border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="relative w-14 h-9 rounded-lg overflow-hidden shrink-0 bg-black/60">
                      <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 fill-white text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <span className="text-amber-400 font-bold">★ {item.voteAverage.toFixed(1)}</span>
                        <span>•</span>
                        <span>{item.releaseYear || "2024"}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Carousel Indicators / Nav Arrows for Mobile & Tablet */}
        <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
          {/* Progress Dots */}
          <div className="flex items-center gap-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                title={`${idx + 1}. başlığa geç`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? "w-8 h-2 bg-red-600 shadow-md shadow-red-600/50"
                    : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          {/* Arrow Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white border border-white/10 transition-all cursor-pointer active:scale-90"
              title="Önceki Başlık"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white border border-white/10 transition-all cursor-pointer active:scale-90"
              title="Sonraki Başlık"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
