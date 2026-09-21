"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Smartphone, Sparkles, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("SineTrack Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("Service Worker registration failed:", err);
        });
    }

    // 2. Check if already running in standalone mode
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isRunningStandalone);
    if (isRunningStandalone) return;

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 4. Check if dismissed recently (within 5 days)
    const dismissedAt = localStorage.getItem("sinetrack_pwa_dismissed");
    if (dismissedAt) {
      const diff = Date.now() - parseInt(dismissedAt, 10);
      if (diff < 5 * 24 * 60 * 60 * 1000) return;
    }

    // 5. Android / Chrome install prompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // On iOS, show banner after 3 seconds if not installed
    if (isIosDevice) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIosGuide(false);
    localStorage.setItem("sinetrack_pwa_dismissed", Date.now().toString());
  };

  // If already installed in standalone mode, do not render banner
  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* Floating Bottom App Install Banner */}
      <div className="fixed bottom-16 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0c0e1a]/95 border border-red-500/40 backdrop-blur-2xl shadow-2xl shadow-red-950/50 flex items-center justify-between gap-3">
          {/* Left: App Logo & Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-600/30">
              <Smartphone className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-black text-xs sm:text-sm text-white truncate">
                  SineTrack Uygulaması
                </h4>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-600/30 text-red-400 border border-red-500/30 shrink-0">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                Ana ekrana ekle, tam ekran ve reklamsız izle!
              </p>
            </div>
          </div>

          {/* Right Actions: Install & Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Yükle</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Installation Guide Modal */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="w-full max-w-md bg-[#0d0f1a] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-5 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">iPhone & iPad'e Yükle</h3>
                  <p className="text-xs text-gray-400">2 basit adımda ana ekrana ekleyin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps */}
            <div className="space-y-3.5">
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                  <Share className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">1. Adım: Paylaş Butonuna Basın</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Safari tarayıcısının en altındaki kare içindeki yukarı ok ikonuna (<Share className="w-3 h-3 inline text-blue-400" />) dokunun.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <PlusSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">2. Adım: "Ana Ekrana Ekle"yi Seçin</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Menüyü aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong> seçeneğine dokunun ve sağ üstten <strong>"Ekle"</strong> butonuna basın.
                  </p>
                </div>
              </div>
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-red-600/30"
            >
              Anladım, Teşekkürler
            </button>
          </div>
        </div>
      )}
    </>
  );
}
