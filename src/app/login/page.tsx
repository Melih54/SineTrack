"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogIn, UserPlus, Sparkles, Film, PlayCircle, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const res = await register(username, email, password);
        if (res.success) {
          router.push("/");
        } else {
          setError(res.error || "Kayıt başarısız.");
        }
      } else {
        const res = await login(email || username, password);
        if (res.success) {
          router.push("/");
        } else {
          setError(res.error || "Giriş yapılamadı.");
        }
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Hızlı Demo Girişi (Tek tıkla test kullanıcısı oluşturur/giriş yapar)
  const handleQuickDemo = async () => {
    setLoading(true);
    setError("");
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    const demoUser = `sinemasever_${randomSuffix}`;
    const demoEmail = `demo_${randomSuffix}@cinetrack.local`;
    const demoPass = "demo123456";

    try {
      const res = await register(demoUser, demoEmail, demoPass);
      if (res.success) {
        router.push("/");
      } else {
        // Zaten varsa login dene
        const loginRes = await login(demoUser, demoPass);
        if (loginRes.success) router.push("/");
        else setError("Demo girişi oluşturulamadı.");
      }
    } catch {
      setError("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#121420] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-red-600/30">
            <PlayCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">
            {isRegister ? "CineTrack'e Katıl" : "Tekrar Hoş Geldiniz"}
          </h1>
          <p className="text-xs text-gray-400">
            {isRegister
              ? "Ücretsiz hesap oluşturarak izleme geçmişini ve yorumlarını kaydet"
              : "Kişisel izleme listenize ve puanlarınıza erişin"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-black/40 p-1 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !isRegister ? "bg-red-600 text-white shadow-md" : "text-gray-400 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Giriş Yap</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              isRegister ? "bg-red-600 text-white shadow-md" : "text-gray-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Kayıt Ol</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Örn: sinemafilozofu"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              {isRegister ? "E-Posta Adresi" : "Kullanıcı Adı veya E-Posta"}
            </label>
            <input
              type={isRegister ? "email" : "text"}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isRegister ? "ornek@mail.com" : "Kullanıcı adınız veya e-postanız"}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Şifre</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-600/30 transition-all mt-2"
          >
            {loading ? "İşleniyor..." : isRegister ? "Hesap Oluştur" : "Giriş Yap"}
          </button>
        </form>

        {/* Demo Fast Login Divider */}
        <div className="relative flex items-center justify-center pt-2">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#121420] px-3 text-[11px] uppercase font-semibold text-gray-500 absolute">
            veya
          </span>
        </div>

        {/* Quick Demo Button */}
        <button
          type="button"
          onClick={handleQuickDemo}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Hızlı Demo Hesabı ile Başla (Kayıtsız Test)</span>
        </button>
      </div>
    </div>
  );
}
