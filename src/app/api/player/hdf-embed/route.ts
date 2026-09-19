import { NextResponse } from "next/server";
import { resolveHdfSeriesEpisode, resolveHdfMovie } from "@/lib/hdfilmcehennemi-resolver";
import { resolveDizibalSource } from "@/lib/dizibal-resolver";
import { getBaseUrl } from "@/lib/curl";
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

  let hdf = isMovie
    ? resolveHdfMovie(title, originalTitle)
    : resolveHdfSeriesEpisode(title, originalTitle, season, episode);

  if (!hdf || !hdf.m3u8Url) {
    try {
      const dizibal = await resolveDizibalSource({
        title,
        originalTitle,
        tmdbId,
        mediaType: isMovie ? "movie" : "tv",
        season,
        episode,
      });
      if (dizibal && dizibal.m3u8Url) {
        return NextResponse.redirect(new URL(`/api/player/dizibal-embed?${searchParams.toString()}`, getBaseUrl(req)));
      }
    } catch (e) {}

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
          <h3>HDFilmCehennemi Kaynağı Hazırlanıyor</h3>
          <p><strong>${title} ${!isMovie ? `(${season}. Sezon ${episode}. Bölüm)` : ""}</strong> için kaynak kontrol ediliyor. Lütfen sayfayı yenileyin veya diğer sunuculardan birini deneyin.</p>
          <button onclick="location.reload()">Yeniden Dene</button>
        </div>
        <script>
          try {
            window.parent.postMessage({ type: "STREAM_ERROR", source: "hdf-embed", reason: "NOT_FOUND" }, "*");
          } catch(e) {}
        </script>
      </body>
      </html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const subtitles = hdf.subtitles || [];
  const masterStreamUrl = `/api/player/dizi-m3u8?title=${encodeURIComponent(title)}&season=${season}&episode=${episode}&mediaType=${mediaType}&lang=${lang}&streamUrl=${encodeURIComponent(hdf.m3u8Url)}&ref=${encodeURIComponent(hdf.referer)}`;

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
    referer: hdf.referer,
    provider: "HDFilmCehennemi",
    badge: "🔥 HDFilmCehennemi",
    themeColor: "#e50914",
  });

  return new NextResponse(playerHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}

