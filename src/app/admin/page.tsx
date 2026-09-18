"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Film,
  Tv,
  PlusCircle,
  Trash2,
  Edit,
  ExternalLink,
  Search,
  Check,
  Star,
  Users,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Video,
  Languages,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface MediaItem {
  id: string;
  tmdbId?: number | null;
  mediaType: string;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath?: string | null;
  releaseYear?: string | null;
  voteAverage: number;
  genres: string;
  videoUrl?: string | null;
  dubUrl?: string | null;
  subUrl?: string | null;
  isFeatured: boolean;
  createdAt: string;
}

interface UserItem {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  isAdmin: boolean;
  createdAt: string;
  _count: {
    comments: number;
    ratings: number;
    watchedItems: number;
    watchlist: number;
  };
}

interface CommentItem {
  id: string;
  content: string;
  mediaType: string;
  tmdbId: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"media" | "users" | "comments">("media");

  // Media List & Form State
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"all" | "movie" | "tv">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [posterPath, setPosterPath] = useState("");
  const [overview, setOverview] = useState("");
  const [releaseYear, setReleaseYear] = useState("2024");
  const [voteAverage, setVoteAverage] = useState("8.0");
  const [genres, setGenres] = useState("Aksiyon, Dram");
  const [videoUrl, setVideoUrl] = useState("");
  const [dubUrl, setDubUrl] = useState("");
  const [subUrl, setSubUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  // Users & Comments State
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);

