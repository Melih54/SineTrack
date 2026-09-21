import { Zap, Volume2, ShieldCheck, Smartphone } from "lucide-react";

export default function PlatformFeatures() {
  const features = [
    {
      icon: Zap,
      title: "4K Ultra HD & 1080p",
      description: "Yüksek bit hızı ve kristal netliğinde sinema kalitesinde akış desteği.",
      gradient: "from-amber-500/20 to-orange-500/10",
      border: "border-amber-500/20",
      iconColor: "text-amber-400",
    },
    {
      icon: Volume2,
      title: "Türkçe Dublaj & Altyazı",
      description: "Tek tıkla çift ses geçişi, Türkçe dublaj ve senkronize altyazı seçenekleri.",
      gradient: "from-red-600/20 to-rose-600/10",
      border: "border-red-500/20",
      iconColor: "text-red-400",
    },
    {
      icon: ShieldCheck,
      title: "Reklamsız & Kesintisiz",
      description: "Zararlı açılır pencereler olmadan doğrudan ve akıcı video deneyimi.",
      gradient: "from-emerald-500/20 to-teal-500/10",
      border: "border-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      icon: Smartphone,
      title: "Tüm Cihazlarla Uyumlu",
      description: "Mobil, tablet, TV ve masaüstünde kaldığınız yerden izlemeye devam edin.",
      gradient: "from-blue-600/20 to-indigo-600/10",
      border: "border-blue-500/20",
      iconColor: "text-blue-400",
    },
  ];

  return (
    <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 p-6 sm:p-8">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
            SineTrack Standartları
          </span>
          <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            Sinemayı Evinize Getiren Modern Platform
          </h3>
          <p className="text-xs sm:text-sm text-gray-400">
            En sevdiğiniz film ve dizileri en yüksek ses ve görüntü kalitesiyle, tamamen kesintisiz izleyin.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl bg-gradient-to-b ${feat.gradient} border ${feat.border} backdrop-blur-md space-y-3 hover:scale-[1.02] transition-transform duration-200`}
              >
                <div className={`p-2.5 rounded-xl bg-black/40 w-fit ${feat.iconColor} border border-white/10`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{feat.title}</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{feat.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
