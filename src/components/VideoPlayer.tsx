"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { EMBED_SERVERS, parseSmartVideoUrl, formatEpisodeUrl } from "@/lib/embed";
import { Season } from "@/lib/tmdb";
import { useAuth } from "@/context/AuthContext";
import {
  Server,
  RefreshCw,
  AlertCircle,
  Link as LinkIcon,
  Globe,
  Languages,
  Sparkles,
  PlusCircle,
  CheckCircle2,
  Tv,
  ExternalLink,
  Save,
  HelpCircle,
  Lightbulb,
  X,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward,
  List,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CustomSource {
  id: string;
  language: string;
  sourceName: string;
  url: string;
}

interface VideoPlayerProps {
  mediaType: "movie" | "tv";
  tmdbId?: number | null;
  season?: number;
  episode?: number;
  title: string;
  directVideoUrl?: string | null;
  dubUrl?: string | null;
  subUrl?: string | null;
  genres?: string;
  originalLanguage?: string;
  seasons?: Season[];
  onSelectEpisode?: (season: number, episode: number) => void;
}

export default function VideoPlayer({
  mediaType,
  tmdbId,
  season = 1,
  episode = 1,
  title,
  directVideoUrl,
  dubUrl,
  subUrl,
  genres,
  originalLanguage,
  seasons,
  onSelectEpisode,
}: VideoPlayerProps) {
  const { user } = useAuth();

  const isTurkish =
    originalLanguage === "tr" ||
    genres?.toLowerCase().includes("yerli") ||
    genres?.toLowerCase().includes("türk") ||
    directVideoUrl?.includes("youtube") ||
    dubUrl?.includes("youtube");

  // Dil tercihi: 'tr_dub' | 'tr_sub' | 'original'
  const [selectedLanguage, setSelectedLanguage] = useState<"tr_dub" | "tr_sub" | "original">(
    "tr_sub"
  );

  // isTurkish değiştiğinde modu ayarla (her zaman tr_sub ile başla)
  useEffect(() => {
    setSelectedLanguage("tr_sub");
  }, [isTurkish]);

  const [customSources, setCustomSources] = useState<CustomSource[]>([]);
  const [activeCustomSourceId, setActiveCustomSourceId] = useState<string | null>(null);

  // Genel sunucular
  const defaultServer = EMBED_SERVERS.find((s) => s.language === "tr_sub") || EMBED_SERVERS[0];
  const [activeServerId, setActiveServerId] = useState<string>(defaultServer.id);

  const [reloadKey, setReloadKey] = useState(0);
  const [customInputUrl, setCustomInputUrl] = useState("");
  const [useManualUrl, setUseManualUrl] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [showSubGuideModal, setShowSubGuideModal] = useState(false);
  const [showServersMenu, setShowServersMenu] = useState(false);
  const [drawerSelectedSeason, setDrawerSelectedSeason] = useState(season || 1);
  const [showSubGuide, setShowSubGuide] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Sezon değiştiğinde çekmece sezonunu eşitle
  useEffect(() => {
    setDrawerSelectedSeason(season || 1);
  }, [season]);

  const activeSeasonList = seasons?.filter((s) => s.season_number > 0) || seasons || [];
  const currentSeasonData = activeSeasonList.find((s) => s.season_number === season);
  const seasonEpisodeCount = currentSeasonData?.episode_count || 10;
  const hasPrevEpisode = episode > 1 || season > 1;

  const handlePrevEpisode = () => {
    if (!onSelectEpisode) return;
    if (episode > 1) {
      onSelectEpisode(season, episode - 1);
    } else if (season > 1) {
      const prevSeasonData = activeSeasonList.find((s) => s.season_number === season - 1);
      onSelectEpisode(season - 1, prevSeasonData?.episode_count || 1);
    }
  };

  const handleNextEpisode = () => {
    if (!onSelectEpisode) return;
    if (episode < seasonEpisodeCount) {
      onSelectEpisode(season, episode + 1);
    } else {
      const nextSeasonNum = season + 1;
      const nextSeasonExists = activeSeasonList.some((s) => s.season_number === nextSeasonNum);
      if (nextSeasonExists) {
        onSelectEpisode(nextSeasonNum, 1);
      } else {
        onSelectEpisode(season, episode + 1);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showEpisodeModal) {
          setShowEpisodeModal(false);
        } else if (showSubGuideModal) {
          setShowSubGuideModal(false);
        } else if (isCinemaMode) {
          setIsCinemaMode(false);
        }
      }
    };
    if (isCinemaMode || showEpisodeModal || showSubGuideModal) {
      document.body.classList.add("cinema-mode-active");
    } else {
      document.body.classList.remove("cinema-mode-active");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("cinema-mode-active");
    };
  }, [isCinemaMode, showEpisodeModal, showSubGuideModal]);

  // Dublaj linki ekleme formu
  const [newDubUrl, setNewDubUrl] = useState("");
  const [savingSource, setSavingSource] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Sezon ve bölüme göre dinamik link çözümlemeleri
  const dynamicDirectUrl = formatEpisodeUrl(directVideoUrl, { tmdbId, season, episode, mediaType, title });
  const dynamicDubUrl = formatEpisodeUrl(dubUrl, { tmdbId, season, episode, mediaType, title });
  const dynamicSubUrl = formatEpisodeUrl(subUrl, { tmdbId, season, episode, mediaType, title });

  // Veritabanındaki ve LocalStorage'daki ek kaynakları çek
  useEffect(() => {
    async function loadSources() {
      if (!tmdbId) return;
      let fetchedSources: CustomSource[] = [];
      try {
        const params = new URLSearchParams({
          mediaType,
          tmdbId: tmdbId.toString(),
        });
        if (mediaType === "tv") {
          params.set("seasonNum", season.toString());
          params.set("episodeNum", episode.toString());
        }

        const res = await fetch(`/api/sources?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          fetchedSources = data.sources || [];
        }
      } catch (err) {
        console.error("Sources fetch error:", err);
      }

      // Tarayıcı hafızasındaki (LocalStorage) yerel linki de yükle
      try {
        const localKey = `local_src_${mediaType}_${tmdbId}_${season}_${episode}`;
        const localVal = localStorage.getItem(localKey);
        if (localVal) {
          const parsed = JSON.parse(localVal);
          if (parsed && parsed.url && !fetchedSources.some((s) => s.url === parsed.url)) {
            fetchedSources.unshift(parsed);
          }
        }
      } catch (e) {}

      setCustomSources(fetchedSources);
    }
    loadSources();
  }, [mediaType, tmdbId, season, episode]);

  // Seçili dile ait genel sunucular
  const availableServersForLanguage = EMBED_SERVERS.filter((s) => s.language === selectedLanguage);
  const availableCustomSources = customSources.filter((s) => s.language === selectedLanguage);

  const currentGeneralServer =
    EMBED_SERVERS.find((s) => s.id === activeServerId && s.language === selectedLanguage) ||
    availableServersForLanguage[0] ||
    EMBED_SERVERS[0];

  const activeCustom = customSources.find((s) => s.id === activeCustomSourceId);

  // Oynatılacak ham URL'yi belirle
  let rawUrlToPlay = "";
  let activeSourceName = "";

  if (useManualUrl && customInputUrl) {
    rawUrlToPlay = customInputUrl;
    activeSourceName = "Manuel Girilen Link";
  } else if (activeCustom) {
    rawUrlToPlay = formatEpisodeUrl(activeCustom.url, { tmdbId, season, episode, mediaType, title });
    activeSourceName = activeCustom.sourceName;
  } else if (activeServerId.startsWith("atom-player") && (dynamicDubUrl?.includes("atom-embed") || dynamicDirectUrl?.includes("atom-embed"))) {
    rawUrlToPlay = dynamicDubUrl?.includes("atom-embed") ? dynamicDubUrl : (dynamicDirectUrl || "");
    activeSourceName = "⚡ Atom HD (FullHD TR Dublaj & Altyazı)";
  } else if (activeServerId.startsWith("atom-player") && mediaType === "tv") {
    rawUrlToPlay = currentGeneralServer.getUrl({
      mediaType,
      tmdbId: tmdbId || 0,
      season,
      episode,
      title,
    });
    activeSourceName = selectedLanguage === "tr_dub" ? "⚡ Dizipal & Dizilla (Türkçe Dublaj)" : "⚡ Dizipal & Dizilla (Türkçe Altyazılı)";
  } else if (currentGeneralServer) {
    rawUrlToPlay = currentGeneralServer.getUrl({
      mediaType,
      tmdbId: tmdbId || 0,
      season,
      episode,
      title,
    });
    activeSourceName = currentGeneralServer.name;
  } else if (selectedLanguage === "tr_dub" && dynamicDubUrl) {
    rawUrlToPlay = dynamicDubUrl;
    activeSourceName = "Özel Türkçe Dublaj";
  } else if (selectedLanguage === "tr_sub" && dynamicSubUrl) {
    rawUrlToPlay = dynamicSubUrl;
    activeSourceName = "Özel Türkçe Altyazı";
  } else if (dynamicDirectUrl) {
    rawUrlToPlay = dynamicDirectUrl;
    activeSourceName = "Tanımlı Video Linki";
  }

  // Akıllı URL çözümleyici (YouTube, Drive, MP4, iframe kodunu temizler)
  const { url: finalUrl, isDirectVideo } = parseSmartVideoUrl(rawUrlToPlay);

  const handleLanguageChange = (lang: "tr_dub" | "tr_sub" | "original") => {
    setSelectedLanguage(lang);
    setUseManualUrl(false);
    const customForLang = customSources.filter((s) => s.language === lang);
    if (customForLang.length > 0) {
      setActiveCustomSourceId(customForLang[0].id);
    } else {
      setActiveCustomSourceId(null);
      const server = EMBED_SERVERS.find((s) => s.language === lang);
      if (server) setActiveServerId(server.id);
    }
    setReloadKey((k) => k + 1);
  };

  // Özel Dublaj veya Video Linkini Kaydet
  const handleSaveCustomDub = async (playOnly = false) => {
    if (!newDubUrl.trim()) return;

    if (playOnly) {
      setCustomInputUrl(newDubUrl.trim());
      setUseManualUrl(true);
      setReloadKey((k) => k + 1);
      setSaveSuccessMsg("Video oynatıcıya yüklendi!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
      return;
    }

    setSavingSource(true);
    try {
      const sourceObj: CustomSource = {
        id: "local_" + Date.now(),
        language: "tr_dub",
        sourceName: "Özel Türkçe Dublaj",
        url: newDubUrl.trim(),
      };

      // 1. Tarayıcı hafızasına kaydet
      const localKey = `local_src_${mediaType}_${tmdbId}_${season}_${episode}`;
      localStorage.setItem(localKey, JSON.stringify(sourceObj));

      // 2. Eğer kullanıcı giriş yapmışsa veritabanına da kaydet
      if (user) {
        await fetch("/api/sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaType,
            tmdbId,
            seasonNum: mediaType === "tv" ? season : null,
            episodeNum: mediaType === "tv" ? episode : null,
            title,
            language: "tr_dub",
            sourceName: user.isAdmin ? "Onaylı Türkçe Dublaj" : "Kullanıcı Dublaj Linki",
            url: newDubUrl.trim(),
          }),
        });
      }

      setCustomSources((prev) => [sourceObj, ...prev]);
      setActiveCustomSourceId(sourceObj.id);
      setUseManualUrl(false);
      setReloadKey((k) => k + 1);
      setSaveSuccessMsg("Dublaj linki bu bölüm için başarıyla kaydedildi!");
      setNewDubUrl("");
      setTimeout(() => setSaveSuccessMsg(""), 5000);
    } catch (err) {
      console.error(err);
      setSaveSuccessMsg("Link yerel olarak kaydedildi.");
    } finally {
      setSavingSource(false);
    }
  };

  const hasDub = !!dubUrl || customSources.some((s) => s.language === "tr_dub");
  const hasSub = !!subUrl || customSources.some((s) => s.language === "tr_sub");

  // Arama sorguları
  const episodeQuery = `${title} ${season}. Sezon ${episode}. Bölüm`;
  const movieQuery = `${title} Full Film`;
  const targetQuery = mediaType === "tv" ? episodeQuery : movieQuery;

  const renderVideoContent = (isCinema = false) => (
    <div className={`relative aspect-video w-full bg-black ${isCinema ? "h-full max-h-full" : ""}`}>
      {isDirectVideo && finalUrl ? (
        <video
          key={`${finalUrl}-${season}-${episode}-${reloadKey}-${isCinema ? "cinema" : "normal"}`}
          src={finalUrl}
          controls
          autoPlay
          playsInline
          // @ts-ignore
          webkit-playsinline="true"
          x5-playsinline="true"
          className="w-full h-full object-contain"
        >
          Tarayıcınız video etiketini desteklemiyor.
        </video>
      ) : finalUrl ? (
        <iframe
          key={`${finalUrl}-${season}-${episode}-${reloadKey}-${isCinema ? "cinema" : "normal"}`}
          src={finalUrl}
          title={`${title} - Oynatıcı`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          // @ts-ignore
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <p className="text-sm font-semibold text-white">Bu içerik için henüz video linki atanmamış.</p>
          <p className="text-xs text-gray-500 max-w-md">
            Admin panelinden veya yukarıdaki &quot;Kendi Linkini Yapıştır&quot; butonuna basarak doğrudan bir video veya embed URL&apos;si yapıştırabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 1. TÜM MODLAR İÇİN EVRENSEL BÖLÜM SEÇİM MODALI */}
      {showEpisodeModal && mediaType === "tv" && onSelectEpisode && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setShowEpisodeModal(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] bg-[#0d0f1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 shrink-0">
                  <List className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{title}</h3>
                  <p className="text-xs text-amber-400 font-semibold">
                    Şu an oynatılıyor: {season}. Sezon {episode}. Bölüm
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEpisodeModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sezon Seçim Sekmeleri */}
            <div className="p-3 sm:p-4 border-b border-white/5 bg-black/30 overflow-x-auto flex items-center gap-2 no-scrollbar">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
                Sezon:
              </span>
              {activeSeasonList.map((s) => (
                <button
                  key={s.id || s.season_number}
                  type="button"
                  onClick={() => setDrawerSelectedSeason(s.season_number)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all active:scale-95 ${
                    drawerSelectedSeason === s.season_number
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/40"
                      : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                  }`}
                >
                  {s.name || `${s.season_number}. Sezon`}
                </button>
              ))}
            </div>

            {/* Bölümler Izgarası */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {Array.from(
                  {
                    length:
                      activeSeasonList.find((s) => s.season_number === drawerSelectedSeason)
                        ?.episode_count || 12,
                  },
                  (_, i) => i + 1
                ).map((epNum) => {
                  const isCurrent =
                    drawerSelectedSeason === season && epNum === episode;
                  return (
                    <button
                      key={epNum}
                      type="button"
                      onClick={() => {
                        onSelectEpisode(drawerSelectedSeason, epNum);
                        setShowEpisodeModal(false);
                      }}
                      className={`p-3.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border active:scale-95 ${
                        isCurrent
                          ? "bg-red-600 text-white border-red-500 ring-2 ring-red-400/50 shadow-lg shadow-red-600/40"
                          : "bg-white/5 hover:bg-red-950/30 hover:border-red-500/30 text-gray-200 border-white/10"
                      }`}
                    >
                      <span className="text-[10px] text-gray-400 font-medium">{drawerSelectedSeason}. Sezon</span>
                      <span className="text-sm sm:text-base font-black">{epNum}. Bölüm</span>
                      {isCurrent ? (
                        <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-tighter">Oynatılıyor</span>
                      ) : (
                        <span className="text-[9px] text-gray-500">İzle ▶</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-gray-400">
              <span>Bölüme tıkladığınızda video hemen güncellenir.</span>
              <button
                type="button"
                onClick={() => setShowEpisodeModal(false)}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EVRENSEL ALTYAZI VE SES REHBERİ MODALI */}
      {showSubGuideModal && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setShowSubGuideModal(false)}
        >
          <div
            className="w-full max-w-lg bg-[#0d0f1a] border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  {isTurkish ? "Türkçe Ses Bilgisi" : "💬 Türkçe Altyazı Nasıl Açılır?"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSubGuideModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isTurkish ? (
              <div className="text-xs text-gray-300 space-y-3">
                <p>
                  Bu yapım yerli bir Türk dizisi veya filmidir. Seslendirmesi orijinal olarak Türkçedir, yabancı altyazıya gerek yoktur.
                </p>
                {mediaType === "tv" && (
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title + " " + season + ". Sezon " + episode + ". Bölüm")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <span>YouTube&apos;da Bölümü Ara ↗</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs text-gray-300">
                <p className="text-gray-400 text-[11px]">
                  Yabancı içeriklerde oynatıcı üzerinden tek tıkla Türkçe altyazıyı açabilirsiniz:
                </p>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Sunucu 1 (VidLink Pro)</span>
                  </div>
                  <p className="text-gray-300 text-[11px] pl-3.5">
                    Video oynarken sağ alt köşedeki <strong className="text-amber-300 bg-white/10 px-1.5 py-0.5 rounded font-mono">[CC]</strong> butonuna tıklayın ve listeden <strong className="text-emerald-400">Turkish (Türkçe)</strong> seçin.
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Sunucu 2 (Videasy)</span>
                  </div>
                  <p className="text-gray-300 text-[11px] pl-3.5">
                    Video oynarken sağ alttaki <strong className="text-amber-300 bg-white/10 px-1.5 py-0.5 rounded font-mono">⚙️ Ayarlar</strong> simgesine tıklayın → <strong className="text-emerald-400">Altyazı (Subtitles)</strong> → <strong className="text-emerald-400">Türkçe</strong> seçeneğini aktif edin.
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Türkçe Dublaj İsterseniz</span>
                  </div>
                  <p className="text-gray-300 text-[11px] pl-3.5">
                    Oynatıcının üstündeki <strong className="text-amber-300">🇹🇷 Türkçe Dublaj</strong> butonuna tıklayarak dublajlı yayın kaynaklarına geçiş yapabilirsiniz.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSubGuideModal(false)}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Anladım, Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SİNEMA MODU: SABİT VE TAŞMAYAN TAM EKRAN TİYATRO SALONU */}
      {isCinemaMode && (
        <div
          className="fixed inset-0 z-50 bg-[#05060a]/98 backdrop-blur-2xl flex flex-col h-screen w-screen overflow-hidden animate-in fade-in duration-200"
        >
          {/* SİNEMA MODU ÜST KONTROL ÇUBUĞU */}
          <header className="shrink-0 w-full px-3 sm:px-6 py-2.5 bg-[#0c0e18]/95 border-b border-white/10 z-30 shadow-2xl flex flex-col gap-2">
            {/* Üst Satır: Başlık & Eylem Butonları */}
            <div className="flex items-center justify-between gap-2">
              {/* Sol: Başlık ve Rozet */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-black shrink-0">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>Sinema</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                  {title}
                </span>
                {mediaType === "tv" && (
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-amber-400 border border-amber-400/20 text-xs font-bold shrink-0 hidden sm:inline">
                    {season}. Sezon {episode}. Bölüm
                  </span>
                )}
              </div>

              {/* Masaüstü: Dil ve Dizi Bölüm Butonları (md ve üstü) */}
              <div className="hidden md:flex items-center gap-2">
                {/* Ses & Dil */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("tr_dub")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedLanguage === "tr_dub"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-600/40"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    🇹🇷 Dublaj
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("tr_sub")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedLanguage === "tr_sub"
                        ? "bg-red-600 text-white shadow-md shadow-red-600/40"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    💬 Altyazı
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("original")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedLanguage === "original"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/40"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    🌐 Orijinal
                  </button>
                </div>

                {/* Dizi İleri/Geri ve Bölümler */}
                {mediaType === "tv" && onSelectEpisode && (
                  <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={handlePrevEpisode}
                      disabled={!hasPrevEpisode}
                      className="px-2.5 py-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Önceki Bölüm"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                      <span>Önceki</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEpisodeModal(true)}
                      className="px-3 py-1 rounded-lg bg-red-600/30 border border-red-500/40 text-white hover:bg-red-600 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      title="Bölüm Seçim Listesi"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>S{season}:B{episode}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextEpisode}
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md shadow-red-600/30"
                      title="Sonraki Bölüm"
                    >
                      <span>Sonraki</span>
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Sağ: Rehber & Işıkları Aç Butonları */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSubGuideModal(true)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10 active:scale-95"
                  title="Altyazı ve Oynatıcı Rehberi"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Rehber</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCinemaMode(false);
                    setShowEpisodeModal(false);
                  }}
                  className="px-3 sm:px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Sinema Modundan Çık (ESC)"
                >
                  <Lightbulb className="w-4 h-4 fill-black text-black" />
                  <span className="hidden sm:inline">Işıkları Aç (ESC)</span>
                  <span className="sm:hidden">Kapat</span>
                </button>
              </div>
            </div>

            {/* Mobil Alt Kontrol Satırı (md altındaki ekranlarda her zaman görünür) */}
            <div className="md:hidden flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
              {/* Mobil Ses ve Dil Seçenekleri */}
              <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => handleLanguageChange("tr_dub")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
                    selectedLanguage === "tr_dub"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/40"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  🇹🇷 Dublaj
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange("tr_sub")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
                    selectedLanguage === "tr_sub"
                      ? "bg-red-600 text-white shadow-md shadow-red-600/40"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  💬 Altyazı
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange("original")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
                    selectedLanguage === "original"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/40"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  🌐 Orijinal
                </button>
              </div>

              {/* Mobil Dizi Bölüm Değiştirici */}
              {mediaType === "tv" && onSelectEpisode && (
                <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={handlePrevEpisode}
                    disabled={!hasPrevEpisode}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold cursor-pointer active:scale-95"
                    title="Önceki Bölüm"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEpisodeModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-red-600/30 border border-red-500/40 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Bölümleri Listele"
                  >
                    <List className="w-3 h-3 text-red-400" />
                    <span>S{season}:B{episode}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextEpisode}
                    className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-md shadow-red-600/30 active:scale-95"
                    title="Sonraki Bölüm"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* 2. SİNEMA SALONU ORTA SAHNESİ */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-4 md:p-6 relative overflow-hidden">
            <div className="relative w-full max-w-6xl max-h-[calc(100vh-140px)] aspect-video rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.95)] ring-2 ring-red-500/40 bg-black flex items-center justify-center">
              {renderVideoContent(true)}
            </div>
          </div>
        </div>
      )}

      {/* NORMAL SAYFA OYNATICI ALANI */}
      <div
        ref={playerContainerRef}
        className="bg-[#0d0f18] rounded-2xl overflow-hidden border border-white/10 shadow-2xl space-y-0"
      >
        {/* Dil & Mod Seçenekleri Üst Çubuğu */}
        <div className="px-4 py-3 bg-[#121422] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-gray-200">Ses & Dil Seçeneği:</span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* TÜRKÇE DUBLAJ */}
            <button
              type="button"
              onClick={() => handleLanguageChange("tr_dub")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedLanguage === "tr_dub"
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/40 ring-2 ring-amber-400/50"
                  : "bg-white/5 text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>🇹🇷 Türkçe Dublaj</span>
              {hasDub && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Özel Türkçe Dublaj Hazır" />
              )}
            </button>

            {/* TÜRKÇE ALTYAZILI */}
            <button
              type="button"
              onClick={() => handleLanguageChange("tr_sub")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedLanguage === "tr_sub"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/40 ring-2 ring-red-400/50"
                  : "bg-white/5 text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>💬 Türkçe Altyazılı</span>
              {hasSub && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Özel Türkçe Altyazı Hazır" />
              )}
            </button>

            {/* ORİJİNAL DİL */}
            <button
              type="button"
              onClick={() => handleLanguageChange("original")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedLanguage === "original"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40 ring-2 ring-purple-400/50"
                  : "bg-white/5 text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 Orijinal Dil</span>
            </button>
          </div>

          {/* Dizi İçin Oynatıcı İçi Hızlı Bölüm Değiştirici & Sinema Modu Butonları */}
          <div className="flex items-center gap-2 ml-auto">
            {mediaType === "tv" && onSelectEpisode && (
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={handlePrevEpisode}
                  disabled={!hasPrevEpisode}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
                  title="Önceki Bölüm"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowEpisodeModal(true)}
                  className="px-2.5 py-1 text-[11px] font-bold text-gray-200 hover:text-white hover:bg-red-600/30 border border-transparent hover:border-red-500/30 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="Bölümleri Aç"
                >
                  <List className="w-3.5 h-3.5 text-red-500" />
                  <span>S{season}:B{episode}</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextEpisode}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                  title="Sonraki Bölüm"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsCinemaMode(!isCinemaMode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isCinemaMode
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/40 ring-2 ring-amber-300 font-extrabold"
                  : "bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10"
              }`}
              title={isCinemaMode ? "Sinema modundan çık (ESC)" : "Sayfa ışıklarını kapat ve oynatıcıyı büyüt"}
            >
              <Lightbulb className={`w-3.5 h-3.5 ${isCinemaMode ? "fill-black text-black" : "text-amber-400"}`} />
              <span>{isCinemaMode ? "Işıkları Aç" : "🎬 Sinema Modu"}</span>
            </button>
          </div>
        </div>

      {/* Aktif Mod Rozeti */}
      <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            Aktif Mod:{" "}
            <strong className="text-white">
              {selectedLanguage === "tr_dub"
                ? "🇹🇷 Türkçe Dublaj"
                : selectedLanguage === "tr_sub"
                ? isTurkish
                  ? "🇹🇷 Yerli Yapım (Türkçe Ses)"
                  : "💬 Türkçe Altyazılı"
                : "🌐 Orijinal Dil"}
            </strong>
            {" • "}
            Oynatıcı: <strong className="text-amber-400">{activeSourceName || "Otomatik Sunucu"}</strong>
            {mediaType === "tv" && (
              <span className="text-red-400 font-bold ml-1">
                ({season}. Sezon {episode}. Bölüm)
              </span>
            )}
          </span>
        </div>

        {user?.isAdmin && (
          <Link
            href="/admin"
            className="text-xs text-red-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Admin: Bu Filme Özel Link / Dublaj Tanımla</span>
          </Link>
        )}
      </div>

      {/* Video Ekranı */}
      {renderVideoContent(false)}

      {/* Sunucu & Kaynak Seçim Çubuğu (Açılır / Kapanır) */}
      <div className="bg-[#121522] border-t border-white/10">
        {/* Üst Özet Başlık Çubuğu */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Server className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="text-gray-400 font-medium shrink-0">Kaynak:</span>
            <span className="font-bold text-white truncate">
              {useManualUrl
                ? "Özel Manuel Link"
                : activeCustomSourceId
                ? availableCustomSources.find((s) => s.id === activeCustomSourceId)?.sourceName
                : currentGeneralServer.name}
            </span>
            {!useManualUrl && !activeCustomSourceId && currentGeneralServer.badge && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                {currentGeneralServer.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Açılır / Kapanır Menü Butonu */}
            <button
              type="button"
              onClick={() => setShowServersMenu(!showServersMenu)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs"
            >
              <span>
                {showServersMenu
                  ? "Menüyü Gizle"
                  : `Kaynakları Değiştir (${availableServersForLanguage.length + availableCustomSources.length})`}
              </span>
              {showServersMenu ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Yenile Butonu */}
            <button
              type="button"
              onClick={() => setReloadKey((prev) => prev + 1)}
              title="Oynatıcıyı Yeniden Yükle"
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>
        </div>

        {/* Genişleyen Sunucu Listesi */}
        {showServersMenu && (
          <div className="px-4 pb-4 pt-2 border-t border-white/5 flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
            {/* Özel Kaynaklar */}
            {availableCustomSources.map((source) => {
              const isActive = !useManualUrl && activeCustomSourceId === source.id;
              return (
                <button
                  key={source.id}
                  onClick={() => {
                    setUseManualUrl(false);
                    setActiveCustomSourceId(source.id);
                    setReloadKey((k) => k + 1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/40"
                      : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{source.sourceName}</span>
                </button>
              );
            })}

            {/* Genel Türkçe Embed Sunucuları */}
            {availableServersForLanguage.map((server) => {
              const isActive =
                !useManualUrl &&
                !activeCustomSourceId &&
                currentGeneralServer.id === server.id;
              return (
                <button
                  key={server.id}
                  onClick={() => {
                    setUseManualUrl(false);
                    setActiveCustomSourceId(null);
                    setActiveServerId(server.id);
                    setReloadKey((k) => k + 1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-600/40 font-bold ring-1 ring-red-400"
                      : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5"
                  }`}
                >
                  <span>{server.name}</span>
                  {server.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold rounded bg-black/40 text-amber-300">
                      {server.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Manuel Link Girişi Butonu */}
            <button
              onClick={() => setUseManualUrl(!useManualUrl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                useManualUrl
                  ? "bg-amber-600 text-white shadow-md"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Kendi Linkini Yapıştır</span>
            </button>
          </div>
        )}
      </div>

      {/* Manuel Link Girişi Kutusu */}
      {useManualUrl && (
        <div className="px-4 py-3 bg-[#0d0f18] border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            placeholder="Google Drive, YouTube, MP4, Mixdrop veya iframe embed linki yapıştırın..."
            value={customInputUrl}
            onChange={(e) => setCustomInputUrl(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
          />
          <span className="text-[11px] text-gray-400 shrink-0">Otomatik dönüştürülür ve anında oynatılır</span>
        </div>
      )}

      {/* ALTYAZI VE OYNATICI REHBERİ */}
      <div className="border-t border-white/10 bg-[#090b14]/70">
        <button
          type="button"
          onClick={() => setShowSubGuide(!showSubGuide)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-gray-300">
              {isTurkish
                ? "🇹🇷 Yerli Yapım Ses Bilgisi"
                : "💬 Türkçe Altyazıyı Nasıl Açarım? (VidLink & Videasy Rehberi)"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <span>{showSubGuide ? "Gizle" : "Rehberi Göster"}</span>
            {showSubGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showSubGuide && (
          <div className="px-4 py-3 bg-black/40 border-t border-white/5 text-xs text-gray-300 space-y-2 animate-in fade-in duration-150">
            {isTurkish ? (
              <>
                <p className="text-gray-300">
                  Bu içerik bir Türk yapımıdır. Oynatıcıda ses Türkçedir. Altyazıya ihtiyaç duymazsınız.
                </p>
                {mediaType === "tv" && (
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title + " " + season + ". Sezon " + episode + ". Bölüm")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold transition-all"
                  >
                    <span>YouTube&apos;da Bu Bölümü Aç ↗</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-300">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <strong className="text-white block mb-0.5">● Sunucu 1 (VidLink Pro):</strong>
                  Video oynarken sağ alttaki <strong className="text-amber-300">[CC]</strong> butonuna basın →{" "}
                  <strong className="text-emerald-400">&quot;Turkish&quot;</strong> seçin.
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <strong className="text-white block mb-0.5">● Sunucu 2 (Videasy):</strong>
                  Video oynarken <strong className="text-amber-300">⚙️ Ayarlar</strong> simgesine tıklayın →{" "}
                  <strong className="text-emerald-400">&quot;Altyazı → Türkçe&quot;</strong> seçin.
                </div>
              </div>
            )}
          </div>
        )}
      </div>


    </div>
    </>
  );
}
