"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, RotateCcw, Clock } from "lucide-react";

interface ResumeItem {
  key: string;
  mediaType: "movie" | "tv";
  idOrTitle: string;
  season: number;
  episode: number;
  timeSeconds: number;
  formattedTime: string;
  url: string;
  displayTitle: string;
}

export default function ContinueWatching() {
  const [resumeList, setResumeList] = useState<ResumeItem[]>([]);

  useEffect(() => {
    try {
      const items: ResumeItem[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sinetrack_resume_")) {
          // Format: sinetrack_resume_{mediaType}_{idOrTitle}_{season}_{episode}
          const parts = key.replace("sinetrack_resume_", "").split("_");
          if (parts.length >= 3) {
            const mediaType = parts[0] as "movie" | "tv";
            const episode = parseInt(parts[parts.length - 1], 10) || 1;
            const season = parseInt(parts[parts.length - 2], 10) || 1;
            const idOrTitle = parts.slice(1, parts.length - 2).join("_");
            const timeSeconds = parseFloat(localStorage.getItem(key) || "0");

            if (timeSeconds > 30) {
              const minutes = Math.floor(timeSeconds / 60);
              const seconds = Math.floor(timeSeconds % 60);
              const formatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
              const decodedTitle = decodeURIComponent(idOrTitle).replace(/-/g, " ");

              const url =
                mediaType === "movie"
                  ? `/movie/${idOrTitle}`
                  : `/tv/${idOrTitle}?season=${season}&episode=${episode}`;

              items.push({
                key,
                mediaType,
                idOrTitle,
                season,
                episode,
                timeSeconds,
                formattedTime: formatted,
                url,
                displayTitle: decodedTitle,
              });
            }
          }
        }
      }

      // Sort by last watched (or time)
      items.sort((a, b) => b.timeSeconds - a.timeSeconds);
      setResumeList(items.slice(0, 6));
    } catch (e) {
      console.error("Failed to load continue watching list:", e);
    }
  }, []);

  if (resumeList.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Kaldığın Yerden Devam Et</h2>
            <p className="text-xs text-gray-400">Daha önce yarım bıraktığınız içerikler</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {resumeList.map((item) => (
          <Link
            key={item.key}
            href={item.url}
            className="group relative flex items-center gap-4 p-4 rounded-2xl glass-card border border-white/10 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform shadow-md">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-white capitalize truncate group-hover:text-amber-400 transition-colors">
                {item.displayTitle}
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                {item.mediaType === "tv" && (
                  <span className="text-amber-400 font-semibold">
                    {item.season}. Sezon {item.episode}. Bölüm
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span>{item.formattedTime}</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
