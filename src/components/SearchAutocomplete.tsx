"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Film, Tv, Star, X, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { MediaItem, getImageUrl } from "@/lib/tmdb";

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
  onSelect?: () => void;
  autoFocus?: boolean;
}

export default function SearchAutocomplete({
  placeholder = "Film veya dizi ara...",
  className = "",
  onSelect,
  autoFocus = false,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results?.slice(0, 6) || []);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      goToItem(suggestions[selectedIndex]);
      return;
    }

    if (query.trim()) {
      setIsOpen(false);
      if (onSelect) onSelect();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const goToItem = (item: MediaItem) => {
    setIsOpen(false);
    setQuery("");
    if (onSelect) onSelect();
    const isMovie = item.media_type === "movie" || !item.name;
    const path = isMovie ? `/movie/${item.id}` : `/tv/${item.id}`;
    router.push(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} action="javascript:void(0);" className="relative flex items-center w-full">
        <Search className="w-4 h-4 absolute left-3.5 text-gray-400 pointer-events-none transition-colors group-focus-within:text-red-500" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-9 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all shadow-inner"
        />

        {/* Clear or loading spinner button */}
        <div className="absolute right-3 flex items-center">
          {loading ? (
            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="text-gray-400 hover:text-white p-0.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Not found feedback */}
      {isOpen && query.trim().length >= 2 && suggestions.length === 0 && !loading && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#0d0f1a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 text-center z-50 animate-in fade-in duration-150">
          <p className="text-xs font-semibold text-gray-300">
            &quot;{query}&quot; sitemizde bulunamadı
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            Yalnızca SineTrack kütüphanesindeki dizi ve filmler aranmaktadır.
          </p>
        </div>
      )}

      {/* Floating Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#0d0f1a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-white/5 flex items-center justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider px-3">
            <span className="flex items-center gap-1.5 text-red-400">
              <Sparkles className="w-3.5 h-3.5" /> Sitemizdeki Sonuçlar
            </span>
            <span>{suggestions.length} içerik</span>
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {suggestions.map((item, idx) => {
              const isMovie = item.media_type === "movie" || !item.name;
              const title = item.title || item.name || "Bilinmeyen Başlık";
              const date = item.release_date || item.first_air_date;
              const year = date ? new Date(date).getFullYear() : null;
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => goToItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 p-2.5 px-3 cursor-pointer transition-colors ${
                    isSelected ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  {/* Thumbnail Poster */}
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-black/40 shrink-0 border border-white/10">
                    <img
                      src={getImageUrl(item.poster_path, "w500")}
                      alt={title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          isMovie
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {isMovie ? "Film" : "Dizi"}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate">{title}</h4>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      {year && <span>{year}</span>}
                      {item.vote_average > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-400 font-semibold text-[11px]">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {item.vote_average.toFixed(1)}
                        </span>
                      )}
                      <span className="text-[10px] text-emerald-400 font-medium ml-auto">
                        İzlemeye Hazır ▶
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                </div>
              );
            })}
          </div>

          {/* Footer link to see full results */}
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full p-2.5 text-xs text-center text-gray-300 hover:text-white bg-white/5 hover:bg-red-600/20 transition-colors flex items-center justify-center gap-1 font-semibold border-t border-white/5"
          >
            <span>&quot;{query}&quot; için tüm sonuçları gör</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
