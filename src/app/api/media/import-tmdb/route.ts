import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveFullHDSource } from "@/lib/fullhd-resolver";

const TMDB_KEY = process.env.TMDB_API_KEY || "4e44d9029b1270a757cddc766a1bcb63";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    const { mode, tmdbId, mediaType = "movie" } = await req.json();

    // 1. TEK BİR FİLM/DİZİYİ TMDB'DEN ÇEKİP SİTEYE EKLE
    if (mode === "single" && tmdbId) {
      let res = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_KEY}&language=tr-TR`
      );
      if (!res.ok) {
        res = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_KEY}&language=en-US`
        );
      }
      if (!res.ok) {
        return NextResponse.json({ error: "TMDB'den içerik bilgisi alınamadı." }, { status: 404 });
      }

      const d = await res.json();
      let overview = d.overview;

      // Türkçe özet boşsa İngilizce'sini al
      if (!overview || overview.trim().length === 0) {
        try {
          const enRes = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_KEY}&language=en-US`
          );
          if (enRes.ok) {
            const enData = await enRes.json();
            overview = enData.overview;
          }
        } catch {}
      }

      const title = d.title || d.name || "İsimsiz İçerik";
      const originalTitle = d.original_title || d.original_name || title;
      const posterPath = d.poster_path
        ? `https://image.tmdb.org/t/p/w500${d.poster_path}`
        : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80";
      const backdropPath = d.backdrop_path
        ? `https://image.tmdb.org/t/p/original${d.backdrop_path}`
        : null;
      const releaseYear = (d.release_date || d.first_air_date || "").split("-")[0] || "2024";
      
      const isTv = mediaType === "tv";
      const origLang = d.original_language || "";
      const isTurkish =
        origLang === "tr" ||
        (d.origin_country && d.origin_country.includes("TR")) ||
        (d.production_countries && d.production_countries.some((c: any) => c.iso_3166_1 === "TR"));

      let genres = (d.genres || []).map((g: any) => g.name).join(", ") || (isTv ? "Dizi" : "Film");
      if (isTurkish && !genres.includes("Yerli")) {
        genres = "Yerli Yapım, " + genres;
      }

      // Link tanımlamaları:
      // Tüm yapımlar (yerli/yabancı) VidLink Pro + Videasy ile açılır.
      // Yerli yapımlarda orijinal ses zaten Türkçe olduğundan Türkçe Altyazı/Dublaj seçimi gerekmez.
      let videoUrl = "";
      let dubUrl = "";
      let subUrl = "";

      if (isTv) {
        videoUrl = `/api/player/dizibal-embed?title={title}&tmdbId=${tmdbId}&mediaType=tv&season={season}&episode={episode}&lang=tr_sub`;
        dubUrl = `/api/player/dizibal-embed?title={title}&tmdbId=${tmdbId}&mediaType=tv&season={season}&episode={episode}&lang=tr_dub`;
        subUrl = `/api/player/dizibal-embed?title={title}&tmdbId=${tmdbId}&mediaType=tv&season={season}&episode={episode}&lang=tr_sub`;
      } else {
        videoUrl = `/api/player/dizibal-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&mediaType=movie&lang=tr_sub`;
        dubUrl = `/api/player/dizibal-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&mediaType=movie&lang=tr_dub`;
        subUrl = `/api/player/dizibal-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&mediaType=movie&lang=tr_sub`;
      }

      const seasonsCount = isTv
        ? (d.number_of_seasons || (d.seasons ? d.seasons.filter((s: any) => s.season_number > 0).length : 1))
        : 1;
      const episodesCount = isTv ? (d.number_of_episodes || seasonsCount * 10) : 1;

      const created = await prisma.mediaItem.upsert({
        where: { tmdbId: Number(tmdbId) },
        update: {
          title,
          originalTitle,
          overview: overview || "Özet henüz girilmedi.",
          posterPath,
          backdropPath,
          releaseYear,
          voteAverage: d.vote_average || 0,
          voteCount: d.vote_count || 0,
          genres,
          duration: d.runtime || null,
          videoUrl,
          dubUrl,
          subUrl,
          seasonsCount,
          episodesCount,
        },
        create: {
          tmdbId: Number(tmdbId),
          mediaType,
          title,
          originalTitle,
          overview: overview || "Özet henüz girilmedi.",
          posterPath,
          backdropPath,
          releaseYear,
          voteAverage: d.vote_average || 0,
          voteCount: d.vote_count || 0,
          genres,
          duration: d.runtime || null,
          videoUrl,
          dubUrl,
          subUrl,
          seasonsCount,
          episodesCount,
        },
      });

      return NextResponse.json({
        message: `"${title}" (${isTurkish ? "Yerli Yapım 🇹🇷" : "Yabancı"}) başarıyla siteye eklendi ve oynatıcı linkleri ayarlandı!`,
        item: created,
      });
    }

    // 2. TOPLU POPÜLER FİLM VE DİZİLERİ İÇE AKTAR
    if (mode === "bulk") {
      let importedCount = 0;

      // Popüler Filmleri Çek
      for (let page = 1; page <= 3; page++) {
        const moviesRes = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=tr-TR&page=${page}`
        );
        if (moviesRes.ok) {
          const data = await moviesRes.json();
          for (const m of data.results || []) {
            if (!m.poster_path || !m.title) continue;
            const isTr = m.original_language === "tr";
            let g = "Sinema, Popüler";
            if (isTr) g = "Yerli Yapım, " + g;

            const videoUrl = `https://vidlink.pro/movie/${m.id}?primaryColor=e50914`;
            const dubUrl = isTr ? videoUrl : `https://multiembed.mov/?video_id=${m.id}&tmdb=1&audio=tr`;
            const subUrl = isTr ? videoUrl : `https://player.videasy.net/movie/${m.id}`;

            await prisma.mediaItem.upsert({
              where: { tmdbId: m.id },
              update: {},
              create: {
                tmdbId: m.id,
                mediaType: "movie",
                title: m.title,
                originalTitle: m.original_title,
                overview: m.overview || "Konu özeti",
                posterPath: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
                backdropPath: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : null,
                releaseYear: (m.release_date || "").split("-")[0] || "2024",
                voteAverage: m.vote_average || 0,
                voteCount: m.vote_count || 0,
                genres: g,
                videoUrl,
                dubUrl,
                subUrl,
              },
            });
            importedCount++;
          }
        }
      }

      // Popüler Dizileri Çek
      for (let page = 1; page <= 3; page++) {
        const tvRes = await fetch(
          `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_KEY}&language=tr-TR&page=${page}`
        );
        if (tvRes.ok) {
          const data = await tvRes.json();
          for (const t of data.results || []) {
            if (!t.poster_path || !t.name) continue;
            const isTr = t.original_language === "tr" || (t.origin_country && t.origin_country.includes("TR"));
            let g = "Dizi, Trend";
            if (isTr) g = "Yerli Yapım, " + g;

            const videoUrl = `https://vidlink.pro/tv/${t.id}/{season}/{episode}?primaryColor=e50914`;
            const dubUrl = isTr ? videoUrl : `https://multiembed.mov/?video_id=${t.id}&tmdb=1&s={season}&e={episode}&audio=tr`;
            const subUrl = isTr ? videoUrl : `https://player.videasy.net/tv/${t.id}/{season}/{episode}`;

            await prisma.mediaItem.upsert({
              where: { tmdbId: t.id },
              update: {},
              create: {
                tmdbId: t.id,
                mediaType: "tv",
                title: t.name,
                originalTitle: t.original_name,
                overview: t.overview || "Dizi özeti",
                posterPath: `https://image.tmdb.org/t/p/w500${t.poster_path}`,
                backdropPath: t.backdrop_path ? `https://image.tmdb.org/t/p/original${t.backdrop_path}` : null,
                releaseYear: (t.first_air_date || "").split("-")[0] || "2024",
                voteAverage: t.vote_average || 0,
                voteCount: t.vote_count || 0,
                genres: g,
                videoUrl,
                dubUrl,
                subUrl,
                seasonsCount: 1,
                episodesCount: 10,
              },
            });
            importedCount++;
          }
        }
      }

      return NextResponse.json({
        message: `Toplu aktarım tamamlandı! Toplam ${importedCount} adet içerik güncel çalışan oynatıcı linkleriyle eklendi.`,
        count: importedCount,
      });
    }

    return NextResponse.json({ error: "Geçersiz mod." }, { status: 400 });
  } catch (error) {
    console.error("Import TMDB error:", error);
    return NextResponse.json({ error: "İçe aktarım başarısız oldu." }, { status: 500 });
  }
}
