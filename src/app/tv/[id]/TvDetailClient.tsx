"use client";

import { useState, useEffect } from "react";
import { MediaDetail, getImageUrl } from "@/lib/tmdb";
import VideoPlayer from "@/components/VideoPlayer";
import EpisodeTracker from "@/components/EpisodeTracker";
import RatingStars from "@/components/RatingStars";
import CommentSection from "@/components/CommentSection";
import { useAuth } from "@/context/AuthContext";
import {
  Bookmark,
  Calendar,
  Tv,
  Users,
  Film,
  Play,
  Star,
  Info,
  Layers,
} from "lucide-react";

export default function TvDetailClient({ tv }: { tv: MediaDetail }) {
  const { user } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);

  // Watchlist durumunu getir
  useEffect(() => {
    if (!user) return;
    fetch(`/api/watchlist?mediaType=tv&tmdbId=${tv.id}`)
      .then((r) => r.json())
      .then((d) => setInWatchlist(d.inWatchlist))
      .catch(() => {});
  }, [tv.id, user]);

  const toggleWatchlist = async () => {
    if (!user) {
      alert("İzleme listenize eklemek için lütfen giriş yapın.");
      return;
    }

    setLoadingWatchlist(true);
    try {
      if (inWatchlist) {
        await fetch(`/api/watchlist?mediaType=tv&tmdbId=${tv.id}`, { method: "DELETE" });
        setInWatchlist(false);
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaType: "tv",
            tmdbId: tv.id,
            title: tv.name || "Dizi",
            posterPath: tv.poster_path,
            voteAverage: tv.vote_average,
          }),
        });
        setInWatchlist(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWatchlist(false);
    }
  };

  const handleSelectEpisode = (season: number, episode: number) => {
    setCurrentSeason(season);
    setCurrentEpisode(episode);
    // Yalnızca sinema modu aktif DEĞİLSE sayfayı oynatıcıya kaydır
    if (typeof document !== "undefined" && !document.body.classList.contains("cinema-mode-active")) {
      const el = document.getElementById("player-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const scrollToPlayer = () => {
    const el = document.getElementById("player-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const year = tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : null;

  return (
    <div className="min-h-screen pb-20 space-y-12">
      {/* 1. CINEMATIC HERO SHOWCASE BANNER */}
      <div className="relative w-full overflow-hidden bg-[#06070b]">
        {/* Backdrop Image with Layered Vignettes */}
        <div className="absolute inset-0 h-[500px] sm:h-[600px] w-full">
          <img
            src={getImageUrl(tv.backdrop_path || tv.poster_path, "original")}
            alt={tv.name}
            className="w-full h-full object-cover object-center opacity-40 filter blur-[1px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090e] via-[#08090e]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090e] via-[#08090e]/60 to-transparent" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#08090e]/30 to-[#08090e]/90" />
        </div>

        {/* Hero Content Container */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16 pb-12 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-end">
          {/* Floating TV Poster (Mobile & Desktop) */}
          <div className="relative w-32 sm:w-56 md:w-64 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/20 group">
            <img
              src={getImageUrl(tv.poster_path, "w500")}
              alt={tv.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
              <button
                onClick={scrollToPlayer}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-red-600/40 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Oynatıcıya Git</span>
              </button>
            </div>
          </div>

          {/* Details & Action Buttons */}
          <div className="flex-1 space-y-4 max-w-3xl">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-rose-600/30">
                Dizi
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-black/60 border border-white/10 text-gray-200 text-xs font-bold backdrop-blur-md">
                1080p Full HD
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" />
                {tv.vote_average ? tv.vote_average.toFixed(1) : "8.2"} TMDB
              </span>
              {year && (
                <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold">
                  {year}
                </span>
              )}
              {tv.number_of_seasons && (
                <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold flex items-center gap-1">
                  <Layers className="w-3 h-3 text-rose-400" />
                  {tv.number_of_seasons} Sezon
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-xl leading-tight">
              {tv.name}
            </h1>

            {/* Genres */}
            {tv.genres && tv.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {tv.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 transition-colors"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={scrollToPlayer}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl shadow-xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Hemen İzle ({currentSeason}. Sezon {currentEpisode}. Bölüm)</span>
              </button>

              <button
                onClick={toggleWatchlist}
                disabled={loadingWatchlist}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                  inWatchlist
                    ? "bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30"
                    : "glass-panel text-gray-200 hover:text-white hover:bg-white/10 border-white/10"
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>{inWatchlist ? "Listemden Çıkar" : "İzleme Listeme Ekle"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. VIDEO PLAYER & STREAM SECTION */}
      <div id="player-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              {tv.name} — {currentSeason}. Sezon {currentEpisode}. Bölüm
            </h2>
          </div>
          <span className="text-xs text-gray-400 hidden sm:inline">
            Sinema Modu açıkken doğrudan sonraki bölüme geçebilirsiniz.
          </span>
        </div>

        <VideoPlayer
          mediaType="tv"
          tmdbId={tv.id}
          season={currentSeason}
          episode={currentEpisode}
          title={tv.name || "Dizi"}
          directVideoUrl={(tv as any).videoUrl}
          dubUrl={(tv as any).dubUrl}
          subUrl={(tv as any).subUrl}
          genres={tv.genres?.map((g) => g.name).join(", ") || (tv as any).genres}
          originalLanguage={(tv as any).original_language || (tv as any).originalLanguage}
          seasons={tv.seasons}
          onSelectEpisode={handleSelectEpisode}
        />
      </div>

      {/* 3. EPISODES, DETAILS & SIDEBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Episode Tracker Component */}
            {tv.seasons && tv.seasons.length > 0 && (
              <EpisodeTracker
                tvId={tv.id}
                tvTitle={tv.name || "Dizi"}
                posterPath={tv.poster_path}
                seasons={tv.seasons}
                currentSeason={currentSeason}
                currentEpisode={currentEpisode}
                onSelectEpisode={handleSelectEpisode}
              />
            )}

            {/* Overview Card */}
            <div className="glass-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-rose-500" />
                <span>Dizi Hakkında</span>
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed font-normal">
                {tv.overview || "Bu dizi için henüz özet bilgisi eklenmedi."}
              </p>
            </div>

            {/* Cast Carousel */}
            {tv.credits?.cast && tv.credits.cast.length > 0 && (
              <div className="glass-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-500" />
                  <span>Oyuncular & Karakterler</span>
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {tv.credits.cast.slice(0, 10).map((actor) => (
                    <div key={actor.id} className="w-24 shrink-0 text-center space-y-1.5 group">
                      <div className="w-18 h-18 mx-auto rounded-2xl overflow-hidden bg-black/50 border border-white/10 group-hover:border-rose-500/50 group-hover:scale-105 transition-all shadow-md">
                        <img
                          src={getImageUrl(actor.profile_path, "w500")}
                          alt={actor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-bold text-gray-200 group-hover:text-rose-400 transition-colors truncate">
                        {actor.name}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {actor.character}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Rating & Comments */}
          <div className="space-y-6">
            <RatingStars
              mediaType="tv"
              tmdbId={tv.id}
              title={tv.name || "Dizi"}
              posterPath={tv.poster_path}
              tmdbVoteAverage={tv.vote_average}
            />

            {/* Quick TV Info Card */}
            <div className="glass-card border border-white/10 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
              <h4 className="font-bold text-white border-b border-white/10 pb-2">
                Dizi Detayları
              </h4>
              <div className="space-y-2 text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">İlk Yayın:</span>
                  <span className="font-semibold text-white">{year || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sezon Sayısı:</span>
                  <span className="font-semibold text-white">{tv.number_of_seasons || 1} Sezon</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Çözünürlük:</span>
                  <span className="font-bold text-emerald-400">1080p Full HD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ses & Altyazı:</span>
                  <span className="font-semibold text-amber-400">TR Dublaj & Altyazı</span>
                </div>
              </div>
            </div>

            <CommentSection mediaType="tv" tmdbId={tv.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
