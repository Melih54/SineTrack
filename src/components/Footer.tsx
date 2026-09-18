import Link from "next/link";
import { PlayCircle, ShieldCheck, Heart, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#07080c] py-12 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/30">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-white">
                Sine<span className="text-gradient">Track</span>
              </span>
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider -mt-1">
                Film & Dizi Dünyası
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap justify-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-white transition-colors">
              Keşfet
            </Link>
            <Link href="/movies" className="hover:text-white transition-colors">
              Filmler
            </Link>
            <Link href="/series" className="hover:text-white transition-colors">
              Diziler
            </Link>
            <Link href="/watchlist" className="hover:text-white transition-colors">
              İzleme Listem
            </Link>
            <Link href="/history" className="hover:text-white transition-colors">
              İzleme Geçmişi
            </Link>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-500 leading-relaxed flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <p>
            <strong>Yasal Uyarı & Bilgilendirme:</strong> SineTrack, kullanıcılara film ve dizi takip, inceleme, puanlama ve topluluk özellikleri sunan bir web platformudur. Sistem sunucularında hiçbir video, film veya ses dosyası barındırılmamaktadır. Tüm medya meta verileri TMDB API üzerinden, video oynatıcıları ise üçüncü taraf kamuya açık embed servisleri üzerinden çağrılmaktadır.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4 pt-4 border-t border-white/5">
          <p>© {new Date().getFullYear()} SineTrack. Tüm hakları saklıdır.</p>
          <p className="flex items-center gap-1.5 text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Özgür ve bağımsız sinemaseverler için tasarlandı</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
