"use client";

import { useState, useMemo, useEffect } from "react";
import { MediaItem } from "@/lib/tmdb";
import MediaCard from "@/components/MediaCard";
import { Search, Film, Tv, Sparkles, X } from "lucide-react";

interface SearchClientProps {
  initialItems: MediaItem[];
  initialQuery?: string;
}

export function normalizeTurkish(str: string): string {
  if (!str) return "";
  return str
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function filterMediaItems(items: MediaItem[], query: string): MediaItem[] {
  const trimmed = query.trim();
  if (!trimmed) return items;

  const normQuery = normalizeTurkish(trimmed);
  const tokens = normQuery.split(/\s+/).filter(Boolean);

  // 1. Title or original title match first
  const titleMatches = items.filter((item) => {
    const title = normalizeTurkish(item.title || item.name || "");
    const orig = normalizeTurkish(item.original_title || item.original_name || "");
    return tokens.every((token) => title.includes(token) || orig.includes(token));
  });

  if (titleMatches.length > 0) {
    return titleMatches;
  }

  // 2. Overview fallback
  return items.filter((item) => {
    const overview = normalizeTurkish(item.overview || "");
    return tokens.every((token) => overview.includes(token));
  });
}

export default function SearchClient({
  initialItems,
  initialQuery = "",
}: SearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");

  // Keep query in sync if initialQuery changes from navigation
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Query matched items
  const queryMatchedItems = useMemo(() => {
    return filterMediaItems(initialItems, query);
  }, [initialItems, query]);

  // Tab filter
  const filteredResults = useMemo(() => {
    if (filter === "all") return queryMatchedItems;
    return queryMatchedItems.filter((item) => item.media_type === filter);
  }, [queryMatchedItems, filter]);

  const movieCount = queryMatchedItems.filter((item) => item.media_type === "movie").length;
  const tvCount = queryMatchedItems.filter((item) => item.media_type === "tv").length;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inputVal = e.currentTarget.querySelector<HTMLInputElement>("input[name='q']")?.value;
    const currentQ = inputVal !== undefined ? inputVal : query;
    setQuery(currentQ);

    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const trimmed = currentQ.trim();
    if (typeof window !== "undefined") {
      const url = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search";
      window.history.replaceState(null, "", url);
    }
  };

  const handleClear = () => {
    setQuery("");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/search");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white">Film & Dizi Arama</h1>
        <p className="text-xs text-gray-400">
          Sitemizdeki dizi ve filmler arasında hızlıca arama yapın
        </p>

        {/* Standard GET form with onSubmit interception */}
        <form
          action="/search"
          method="GET"
          onSubmit={handleSubmit}
          className="relative flex items-center"
        >
          <Search className="w-5 h-5 absolute left-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Örn: The Mentalist, Breaking Bad, Ezel, Kurtlar..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="w-full pl-12 pr-28 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all text-sm shadow-inner"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-20 text-gray-400 hover:text-white p-1 rounded-full text-xs transition-colors cursor-pointer"
              aria-label="Aramayı temizle"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer active:scale-95"
          >
            Ara
          </button>
        </form>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-white text-black shadow-lg shadow-white/10"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            Tümü ({queryMatchedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("movie")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === "movie"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Filmler ({movieCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("tv")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === "tv"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            Diziler ({tvCount})
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-400 border-b border-white/5 pb-3">
          <span>
            {query.trim()
              ? `Arama Sonucu: ${filteredResults.length} içerik`
              : `Sitemizdeki İçerikler: ${filteredResults.length}`}
          </span>
          <span className="text-[11px] text-gray-500">
            Sadece sitemizde olan yapımlar
          </span>
        </div>

        {filteredResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredResults.map((item) => (
              <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
            ))}
          </div>
        ) : query.trim() ? (
          <div className="py-16 text-center text-gray-400 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-gray-600" />
            <p className="text-base font-semibold">Sitemizde &quot;{query}&quot; adında bir dizi veya film bulunamadı.</p>
            <p className="text-xs text-gray-500">
              Yalnızca SineTrack kütüphanesine eklenmiş olan içerikler aranmaktadır.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
