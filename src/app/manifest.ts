import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SineTrack - Film & Dizi Platformu",
    short_name: "SineTrack",
    description:
      "Abonelik sınırları olmadan 1080p ve 4K Türkçe dublaj ve altyazılı filmleri ve dizileri keşfedin, izleyin.",
    start_url: "/",
    display: "standalone",
    background_color: "#08090e",
    theme_color: "#08090e",
    orientation: "any",
    scope: "/",
    categories: ["entertainment", "video", "movies"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Filmler",
        url: "/movies",
        description: "Popüler 1080p ve 4K filmleri keşfedin",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Diziler",
        url: "/series",
        description: "Tüm sezonları ve bölümleriyle dizileri izleyin",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Film ve Dizi Ara",
        url: "/search",
        description: "SineTrack kütüphanesinde arama yapın",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
