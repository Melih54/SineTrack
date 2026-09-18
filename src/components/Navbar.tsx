"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
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
} from "lucide-react";

import SearchAutocomplete from "@/components/SearchAutocomplete";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 bg-[#090a0f]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white flex items-center">
                Sine<span className="text-gradient">Track</span>
              </span>
              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider -mt-1">
                Film & Dizi Dünyası
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Keşfet
            </Link>
            <Link
              href="/movies"
              className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Film className="w-4 h-4 text-red-500" />
              Filmler
            </Link>
            <Link
              href="/series"
              className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Tv className="w-4 h-4 text-rose-500" />
              Diziler
            </Link>
            {user && (
              <>
                <Link
                  href="/watchlist"
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  Listem
                </Link>
                <Link
                  href="/history"
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <History className="w-4 h-4 text-emerald-500" />
                  İzlediklerim
                </Link>
              </>
            )}
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-2 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 border border-red-500/20"
              >
                <ShieldCheck className="w-4 h-4 text-red-500" />
                Admin Paneli
              </Link>
            )}
          </nav>

          {/* Desktop Search Bar with Autocomplete */}
          <SearchAutocomplete className="hidden sm:block flex-1 max-w-xs md:max-w-sm" />

          {/* User Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-colors border border-white/10"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-8 h-8 rounded-full bg-red-950/50 object-cover"
                  />
                  <span className="text-sm font-medium text-gray-200 hidden lg:inline max-w-[120px] truncate">
                    {user.username}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    onClick={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-52 bg-[#131620] border border-white/10 rounded-xl shadow-2xl py-2 z-50 text-sm"
                  >
                    <div className="px-4 py-2 border-b border-white/10 mb-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-white truncate">{user.username}</p>
                        {user.isAdmin && (
                          <span className="px-1.5 py-0.2 bg-red-600/30 text-red-400 text-[9px] font-bold rounded uppercase">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

                    {user.isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-red-500" />
                        Admin Paneli
                      </Link>
                    )}

                    <Link
                      href="/watchlist"
                      className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Bookmark className="w-4 h-4 text-amber-400" />
                      İzleme Listesi
                    </Link>
                    <Link
                      href="/history"
                      className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <History className="w-4 h-4 text-emerald-400" />
                      Bölüm & Film Geçmişi
                    </Link>

                    <div className="border-t border-white/10 my-1" />
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-lg shadow-red-600/25 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Giriş Yap</span>
              </Link>
            )}

            {/* Mobile search button - directly navigates to /search */}
            <Link
              href="/search"
              onClick={() => {
                if (mobileMenuOpen) setMobileMenuOpen(false);
              }}
              className="sm:hidden p-2 text-gray-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
              aria-label="Film ve Dizi Ara"
            >
              <Search className="w-5 h-5 text-red-500" />
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-3">
            <div className="px-2">
              <SearchAutocomplete
                onSelect={() => setMobileMenuOpen(false)}
                placeholder="Film veya dizi ara..."
                className="w-full"
              />
            </div>
            <div className="flex flex-col space-y-1 px-2">
              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-gray-300 hover:text-white rounded-lg flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-red-500" />
                Film & Dizi Ara
              </Link>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-gray-300 hover:text-white rounded-lg"
              >
                Keşfet
              </Link>
              <Link
                href="/movies"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-gray-300 hover:text-white rounded-lg flex items-center gap-2"
              >
                <Film className="w-4 h-4 text-red-500" />
                Filmler
              </Link>
              <Link
                href="/series"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-gray-300 hover:text-white rounded-lg flex items-center gap-2"
              >
                <Tv className="w-4 h-4 text-rose-500" />
                Diziler
              </Link>
              {user && (
                <>
                  <Link
                    href="/watchlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-gray-300 hover:text-white rounded-lg flex items-center gap-2"
                  >
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    İzleme Listem
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-gray-300 hover:text-white rounded-lg flex items-center gap-2"
                  >
                    <History className="w-4 h-4 text-emerald-500" />
                    İzlediklerim
                  </Link>
                </>
              )}
              {user?.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-red-400 font-bold hover:text-red-300 rounded-lg flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-red-500" />
                  Admin Paneli
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
