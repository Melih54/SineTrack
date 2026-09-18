"use client";

import { useState, useEffect, useRef } from "react";
import { Episode, Season, getImageUrl } from "@/lib/tmdb";
import { Check, Play, CheckCircle2, Circle, Clock, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface EpisodeTrackerProps {
  tvId: number;
  tvTitle: string;
  posterPath?: string | null;
  seasons: Season[];
  currentSeason: number;
  currentEpisode: number;
  onSelectEpisode: (season: number, episode: number) => void;
}

interface WatchedRecord {
  id: string;
  seasonNum: number | null;
  episodeNum: number | null;
}

export default function EpisodeTracker({
  tvId,
  tvTitle,
  posterPath,
  seasons,
  currentSeason,
  currentEpisode,
  onSelectEpisode,
}: EpisodeTrackerProps) {
  const { user } = useAuth();
  const [selectedSeason, setSelectedSeason] = useState<number>(currentSeason || 1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [watchedList, setWatchedList] = useState<WatchedRecord[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [seasonEpisodesCount, setSeasonEpisodesCount] = useState<Record<number, number>>({});
  const seasonsScrollRef = useRef<HTMLDivElement>(null);
  const [wrapSeasons, setWrapSeasons] = useState(false);

  const scrollSeasons = (offset: number) => {
    if (seasonsScrollRef.current) {
      seasonsScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Dışarıdan currentSeason değiştiğinde senkronize et
  useEffect(() => {
    if (currentSeason && currentSeason !== selectedSeason) {
      setSelectedSeason(currentSeason);
    }
  }, [currentSeason]);

  // Normal sezonları filtrele (Sezon 0 genelde özel bölümlerdir, listeye sonradan eklenebilir)
  const regularSeasons = seasons.filter((s) => s.season_number > 0);
  const activeSeasonsList = regularSeasons.length > 0 ? regularSeasons : seasons;

  // İzlenen bölümleri çek
  const fetchWatched = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/watched?mediaType=tv&tmdbId=${tvId}`);
      if (res.ok) {
        const data = await res.json();
        setWatchedList(data.watched || []);
      }
    } catch (err) {
      console.error("Error fetching watched episodes:", err);
    }
  };

  // Sezon bölümlerini çek
  const fetchEpisodes = async (seasonNum: number) => {
    setLoadingEpisodes(true);
    try {
      const res = await fetch(`/api/tmdb/episodes?tvId=${tvId}&season=${seasonNum}`);
      if (res.ok) {
        const data = await res.json();
        const eps = data.episodes || [];
        setEpisodes(eps);
        if (eps.length > 0) {
          setSeasonEpisodesCount((prev) => ({ ...prev, [seasonNum]: eps.length }));
        }
      }
    } catch (err) {
      console.error("Error fetching episodes:", err);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  useEffect(() => {
    fetchWatched();
  }, [tvId, user]);

  useEffect(() => {
    fetchEpisodes(selectedSeason);
  }, [tvId, selectedSeason]);

  const toggleWatched = async (ep: Episode, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      alert("Bölümleri izlendi olarak işaretlemek için lütfen giriş yapın.");
      return;
    }

    try {
      const res = await fetch("/api/watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: "tv",
          tmdbId: tvId,
          seasonNum: ep.season_number,
          episodeNum: ep.episode_number,
          title: tvTitle,
          posterPath,
          episodeTitle: ep.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.watched) {
          setWatchedList((prev) => [
            ...prev,
            { id: data.item.id, seasonNum: ep.season_number, episodeNum: ep.episode_number },
          ]);
        } else {
          setWatchedList((prev) =>
            prev.filter(
              (item) =>
                !(item.seasonNum === ep.season_number && item.episodeNum === ep.episode_number)
            )
          );
        }
      }
    } catch (err) {
      console.error("Error toggling watched status:", err);
    }
  };

  // Bu sezondaki izlenen bölüm sayısı
  const watchedInThisSeason = episodes.filter((ep) =>
    watchedList.some(
      (w) => w.seasonNum === ep.season_number && w.episodeNum === ep.episode_number
    )
  ).length;

  const progressPercent =
    episodes.length > 0 ? Math.round((watchedInThisSeason / episodes.length) * 100) : 0;

  return (
    <div className="bg-[#121420] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Bölüm & Sezon Takibi
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            İzlediğiniz bölümleri işaretleyin, dizi ilerlemenizi otomatik takip edin.
          </p>
        </div>

        {/* Progress bar */}
        {user && episodes.length > 0 && (
          <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-xl border border-white/5">
            <div className="text-right">
              <span className="text-xs font-bold text-gray-200">
                {watchedInThisSeason} / {episodes.length} Bölüm
              </span>
              <span className="text-[10px] text-emerald-400 block font-semibold">
                %{progressPercent} Tamamlandı
              </span>
            </div>
            <div className="w-20 bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Season Buttons Bar with Left/Right Arrows & Wrap Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-300">Sezonlar:</span>
            <span className="text-[11px] text-gray-500">
              (Toplam {activeSeasonsList.length} Sezon)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tüm Sezonları Aç/Kapat (Izgara Modu) */}
            <button
              type="button"
              onClick={() => setWrapSeasons(!wrapSeasons)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1 cursor-pointer ${
                wrapSeasons
                  ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30"
                  : "bg-white/5 text-gray-400 hover:text-white border-white/10"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{wrapSeasons ? "Tek Satır Yap" : "Tüm Sezonları Göster (Alt Alta)"}</span>
            </button>

            {/* Sol / Sağ Kaydırma Okları */}
            {!wrapSeasons && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollSeasons(-250)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-600 text-gray-300 hover:text-white transition-colors border border-white/10 cursor-pointer"
                  title="Önceki Sezonlara Kaydır"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollSeasons(250)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-600 text-gray-300 hover:text-white transition-colors border border-white/10 cursor-pointer"
                  title="Sonraki Sezonlara Kaydır"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sezon Butonları Listesi */}
        <div
          ref={seasonsScrollRef}
          onWheel={(e) => {
            if (!wrapSeasons && seasonsScrollRef.current && e.deltaY !== 0) {
              seasonsScrollRef.current.scrollLeft += e.deltaY;
            }
          }}
          className={`flex items-center gap-2 pb-2.5 transition-all ${
            wrapSeasons
              ? "flex-wrap"
              : "overflow-x-auto scroll-smooth no-scrollbar scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-red-500"
          }`}
        >
          {activeSeasonsList.map((season) => {
            const isSelected = selectedSeason === season.season_number;
            return (
              <button
                key={season.id}
                onClick={() => setSelectedSeason(season.season_number)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105"
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                <span>{season.name || `${season.season_number}. Sezon`}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-black/40 text-[10px] text-gray-300">
                  {seasonEpisodesCount[season.season_number] || season.episode_count || 10} Bölüm
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Episode Cards Grid */}
      {loadingEpisodes ? (
        <div className="py-12 text-center text-sm text-gray-400">Bölümler yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {episodes.map((ep) => {
            const isWatched = watchedList.some(
              (w) => w.seasonNum === ep.season_number && w.episodeNum === ep.episode_number
            );
            const isPlaying =
              currentSeason === ep.season_number && currentEpisode === ep.episode_number;

            return (
              <div
                key={ep.id}
                onClick={() => onSelectEpisode(ep.season_number, ep.episode_number)}
                className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 border flex gap-3.5 relative ${
                  isPlaying
                    ? "bg-red-950/20 border-red-500/50 shadow-lg shadow-red-950/30"
                    : isWatched
                    ? "bg-[#0f121a]/80 border-emerald-900/30 hover:border-emerald-500/40"
                    : "bg-[#0e1017] border-white/5 hover:border-white/15"
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-black/60 shrink-0">
                  <img
                    src={getImageUrl(ep.still_path, "w500")}
                    alt={ep.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                  <span className="absolute bottom-1 right-1 text-[10px] font-bold px-1 rounded bg-black/70 text-gray-200">
                    Bölüm {ep.episode_number}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0 pr-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-200 group-hover:text-red-400 transition-colors line-clamp-1">
                      {ep.episode_number}. {ep.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                      {ep.overview || "Bu bölüm için henüz detaylı özet girilmedi."}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-2">
                    {ep.air_date && <span>{ep.air_date}</span>}
                    {isPlaying && (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        ● Şimdi Oynatılıyor
                      </span>
                    )}
                  </div>
                </div>

                {/* Watch Checkbox Button */}
                <button
                  type="button"
                  onClick={(e) => toggleWatched(ep, e)}
                  title={isWatched ? "İzlendi işaretini kaldır" : "İzlendi olarak işaretle"}
                  className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                    isWatched
                      ? "text-emerald-400 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-600/30"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {isWatched ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
