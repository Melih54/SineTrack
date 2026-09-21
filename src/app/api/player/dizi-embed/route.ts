import { NextResponse } from "next/server";
import { resolveSeriesEpisode, SeriesStreamSource } from "@/lib/series-resolver";
import { resolveHdfMovie } from "@/lib/hdfilmcehennemi-resolver";
import { resolveDizibalSource } from "@/lib/dizibal-resolver";
import { renderArtplayerHtml } from "@/lib/artplayer-template";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "";
  const originalTitle = searchParams.get("originalTitle") || null;
  const tmdbId = searchParams.get("tmdbId") ? Number(searchParams.get("tmdbId")) : undefined;
  const mediaType = searchParams.get("mediaType") || "tv";
  const isMovie = mediaType === "movie";
  const season = parseInt(searchParams.get("season") || "1", 10);
  const episode = parseInt(searchParams.get("episode") || "1", 10);
  const lang = (searchParams.get("lang") || "tr_dub") as "tr_dub" | "tr_sub" | "original";

  const sourceParam = searchParams.get("source");
  const isRoketRequested = sourceParam === "roket";
  const isDiziboxRequested = sourceParam === "dizibox";
  const isAtomRequested = sourceParam === "atom";

  let matched: SeriesStreamSource | null = null;

  // 1. If user explicitly requested RoketDizi, Dizibox, or Atom
  if (isRoketRequested && !isMovie) {
    try {
      const { resolveRoketDiziEpisode } = await import("@/lib/roketdizi-resolver");
      const rSources = resolveRoketDiziEpisode(title, originalTitle, season, episode);
      matched = rSources.find((s) => s.lang === lang) || rSources[0] || null;
    } catch (e) {}
  } else if (isDiziboxRequested && !isMovie) {
    try {
      const { resolveDiziboxEpisode } = await import("@/lib/dizibox-resolver");
      const dSource = resolveDiziboxEpisode(title, originalTitle, season, episode);
      if (dSource) matched = dSource;
    } catch (e) {}
  } else if (isAtomRequested && !isMovie) {
    try {
      const sources = resolveSeriesEpisode(title, originalTitle, season, episode);
      matched = sources.find((s) => s.lang === lang) || sources[0] || null;
    } catch (e) {}
  }

  // 2. PRIMARY (default): Try Dizibal REST API (high-speed, exact TMDB match, clean m3u8)
  if (!matched) {
    try {
      const dizibalStream = await resolveDizibalSource({
        title,
        originalTitle,
        tmdbId,
        mediaType: isMovie ? "movie" : "tv",
        season,
        episode,
      });
      if (dizibalStream && dizibalStream.m3u8Url) {
        matched = {
          provider: "DiziBal",
          lang,
          label: "DiziBal (1080P)",
          quality: "1080P",
          m3u8Url: dizibalStream.m3u8Url,
          rawIframeSrc: dizibalStream.embedUrl,
          referer: dizibalStream.referer,
          embedUrl: req.url,
          subtitles: dizibalStream.subtitles,
        };
      }
    } catch (err) {}
  }

  // 2. FALLBACK: Movie -> HDFilmCehennemi, TV -> Dizilla / Dizipal
  if (!matched) {
    if (isMovie) {
      const hdf = resolveHdfMovie(title, originalTitle);
      if (hdf && hdf.m3u8Url) {
        matched = {
          provider: "HDFilmCehennemi",
          lang,
          label: "HDFilmCehennemi (1080P)",
          quality: "1080P",
          m3u8Url: hdf.m3u8Url,
          rawIframeSrc: hdf.embedIframeUrl,
          referer: hdf.referer,
          embedUrl: req.url,
          subtitles: hdf.subtitles,
        };
      }
    } else {
      const sources = resolveSeriesEpisode(title, originalTitle, season, episode);
      matched = sources.find((s) => s.lang === lang) || sources[0] || null;
    }
  }

  if (!matched || !matched.m3u8Url) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            background: #0b0c15;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 20px;
          }
          .box {
            max-width: 440px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 32px;
            border-radius: 16px;
            backdrop-filter: blur(12px);
          }
          h3 { margin: 0 0 10px; font-size: 18px; color: #f87171; }
          p { margin: 0 0 16px; color: #94a3b8; font-size: 13px; line-height: 1.5; }
          button {
            background: #e50914;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h3>Kaynak Hazırlanıyor</h3>
          <p><strong>${title} ${!isMovie ? `(${season}. Sezon ${episode}. Bölüm)` : ""}</strong> için video kaynağı kontrol ediliyor (Dizilla, HDFilmCehennemi, Dizipal). Lütfen yeniden deneyin veya oynatıcı menüsünden diğer sunuculardan birini seçin.</p>
          <button onclick="location.reload()">Yeniden Dene</button>
        </div>
        <script>
          try {
            window.parent.postMessage({ type: "STREAM_ERROR", source: "dizi-embed", reason: "NOT_FOUND" }, "*");
          } catch(e) {}
        </script>
      </body>
      </html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const subtitles = matched.subtitles || [];
  const masterStreamUrl = `/api/player/dizi-m3u8?title=${encodeURIComponent(title)}&season=${season}&episode=${episode}&mediaType=${mediaType}&lang=${lang}`;

  const playerHtml = renderArtplayerHtml({
    title,
    originalTitle,
    mediaType: isMovie ? "movie" : "tv",
    season,
    episode,
    tmdbId,
    lang,
    masterStreamUrl,
    subtitles,
    referer: matched.referer,
    provider: matched.provider || "Dizilla",
    badge: `⚡ ${matched.provider || "Dizi / Atom"}`,
    themeColor: "#e50914",
  });

  return new NextResponse(playerHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}

