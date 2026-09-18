"use client";

import { useState, useEffect } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface RatingStarsProps {
  mediaType: "movie" | "tv";
  tmdbId: number;
  title: string;
  posterPath?: string | null;
  tmdbVoteAverage?: number;
}

const SCORE_LABELS: Record<number, string> = {
  1: "Çok Kötü (1)",
  2: "Kötü (2)",
  3: "Zayıf (3)",
  4: "İdare Eder (4)",
  5: "Ortalama (5)",
  6: "Fena Değil (6)",
  7: "İyi (7)",
  8: "Çok İyi (8)",
  9: "Harika (9)",
  10: "Başyapıt (10) ⭐",
};

export default function RatingStars({
  mediaType,
  tmdbId,
  title,
  posterPath,
  tmdbVoteAverage,
}: RatingStarsProps) {
  const { user } = useAuth();
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [communityAverage, setCommunityAverage] = useState<string | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadRatings() {
      try {
        const res = await fetch(`/api/ratings?mediaType=${mediaType}&tmdbId=${tmdbId}`);
        if (res.ok) {
          const data = await res.json();
          setUserRating(data.userRating);
          setCommunityAverage(data.average);
          setRatingCount(data.count);
        }
      } catch (err) {
        console.error("Failed to load ratings:", err);
      }
    }
    loadRatings();
  }, [mediaType, tmdbId]);

  const handleRate = async (score: number) => {
    if (!user) {
      alert("Puan verebilmek için lütfen giriş yapın.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType,
          tmdbId,
          score,
          title,
          posterPath,
        }),
      });

      if (res.ok) {
        setUserRating(score);
        const updated = await fetch(`/api/ratings?mediaType=${mediaType}&tmdbId=${tmdbId}`);
        if (updated.ok) {
          const data = await updated.json();
          setCommunityAverage(data.average);
          setRatingCount(data.count);
        }
      }
    } catch (err) {
      console.error("Error rating:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayScore = hoverScore || userRating || 0;

  return (
    <div className="glass-card border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
      {/* Başlık ve Skor Özeti */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
            <span>Puan & Değerlendirme</span>
          </h4>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {ratingCount > 0
              ? `${ratingCount} oy • Ortalama: ${communityAverage}/10`
              : "Topluluk puanı bekleniyor"}
          </p>
        </div>

        {tmdbVoteAverage && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
            <span className="text-[11px] text-amber-300/80 font-bold">TMDB</span>
            <span className="text-xs font-black text-amber-400">{tmdbVoteAverage.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* 10 Yıldızlı Etkileşimli Alan */}
      <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2.5">
        {/* Yıldız Butonları (10 Adet Tam Eşit Dağılımlı, Asla Taşmaz) */}
        <div className="flex items-center justify-between w-full">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
            const isFilled = score <= displayScore;
            return (
              <button
                key={score}
                type="button"
                disabled={isSubmitting}
                onMouseEnter={() => setHoverScore(score)}
                onMouseLeave={() => setHoverScore(null)}
                onClick={() => handleRate(score)}
                className="flex-1 flex justify-center py-1 px-0.5 hover:scale-125 transition-transform cursor-pointer"
                title={`${score} / 10`}
              >
                <Star
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                    isFilled ? "text-amber-400 fill-amber-400" : "text-gray-700 hover:text-amber-400/50"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Durum & Seçili Skor Çubuğu */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
          <div className="text-[11px] text-gray-300 font-medium truncate pr-2">
            {hoverScore
              ? SCORE_LABELS[hoverScore]
              : userRating
              ? `Senin Puanın: ${SCORE_LABELS[userRating]}`
              : "Puanlamak için bir yıldıza dokunun"}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-black text-amber-400">
              {displayScore > 0 ? displayScore : "—"}
              <span className="text-[10px] text-gray-400 font-normal"> / 10</span>
            </span>
            {userRating && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-600/30">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Kaydedildi
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
