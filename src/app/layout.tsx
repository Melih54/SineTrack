import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "SineTrack - Film ve Dizi Takip & 1080p İzleme Platformu",
  description:
    "Abonelik sınırları olmadan 1080p Türkçe dublaj ve altyazılı filmleri ve dizileri keşfedin, izleyin, bölümleri takip edin.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen flex flex-col bg-[#08090e] text-gray-100 antialiased selection:bg-red-600 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <MobileBottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
