"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Compass,
  Film,
  Tv,
  Search,
  Bookmark,
  History,
  ShieldCheck,
  LogOut,
  LogIn,
  Menu,
  X,
  PlayCircle,
  ChevronDown,
  User as UserIcon,
  Sparkles,
  Clapperboard,
  Rocket,
  CheckCircle2,
} from "lucide-react";

import SearchAutocomplete from "@/components/SearchAutocomplete";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Track window scroll to add deep glassmorphism when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: "Keşfet", href: "/", icon: Compass },
    { label: "Filmler", href: "/movies", icon: Film, badge: "1080p" },
    { label: "Diziler", href: "/series", icon: Tv, badge: "Dizipal" },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#07080e]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/80 py-2.5"
            : "bg-[#07080e]/80 backdrop-blur-md border-b border-white/5 py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            {/* 1. BRAND LOGO */}
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 group select-none"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 group-hover:shadow-red-600/50 transition-all duration-300">
                <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#07080e] rounded-full" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center leading-tight">
                    Sine<span className="text-gradient">Track</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30 hidden xs:inline-block">
                    4K
                  </span>
                </div>
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider -mt-0.5 hidden xs:block">
                  Sinema & Dizi Platformu
                </span>
              </div>
            </Link>

            {/* 2. DESKTOP NAVIGATION LINKS */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActiveLink(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 py-2 text-xs lg:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                      active
                        ? "bg-red-600/15 text-white border border-red-500/30 shadow-sm shadow-red-600/10"
                        : "text-gray-300 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        active ? "text-red-500" : "text-gray-400"
                      }`}
                    />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/10 text-gray-300 border border-white/10 hidden lg:inline-block">
                        {link.badge}
                      </span>
                    )}
                    {active && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full" />
                    )}
                  </Link>
                );
              })}

              {user && (
                <>
                  <Link
                    href="/watchlist"
                    className={`relative px-3 py-2 text-xs lg:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                      isActiveLink("/watchlist")
                        ? "bg-amber-500/15 text-white border border-amber-500/30 shadow-sm"
                        : "text-gray-300 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        isActiveLink("/watchlist")
                          ? "text-amber-400"
                          : "text-amber-500"
                      }`}
                    />
                    <span>Listem</span>
                  </Link>

                  <Link
                    href="/history"
                    className={`relative px-3 py-2 text-xs lg:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                      isActiveLink("/history")
                        ? "bg-emerald-500/15 text-white border border-emerald-500/30 shadow-sm"
                        : "text-gray-300 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <History
                      className={`w-4 h-4 ${
                        isActiveLink("/history")
                          ? "text-emerald-400"
                          : "text-emerald-500"
                      }`}
                    />
                    <span>Geçmiş</span>
                  </Link>
                </>
              )}

              {user?.isAdmin && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 text-xs lg:text-sm font-black rounded-xl transition-all flex items-center gap-1.5 ${
                    isActiveLink("/admin")
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : "text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <span>Admin</span>
                </Link>
              )}
            </nav>

            {/* 3. DESKTOP SEARCH BAR (WITH AUTOCOMPLETE) */}
            <div className="hidden sm:block flex-1 max-w-xs md:max-w-sm lg:max-w-md">
              <SearchAutocomplete
                placeholder="Film veya dizi ara... (örn: Dune, Ezel)"
                className="w-full"
              />
            </div>

            {/* 4. USER & ACTIONS SECTION */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Mobile Quick Search Button */}
              <Link
                href="/search"
                className="sm:hidden p-2 text-gray-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center active:scale-90"
                aria-label="Arama"
                title="Film ve Dizi Ara"
              >
                <Search className="w-4 h-4 text-red-500" />
              </Link>

              {user ? (
                /* Logged In User Dropdown */
                <div className="relative" ref={userDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer select-none"
                    aria-label="Kullanıcı Menüsü"
                  >
                    <div className="relative">
                      <img
                        src={
                          user.avatar ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`
                        }
                        alt={user.username}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-950/60 object-cover ring-1 ring-white/20"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border border-[#07080e] rounded-full" />
                    </div>

                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-bold text-white max-w-[100px] truncate leading-tight">
                        {user.username}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {user.isAdmin ? "Yönetici" : "Üye"}
                      </span>
                    </div>

                    <ChevronDown
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 hidden sm:block ${
                        userDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#0c0e18]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-150">
                      {/* User Card Header */}
                      <div className="p-3 bg-white/[0.04] rounded-xl border border-white/10 mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              user.avatar ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`
                            }
                            alt={user.username}
                            className="w-9 h-9 rounded-lg bg-red-950/60 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-white text-xs truncate">
                                {user.username}
                              </p>
                              {user.isAdmin && (
                                <span className="px-1.5 py-0.2 bg-red-600/30 border border-red-500/40 text-red-400 text-[9px] font-black rounded uppercase">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Links */}
                      <div className="space-y-0.5">
                        {user.isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-400 hover:text-white hover:bg-red-600/20 rounded-xl transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-red-500" />
                            <span>Admin Paneli</span>
                          </Link>
                        )}

                        <Link
                          href="/watchlist"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-amber-400" />
                          <span>İzleme Listem</span>
                        </Link>

                        <Link
                          href="/history"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <History className="w-4 h-4 text-emerald-400" />
                          <span>İzleme Geçmişim</span>
                        </Link>
                      </div>

                      <div className="border-t border-white/10 my-1.5" />

                      {/* Logout Button */}
                      <button
                        type="button"
                        onClick={() => logout()}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600/20 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Çıkış Yap</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Guest Login Button */
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Giriş Yap</span>
                </Link>
              )}

              {/* 5. MOBILE DRAWER TOGGLE BUTTON */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all active:scale-90"
                aria-label={mobileMenuOpen ? "Menüyü Kapat" : "Menüyü Aç"}
                title="Menü"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-red-400" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-200" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 6. IMMERSIVE MOBILE SLIDE-OVER DRAWER (FULL RESPONSIVE MENU) */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col bg-[#07080e]/98 backdrop-blur-2xl animate-in fade-in duration-200">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#0c0e18]">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white">
                <PlayCircle className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-white">
                Sine<span className="text-gradient">Track</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-white/10 text-gray-300 hover:text-white active:scale-90 transition-all"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {/* Integrated Quick Search inside Mobile Drawer */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                Hızlı Arama
              </span>
              <SearchAutocomplete
                onSelect={() => setMobileMenuOpen(false)}
                placeholder="Film veya dizi adı yazın..."
                className="w-full"
                autoFocus={false}
              />
            </div>

            {/* Main Navigation Group */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                Ana Menü
              </span>

              <div className="space-y-1 bg-white/[0.03] p-2 rounded-2xl border border-white/10">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                    pathname === "/"
                      ? "bg-red-600/20 text-red-400 border border-red-500/30 shadow-md"
                      : "text-gray-200 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Compass className="w-5 h-5 text-red-500" />
                    <span>Keşfet</span>
                  </div>
                  <span className="text-xs text-gray-500 font-normal">Anasayfa</span>
                </Link>

                <Link
                  href="/movies"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                    pathname.startsWith("/movies")
                      ? "bg-red-600/20 text-red-400 border border-red-500/30 shadow-md"
                      : "text-gray-200 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Film className="w-5 h-5 text-red-500" />
                    <span>Filmler</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-300">
                    1080p Full HD
                  </span>
                </Link>

                <Link
                  href="/series"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                    pathname.startsWith("/series")
                      ? "bg-rose-600/20 text-rose-400 border border-rose-500/30 shadow-md"
                      : "text-gray-200 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Tv className="w-5 h-5 text-rose-500" />
                    <span>Diziler</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-300">
                    Tüm Sezonlar
                  </span>
                </Link>
              </div>
            </div>

            {/* Quick Categories inside Mobile Drawer */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                Kategoriler & Türler
              </span>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/movies?genre=Aksiyon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300"
                >
                  <Rocket className="w-4 h-4 text-purple-400" />
                  <span>Aksiyon</span>
                </Link>
                <Link
                  href="/movies?genre=Bilim-Kurgu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Bilim Kurgu</span>
                </Link>
                <Link
                  href="/movies?genre=Yerli%20Yapım"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300"
                >
                  <Clapperboard className="w-4 h-4 text-cyan-400" />
                  <span>Yerli Sinema</span>
                </Link>
                <Link
                  href="/movies?genre=Komedi"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300"
                >
                  <span className="text-sm">🎭</span>
                  <span>Komedi</span>
                </Link>
              </div>
            </div>

            {/* User Personal Area */}
            {user && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
                  Kişisel Alan
                </span>

                <div className="space-y-1 bg-white/[0.03] p-2 rounded-2xl border border-white/10">
                  <Link
                    href="/watchlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl text-sm font-bold text-gray-200 hover:bg-white/5 transition-all"
                  >
                    <Bookmark className="w-5 h-5 text-amber-400" />
                    <span>İzleme Listem</span>
                  </Link>

                  <Link
                    href="/history"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl text-sm font-bold text-gray-200 hover:bg-white/5 transition-all"
                  >
                    <History className="w-5 h-5 text-emerald-400" />
                    <span>İzleme Geçmişim</span>
                  </Link>

                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl text-sm font-black text-red-400 bg-red-600/10 border border-red-500/30 transition-all"
                    >
                      <ShieldCheck className="w-5 h-5 text-red-500" />
                      <span>Admin Yönetim Paneli</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer (User Info & Auth) */}
          <div className="p-4 border-t border-white/10 bg-[#0c0e18]">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={
                      user.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`
                    }
                    alt={user.username}
                    className="w-10 h-10 rounded-xl bg-red-950/60 object-cover shrink-0 ring-1 ring-white/20"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 active:scale-90 transition-all cursor-pointer"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-600/30 active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Giriş Yap</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 active:scale-95"
                >
                  <UserIcon className="w-4 h-4 text-gray-300" />
                  <span>Kayıt Ol</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
