"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  History,
  Film,
  Tv,
  CheckCircle2,
  Trash2,
  Calendar,
  Play,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";

interface WatchedItem {
  id: string;
  mediaType: "movie" | "tv";
  tmdbId: number;
  title: string | null;
  posterPath: string | null;
  seasonNum: number | null;
  episodeNum: number | null;
  episodeTitle: string | null;
  watchedAt: string;
}

interface SeriesGroup {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  episodes: WatchedItem[];
}

export default function HistoryPage() {
  const { user, isLoading } = useAuth();
  const [items, setItems] = useState<WatchedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtreler: 'all' | 'movies' | 'tv'
  const [viewType, setViewType] = useState<"all" | "movies" | "tv">("tv");
  // Belirli bir diziye göre filtreleme (tmdbId veya 'all')
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("all");
  // Açık olan akordeon diziler
  const [expandedSeries, setExpandedSeries] = useState<Record<number, boolean>>({});

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/watched");
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
      fetchHistory();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [user, isLoading]);

  const removeWatched = async (item: WatchedItem) => {
    try {
      const res = await fetch("/api/watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: item.mediaType,
          tmdbId: item.tmdbId,
          seasonNum: item.seasonNum,
          episodeNum: item.episodeNum,
        }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAccordion = (tmdbId: number) => {
    setExpandedSeries((prev) => ({
      ...prev,
      [tmdbId]: !prev[tmdbId],
    }));
  };

  if (isLoading || loading) {
    return <div className="py-24 text-center text-sm text-gray-400">İzleme geçmişi yükleniyor...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <History className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">İzleme Geçmişiniz</h2>
        <p className="text-sm text-gray-400">
          İzlediğiniz film ve dizi bölümlerini görebilmek için giriş yapmalısınız.
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

  const movies = items.filter((i) => i.mediaType === "movie");
  const tvEpisodes = items.filter((i) => i.mediaType === "tv");

  // Dizilere göre gruplama
  const seriesMap: Record<number, SeriesGroup> = {};
  tvEpisodes.forEach((ep) => {
    if (!seriesMap[ep.tmdbId]) {
      seriesMap[ep.tmdbId] = {
        tmdbId: ep.tmdbId,
        title: ep.title || "Dizi",
        posterPath: ep.posterPath,
        episodes: [],
      };
    }
    seriesMap[ep.tmdbId].episodes.push(ep);
  });

  const seriesList = Object.values(seriesMap);

  // Seçili dizi filtresine göre filtreleme
  const filteredSeriesList =
    selectedSeriesId === "all"
      ? seriesList
      : seriesList.filter((s) => s.tmdbId.toString() === selectedSeriesId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">İzlediklerim & Bölüm Takibi</h1>
            <p className="text-xs text-gray-400 mt-1">
              Dizilere göre izlediğiniz tüm bölümleri filtreleyin ve takip edin
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-xs text-gray-400 block">Farklı Dizi</span>
            <span className="text-lg font-black text-rose-400">{seriesList.length}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-xs text-gray-400 block">İzlenen Bölüm</span>
            <span className="text-lg font-black text-emerald-400">{tvEpisodes.length}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-xs text-gray-400 block">İzlenen Film</span>
            <span className="text-lg font-black text-white">{movies.length}</span>
          </div>
        </div>
      </div>

      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121420] p-4 rounded-2xl border border-white/10 shadow-lg">
        {/* Type Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewType("tv")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewType === "tv"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Dizilere Göre Bölümler ({tvEpisodes.length})</span>
          </button>

          <button
            onClick={() => setViewType("movies")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewType === "movies"
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Filmler ({movies.length})</span>
          </button>
        </div>

        {/* Diziye Göre Filtreleme Dropdown'ı (Yalnızca Dizi sekmesindeyken) */}
        {viewType === "tv" && seriesList.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold text-gray-300">Dizi Filtrele:</span>
            <select
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="all" className="bg-[#121420]">
                Tüm Diziler ({seriesList.length})
              </option>
              {seriesList.map((s) => (
                <option key={s.tmdbId} value={s.tmdbId.toString()} className="bg-[#121420]">
                  {s.title} ({s.episodes.length} Bölüm)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* VIEW: TV SERIES GROUPED ACCORDION */}
      {viewType === "tv" && (
        <div className="space-y-4">
          {filteredSeriesList.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-[#121420] rounded-2xl border border-white/5">
              <Tv className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-base font-semibold text-gray-300">
                Henüz izlendi işaretli dizi bölümü bulunmuyor.
              </p>
              <p className="text-xs text-gray-500">
                Dizi detay sayfalarından izlediğiniz bölümlerin yanındaki tik simgesine tıklayarak buraya ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            filteredSeriesList.map((series) => {
              const isExpanded = expandedSeries[series.tmdbId] !== false; // Varsayılan açık
              return (
                <div
                  key={series.tmdbId}
                  className="bg-[#121420] border border-white/10 rounded-2xl overflow-hidden shadow-xl"
                >
                  {/* Dizi Başlık Kartı */}
                  <div
                    onClick={() => toggleAccordion(series.tmdbId)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-black shrink-0 shadow-md">
                        <img
                          src={getImageUrl(series.posterPath, "w500")}
                          alt={series.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-600/20 text-rose-400 border border-rose-500/20">
                            Dizi
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white truncate">
                            {series.title}
                          </h3>
                        </div>

                        <p className="text-xs text-emerald-400 font-semibold mt-1">
                          ✓ {series.episodes.length} Bölüm İzlendi
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        href={`/tv/${series.tmdbId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">Diziye Git</span>
                      </Link>

                      <div className="p-2 text-gray-400 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Bölümler Listesi Akordeon */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-white/5 bg-black/20 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        İzlenen Bölümler Listesi:
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {series.episodes
                          .sort((a, b) => {
                            if (a.seasonNum !== b.seasonNum) return (a.seasonNum || 0) - (b.seasonNum || 0);
                            return (a.episodeNum || 0) - (b.episodeNum || 0);
                          })
                          .map((ep) => (
                            <div
                              key={ep.id}
                              className="p-3 rounded-xl bg-[#0e1017] border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-colors"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-rose-300">
                                    S{ep.seasonNum} E{ep.episodeNum}
                                  </span>
                                  <span className="text-xs font-semibold text-gray-200 truncate">
                                    {ep.episodeTitle || `${ep.episodeNum}. Bölüm`}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-500 block mt-1">
                                  İşaretlendi: {new Date(ep.watchedAt).toLocaleDateString("tr-TR")}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Link
                                  href={`/tv/${series.tmdbId}`}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                                  title="Bölümü Oynat"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                </Link>

                                <button
                                  onClick={() => removeWatched(ep)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                  title="İzlendi İşaretini Kaldır"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW: MOVIES */}
      {viewType === "movies" && (
        <div className="space-y-3">
          {movies.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-[#121420] rounded-2xl border border-white/5">
              <Film className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-base font-semibold text-gray-300">
                Henüz izlendi olarak işaretlenmiş film bulunmuyor.
              </p>
            </div>
          ) : (
            movies.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#121420] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-black shrink-0">
                    <img
                      src={getImageUrl(item.posterPath, "w500")}
                      alt={item.title || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-600/20 text-red-400 border border-red-500/20">
                        Film
                      </span>
                      <Link
                        href={`/movie/${item.tmdbId}`}
                        className="font-bold text-sm text-gray-100 hover:text-red-400 transition-colors truncate"
                      >
                        {item.title || "Film"}
                      </Link>
                    </div>

                    <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      İşaretlenme: {new Date(item.watchedAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/movie/${item.tmdbId}`}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                    title="Filme Git"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </Link>
                  <button
                    onClick={() => removeWatched(item)}
                    title="İzlendi İşaretini Kaldır"
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
