"use client";

import Link from "next/link";
import { Flame, Film, Tv, Sparkles, Trophy, Compass, Star, Clapperboard, Rocket, Smile } from "lucide-react";

const CATEGORIES = [
  { label: "Trendler", href: "#trending", icon: Flame, color: "text-orange-400", bg: "hover:border-orange-500/50" },
  { label: "Popüler Filmler", href: "/movies", icon: Film, color: "text-red-400", bg: "hover:border-red-500/50" },
  { label: "Efsane Diziler", href: "/series", icon: Tv, color: "text-rose-400", bg: "hover:border-rose-500/50" },
  { label: "4K Ultra HD", href: "#4k-uhd", icon: Sparkles, color: "text-emerald-400", bg: "hover:border-emerald-500/50" },
  { label: "IMDb 8.0+ Zirvedekiler", href: "#top-rated", icon: Trophy, color: "text-amber-400", bg: "hover:border-amber-500/50" },
  { label: "Yerli Sinema & Dizi", href: "/movies?genre=Yerli%20Yapım", icon: Clapperboard, color: "text-cyan-400", bg: "hover:border-cyan-500/50" },
  { label: "Aksiyon & Macera", href: "/movies?genre=Aksiyon", icon: Rocket, color: "text-purple-400", bg: "hover:border-purple-500/50" },
  { label: "Bilim Kurgu", href: "/movies?genre=Bilim-Kurgu", icon: Compass, color: "text-blue-400", bg: "hover:border-blue-500/50" },
  { label: "Komedi & Eğlence", href: "/movies?genre=Komedi", icon: Smile, color: "text-yellow-400", bg: "hover:border-yellow-500/50" },
];

export default function CategoryPills() {
  return (
    <div className="relative w-full py-2 overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex items-center gap-2.5 px-4 sm:px-6 lg:px-8 min-w-max mx-auto max-w-7xl">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 pr-2 border-r border-white/10 hidden sm:inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-red-500" />
          <span>Kategoriler</span>
        </span>

        {CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <Link
              key={idx}
              href={cat.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.09] text-gray-200 hover:text-white border border-white/10 ${cat.bg} backdrop-blur-md transition-all duration-200 active:scale-95 shrink-0 shadow-sm`}
            >
              <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
              <span>{cat.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