  // Notification
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // TMDB Canlı Otomatik Arama & 1-Tıkla Ekleme State'leri
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
  const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  const [importingTmdbId, setImportingTmdbId] = useState<number | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // TMDB'de Canlı Arama Yap
  const handleTmdbSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : tmdbSearchQuery).trim();
    if (!q) return;
    setIsSearchingTmdb(true);
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}&source=tmdb`);
      if (res.ok) {
        const data = await res.json();
        setTmdbSearchResults(data.results || []);
        if ((data.results || []).length === 0) {
          showNotification("Aramanızla eşleşen film veya dizi bulunamadı.", "error");
        }
      } else {
        showNotification("Arama sırasında hata oluştu.", "error");
      }
    } catch {
      showNotification("Sunucuya bağlanılamadı.", "error");
    } finally {
      setIsSearchingTmdb(false);
    }
  };

  // TMDB Sonucunu Tek Tıkla Siteye Ekle
  const handleQuickImport = async (item: any) => {
    setImportingTmdbId(item.id);
    try {
      const res = await fetch("/api/media/import-tmdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "single",
          tmdbId: item.id,
          mediaType: item.media_type || "movie",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || `"${item.title || item.name}" başarıyla eklendi!`, "success");
        setTmdbSearchResults((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, isAlreadyAdded: true } : r))
        );
        fetchMedia();
      } else {
        showNotification(data.error || "İçerik eklenemedi.", "error");
      }
    } catch {
      showNotification("Sunucu hatası oluştu.", "error");
    } finally {
      setImportingTmdbId(null);
    }
  };

  // Popüler 100+ İçeriği Toplu Aktar
  const handleBulkImport = async () => {
    if (!confirm("Popüler 100+ film ve diziyi otomatik olarak sitenize aktarmak istiyor musunuz? Bu işlem birkaç saniye sürebilir.")) {
      return;
    }
    setIsBulkImporting(true);
    try {
      const res = await fetch("/api/media/import-tmdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "bulk" }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || "Toplu aktarım başarıyla tamamlandı!", "success");
        fetchMedia();
      } else {
        showNotification(data.error || "Toplu aktarım başarısız oldu.", "error");
      }
    } catch {
      showNotification("Bağlantı hatası.", "error");
    } finally {
      setIsBulkImporting(false);
    }
  };

  // Tüm Film ve Dizileri Sıfırla
  const handleResetMedia = async () => {
    if (!confirm("DİKKAT: Sitedeki TÜM film ve dizileri, yorumları ve izleme kayıtlarını kalıcı olarak silmek istediğinize emin misiniz?")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/reset-media", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || "Tüm içerikler başarıyla temizlendi!", "success");
        fetchMedia();
      } else {
        showNotification(data.error || "Sıfırlama başarısız oldu.", "error");
      }
    } catch {
      showNotification("Bağlantı hatası oluştu.", "error");
    }
  };

  // Film ve Dizileri Çek
  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      const res = await fetch("/api/media?limit=200");
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMedia(false);
    }
  };

  // Kullanıcılar ve Yorumları Çek
  const fetchUsersAndComments = async () => {
    try {
      const [uRes, cRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/comments")]);
      if (uRes.ok) {
        const u = await uRes.json();
        setUsersList(u.users || []);
      }
      if (cRes.ok) {
        const c = await cRes.json();
        setCommentsList(c.comments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) {
      fetchMedia();
      fetchUsersAndComments();
    }
  }, [user]);

  // Formu Sıfırla
  const resetForm = () => {
    setTitle("");
    setMediaType("movie");
    setPosterPath("");
    setOverview("");
    setReleaseYear("2024");
    setVoteAverage("8.0");
    setGenres("Aksiyon, Dram");
    setVideoUrl("");
    setDubUrl("");
    setSubUrl("");
    setIsFeatured(false);
    setEditingItem(null);
  };

  // Düzenleme Modu Aç
  const openEditModal = (item: MediaItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setMediaType(item.mediaType as "movie" | "tv");
    setPosterPath(item.posterPath || "");
    setOverview(item.overview || "");
    setReleaseYear(item.releaseYear || "2024");
    setVoteAverage(item.voteAverage.toString());
    setGenres(item.genres || "Genel");
    setVideoUrl(item.videoUrl || "");
    setDubUrl(item.dubUrl || "");
    setSubUrl(item.subUrl || "");
    setIsFeatured(item.isFeatured);
    setIsAddModalOpen(true);
  };

  // Film/Dizi Kaydet (Ekle veya Güncelle)
  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !overview.trim()) {
      showNotification("Başlık ve açıklama zorunludur.", "error");
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        mediaType,
        posterPath:
          posterPath.trim() ||
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80",
        overview: overview.trim(),
        releaseYear: releaseYear.trim(),
        voteAverage: parseFloat(voteAverage) || 0,
        genres: genres.trim(),
        videoUrl: videoUrl.trim() || null,
        dubUrl: dubUrl.trim() || null,
        subUrl: subUrl.trim() || null,
        isFeatured,
      };

      if (editingItem) {
        // Güncelle (PATCH)
        const res = await fetch(`/api/media/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setMediaList((prev) => prev.map((m) => (m.id === editingItem.id ? data.item : m)));
          showNotification(`"${title}" başarıyla güncellendi!`);
          setIsAddModalOpen(false);
          resetForm();
        } else {
          showNotification("Güncelleme başarısız.", "error");
        }
      } else {
        // Yeni Ekle (POST)
        const res = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setMediaList((prev) => [data.item, ...prev]);
          showNotification(`"${title}" başarıyla siteye eklendi ve yayına alındı!`);
          setIsAddModalOpen(false);
          resetForm();
        } else {
          showNotification("Film eklenemedi.", "error");
        }
      }
    } catch {
      showNotification("Sunucu hatası oluştu.", "error");
    }
  };

  // Film/Dizi Sil (DELETE)
  const handleDeleteMedia = async (id: string, itemTitle: string) => {
    if (!confirm(`"${itemTitle}" içeriğini kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMediaList((prev) => prev.filter((m) => m.id !== id));
        showNotification(`"${itemTitle}" başarıyla silindi.`);
      } else {
        showNotification("Silinemedi.", "error");
      }
    } catch {
      showNotification("Bağlantı hatası.", "error");
    }
  };

  // Kullanıcı Sil
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
        showNotification("Kullanıcı silindi.");
      }
    } catch {
      showNotification("Silinemedi.", "error");
    }
  };

  // Yorum Sil
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Yorumu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/comments?id=${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setCommentsList((prev) => prev.filter((c) => c.id !== commentId));
        showNotification("Yorum silindi.");
      }
    } catch {
      showNotification("Silinemedi.", "error");
    }
  };

  // Filtrelenmiş ve Aranmış Film/Dizi Listesi
  const filteredMedia = mediaList.filter((item) => {
    if (mediaFilter !== "all" && item.mediaType !== mediaFilter) return false;
    if (mediaSearch.trim()) {
      const q = mediaSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.genres && item.genres.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const moviesCount = mediaList.filter((m) => m.mediaType === "movie").length;
  const seriesCount = mediaList.filter((m) => m.mediaType === "tv").length;

  if (isLoading) {
    return <div className="py-24 text-center text-gray-400">Yükleniyor...</div>;
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white">Yönetici Paneli</h1>
        <p className="text-xs text-gray-400">
          Bu yönetim paneline sadece sistem yöneticileri erişebilir.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-400 text-white shadow-lg shadow-red-600/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              CineTrack İçerik & Yönetim Merkezi
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Sitedeki filmleri, dizileri, videoları, dublaj linklerini ve üyeleri tam yetkiyle yönetin.
            </p>
          </div>
        </div>

        {notification && (
          <div
            className={`px-4 py-2 rounded-xl text-xs font-bold border shadow-xl flex items-center gap-2 ${
              notification.type === "success"
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                : "bg-red-950/80 text-red-300 border-red-500/40"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5">
        <button
          onClick={() => setActiveTab("media")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "media"
              ? "bg-red-600 text-white shadow-md shadow-red-600/30"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          <Film className="w-4 h-4 text-red-400" />
          <span>Film & Dizi Yönetimi ({mediaList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "users"
              ? "bg-red-600 text-white shadow-md shadow-red-600/30"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kullanıcılar ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("comments")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "comments"
              ? "bg-red-600 text-white shadow-md shadow-red-600/30"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Yorum Denetimi ({commentsList.length})</span>
        </button>
      </div>

      {/* TAB 1: FILM & DİZİ YÖNETİMİ (CRUD) */}
      {activeTab === "media" && (
        <div className="space-y-6">
          {/* ⚡ SİHİRLİ OTOMATİK DİZİ/FİLM BULUCU VE 1-TIKLA EKLEME */}
          <div className="bg-gradient-to-r from-red-950/40 via-[#16192b] to-purple-950/30 border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                    <Sparkles className="w-5 h-5 text-red-400" />
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    İsimle Otomatik Film & Dizi Ekle
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Otomatik Afiş, Özet & Video Linki
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Dizi veya film adını yazın; afişini, puanını, tüm bölümlerini ve izleme linklerini otomatik bulup tek tıkla sitenize eklesin!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
                {/* Toplu Aktar Butonu */}
                <button
                  onClick={handleBulkImport}
                  disabled={isBulkImporting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  title="IMDb ve TMDB'de en popüler 100+ içeriği otomatik veritabanına çeker"
                >
                  {isBulkImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-purple-400" />
                  )}
                  <span>{isBulkImporting ? "100+ İçerik Ekleniyor..." : "Popüler İçerikleri Yükle"}</span>
                </button>

                {/* Tüm İçerikleri Sıfırla Butonu */}
                <button
                  onClick={handleResetMedia}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-500/30 flex items-center gap-2 transition-all cursor-pointer"
                  title="Sitedeki tüm filmleri ve dizileri tamamen temizler"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Tümünü Sıfırla (Temizle)</span>
                </button>
              </div>
            </div>

            {/* Arama Input Alanı */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTmdbSearch();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  value={tmdbSearchQuery}
                  onChange={(e) => setTmdbSearchQuery(e.target.value)}
                  placeholder="Dizi veya film adı yazın (Örn: Dexter, Dark, Yalı Çapkını, Severance, Dune, Oppenheimer, Sherlock)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSearchingTmdb || !tmdbSearchQuery.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSearchingTmdb ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Aranıyor...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>TMDB'de Ara & Bul</span>
                  </>
                )}
              </button>
            </form>

            {/* Hızlı Örnek Aramalar */}
            {tmdbSearchResults.length === 0 && !isSearchingTmdb && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-400">
                <span>Hızlı Arama Örnekleri:</span>
                {["Dark", "Dexter", "Severance", "Breaking Bad", "Stranger Things", "Interstellar", "Shōgun", "The Boys"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setTmdbSearchQuery(tag);
                      handleTmdbSearch(tag);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Arama Sonuçları Listesi */}
            {tmdbSearchResults.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300">
                    Bulunan Sonuçlar ({tmdbSearchResults.length})
                  </span>
                  <button
                    onClick={() => {
                      setTmdbSearchResults([]);
                      setTmdbSearchQuery("");
                    }}
                    className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer"
                  >
                    Sonuçları Temizle ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
                  {tmdbSearchResults.map((resItem) => {
                    const isTv = resItem.media_type === "tv";
                    const resTitle = resItem.title || resItem.name || "İsimsiz";
                    const resYear = (resItem.release_date || resItem.first_air_date || "").split("-")[0];
                    const poster = resItem.poster_path
                      ? (resItem.poster_path.startsWith("http") ? resItem.poster_path : `https://image.tmdb.org/t/p/w200${resItem.poster_path}`)
                      : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80";
                    const isImportingThis = importingTmdbId === resItem.id;

                    return (
                      <div
                        key={resItem.id}
                        className="bg-black/40 border border-white/10 rounded-2xl p-3 flex gap-3 hover:border-white/20 transition-all"
                      >
                        <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-gray-900 shrink-0 border border-white/10">
                          <img src={poster} alt={resTitle} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                  isTv
                                    ? "bg-rose-600/20 text-rose-400 border border-rose-500/30"
                                    : "bg-red-600/20 text-red-400 border border-red-500/30"
                                }`}
                              >
                                {isTv ? "Dizi" : "Film"}
                              </span>
                              {resYear && <span className="text-[10px] text-gray-400 font-semibold">{resYear}</span>}
                              {resItem.vote_average ? (
                                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                                  {resItem.vote_average.toFixed(1)}
                                </span>
                              ) : null}
                            </div>

                            <h4 className="text-xs font-bold text-white truncate mt-1" title={resTitle}>
                              {resTitle}
                            </h4>
                            <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                              {resItem.overview || "Açıklama bulunmuyor."}
                            </p>
                          </div>

                          <div className="pt-2">
                            {resItem.isAlreadyAdded ? (
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Sitede Yayında
                                </span>
                                <Link
                                  href={isTv ? `/tv/${resItem.id}` : `/movie/${resItem.id}`}
                                  target="_blank"
                                  className="text-[10px] text-gray-400 hover:text-white underline flex items-center gap-0.5"
                                >
                                  İzle <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleQuickImport(resItem)}
                                disabled={isImportingThis}
                                className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isImportingThis ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Ekleniyor...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3" />
                                    <span>✨ Siteye Otomatik Ekle</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {/* Quick Stats & Add Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121420] p-5 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs text-gray-400 block">Kayıtlı Film</span>
                <span className="text-xl font-black text-white">{moviesCount}</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="text-xs text-gray-400 block">Kayıtlı Dizi</span>
                <span className="text-xl font-black text-rose-400">{seriesCount}</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="text-xs text-gray-400 block">Toplam İçerik</span>
                <span className="text-xl font-black text-emerald-400">{mediaList.length}</span>
              </div>
            </div>

            {/* Yeni Film/Dizi Ekle Butonu */}
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 hover:scale-105 transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Yeni Film veya Dizi Ekle</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                placeholder="Başlık veya türe göre ara..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMediaFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mediaFilter === "all" ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Tümü ({mediaList.length})
              </button>
              <button
                onClick={() => setMediaFilter("movie")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mediaFilter === "movie" ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Filmler ({moviesCount})
              </button>
              <button
                onClick={() => setMediaFilter("tv")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mediaFilter === "tv" ? "bg-rose-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Diziler ({seriesCount})
              </button>
            </div>
          </div>

          {/* Film & Dizi Listesi Tablosu */}
          <div className="bg-[#121420] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            {loadingMedia ? (
              <div className="py-20 text-center text-xs text-gray-400">İçerikler yükleniyor...</div>
            ) : filteredMedia.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <Film className="w-10 h-10 text-gray-600 mx-auto" />
                <p className="text-sm font-semibold text-gray-300">İçerik bulunamadı.</p>
                <p className="text-xs text-gray-500">Yeni bir film veya dizi ekleyebilirsiniz.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="text-[11px] uppercase tracking-wider text-gray-400 bg-black/40 border-b border-white/10">
                    <tr>
                      <th className="p-3.5">Afiş</th>
                      <th className="p-3.5">Başlık & Tür</th>
                      <th className="p-3.5">Yıl & Puan</th>
                      <th className="p-3.5">Video & Dublaj Linki</th>
                      <th className="p-3.5">Kategoriler</th>
                      <th className="p-3.5 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredMedia.map((item) => {
                      const isMovie = item.mediaType === "movie";
                      const detailUrl = isMovie
                        ? `/movie/${item.tmdbId || item.id}`
                        : `/tv/${item.tmdbId || item.id}`;

                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Afiş */}
                          <td className="p-3.5">
                            <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                              <img
                                src={item.posterPath}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </td>

                          {/* Başlık & Tür */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  isMovie
                                    ? "bg-red-600/20 text-red-400 border border-red-500/30"
                                    : "bg-rose-600/20 text-rose-400 border border-rose-500/30"
                                }`}
                              >
                                {isMovie ? "Film" : "Dizi"}
                              </span>
                              <span className="font-bold text-sm text-white">{item.title}</span>
                              {item.isFeatured && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                  ★ Vitrin
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                              {item.overview}
                            </p>
                          </td>

                          {/* Yıl & Puan */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="text-gray-300 font-semibold">{item.releaseYear || "—"}</span>
                            <div className="flex items-center gap-1 text-amber-400 font-bold mt-0.5">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{item.voteAverage ? item.voteAverage.toFixed(1) : "—"}</span>
                            </div>
                          </td>

                          {/* Video Linki Durumu */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              {item.videoUrl ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 text-[10px] font-semibold border border-emerald-800/30">
                                  <Video className="w-3 h-3" />
                                  Video Linki Var
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-gray-500 text-[10px]">
                                  Otomatik Sunucu
                                </span>
                              )}

                              {item.dubUrl && (
                                <span className="block text-[10px] text-amber-400 font-semibold">
                                  🇹🇷 Dublaj Tanımlı
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Kategoriler */}
                          <td className="p-3.5 text-[11px] text-gray-400 max-w-[150px] truncate">
                            {item.genres}
                          </td>

                          {/* Aksiyon Butonları (Gör, Düzenle, Sil) */}
                          <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                            <Link
                              href={detailUrl}
                              target="_blank"
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors inline-flex items-center"
                              title="Sitede Canlı İzle"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteMedia(item.id, item.title)}
                              className="p-2 rounded-xl bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white transition-colors inline-flex items-center cursor-pointer"
                              title="Siteden Kalıcı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KULLANICILAR */}
      {activeTab === "users" && (
        <div className="bg-[#121420] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white">Kayıtlı Kullanıcılar</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[11px] uppercase tracking-wider text-gray-400 bg-black/40 border-b border-white/10">
                <tr>
                  <th className="p-3">Kullanıcı</th>
                  <th className="p-3">E-Posta</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Kayıt Tarihi</th>
                  <th className="p-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-semibold text-white">{u.username}</td>
                    <td className="p-3 text-gray-400">{u.email}</td>
                    <td className="p-3">
                      {u.isAdmin ? (
                        <span className="px-2 py-0.5 rounded-md bg-red-600/30 text-red-400 font-bold text-[10px]">
                          Yönetici
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-[10px]">
                          Üye
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={u.id === user.id}
                        className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                        title="Kullanıcıyı Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: YORUMLAR */}
      {activeTab === "comments" && (
        <div className="bg-[#121420] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white">Yorum Denetimi</h3>
          {commentsList.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">Yorum bulunamadı.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {commentsList.map((c) => (
                <div key={c.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-semibold text-white text-xs">{c.user?.username}</span>
                    <p className="text-xs text-gray-300 mt-1">{c.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Yorumu Kaldır"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: YENİ FİLM / DİZİ EKLE VEYA DÜZENLE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121420] border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-red-500" />
                {editingItem ? "Filmi / Diziyi Düzenle" : "Siteye Yeni Film veya Dizi Ekle"}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕ Kapat
              </button>
            </div>

            <form onSubmit={handleSaveMedia} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Başlık <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: Inception, Kurtlar Vadisi vb."
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Medya Türü</label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as "movie" | "tv")}
                    className="w-full px-3.5 py-2.5 bg-[#121420] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="movie">Film</option>
                    <option value="tv">Dizi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Yıl</label>
                  <input
                    type="text"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    placeholder="Örn: 2024"
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Puan (1-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={voteAverage}
                    onChange={(e) => setVoteAverage(e.target.value)}
                    placeholder="Örn: 8.4"
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Türler</label>
                  <input
                    type="text"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    placeholder="Aksiyon, Bilim Kurgu vb."
                    className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Afiş Görsel URL</label>
                <input
                  type="url"
                  value={posterPath}
                  onChange={(e) => setPosterPath(e.target.value)}
                  placeholder="https://... (Poster görsel linki)"
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Açıklama / Konu Özeti <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  placeholder="Film veya dizinin konusu..."
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              {/* VIDEO LİNKLERİ BÖLÜMÜ */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Video className="w-4 h-4" />
                  Video & Yayın Linkleri (Google Drive, YouTube, MP4, Mixdrop, Embed)
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Ana Video / Oynatıcı Linki:
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... veya https://mixdrop.co/e/... veya https://...mp4"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Hangi linki yapıştırırsanız yapıştırın sistem otomatik tanır ve temiz oynatır.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      🇹🇷 Türkçe Dublaj Linki (Opsiyonel):
                    </label>
                    <input
                      type="text"
                      value={dubUrl}
                      onChange={(e) => setDubUrl(e.target.value)}
                      placeholder="Dublaj video bağlantısı..."
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      💬 Türkçe Altyazı Linki (Opsiyonel):
                    </label>
                    <input
                      type="text"
                      value={subUrl}
                      onChange={(e) => setSubUrl(e.target.value)}
                      placeholder="Altyazılı video bağlantısı..."
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-gray-700 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="featuredCheck" className="text-xs text-gray-300 cursor-pointer">
                  Anasayfada Öne Çıkar (Hero Banner Alanında Göster)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  {editingItem ? "Değişiklikleri Kaydet" : "Siteye Ekle ve Yayınla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
