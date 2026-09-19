import { NextResponse } from "next/server";
import { resolveDizibalSource } from "@/lib/dizibal-resolver";
import { resolveFullHDSource } from "@/lib/fullhd-resolver";
import { getBaseUrl } from "@/lib/curl";
import { renderArtplayerHtml } from "@/lib/artplayer-template";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "";
  const originalTitle = searchParams.get("originalTitle") || null;
  const tmdbId = searchParams.get("tmdbId") ? Number(searchParams.get("tmdbId")) : null;
  const mediaType = (searchParams.get("mediaType") || "movie") as "movie" | "tv";
  const season = parseInt(searchParams.get("season") || "1", 10);
  const episode = parseInt(searchParams.get("episode") || "1", 10);
  const lang = (searchParams.get("lang") || "tr_dub") as "tr_dub" | "tr_sub" | "original";

  if (!title && !originalTitle && !tmdbId) {
    return new NextResponse("Title or TMDB ID required", { status: 400 });
  }

  // 1. PRIMARY: Resolve via Dizibal JSON REST API
  const resolved = await resolveDizibalSource({
    title,
    originalTitle,
    tmdbId,
    mediaType,
    season,
    episode,
  });

  let m3u8Url = resolved?.m3u8Url;
  let referer = resolved?.referer || "https://dizibal.org/";
  let subtitles = resolved?.subtitles || [];
  let displayTitle = resolved?.title || title;

  // 2. FALLBACK for Movies: Try Atom (FullHDFilm)
  if (!m3u8Url && mediaType === "movie") {
    const atom = resolveFullHDSource(title, originalTitle);
    if (atom && atom.rapidvidUrl) {
      return NextResponse.redirect(new URL(atom.embedUrl, getBaseUrl(req)));
    }
  }

  if (!m3u8Url) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0; background: #0b0c15; color: #fff;
            display: flex; align-items: center; justify-content: center;
            height: 100vh; font-family: sans-serif; text-align: center; padding: 20px;
          }
          .box { max-width: 440px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 32px; border-radius: 16px; }
          h3 { margin: 0 0 10px; font-size: 18px; color: #f59e0b; }
          p { margin: 0 0 16px; color: #94a3b8; font-size: 13px; line-height: 1.5; }
          button { background: #f59e0b; color: #000; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="box">
          <h3>Kaynak Kontrol Ediliyor</h3>
          <p><strong>${displayTitle} ${mediaType === "tv" ? `(${season}. Sezon ${episode}. Bölüm)` : ""}</strong> için akış hazırlanıyor. Lütfen sayfayı yenileyin veya diğer sunuculardan birini seçin.</p>
          <button onclick="location.reload()">Yeniden Dene</button>
        </div>
        <script>
          try {
            window.parent.postMessage({ type: "STREAM_ERROR", source: "dizibal-embed", reason: "NOT_FOUND" }, "*");
          } catch(e) {}
        </script>
      </body>
      </html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Proxied master stream URL via dizi-m3u8 so child playlists and all chunks are rewritten through proxy
  const proxiedMasterStream = `/api/player/dizi-m3u8?title=${encodeURIComponent(displayTitle)}&tmdbId=${tmdbId || ""}&mediaType=${mediaType}&season=${season}&episode=${episode}&lang=${lang}&streamUrl=${encodeURIComponent(m3u8Url)}&ref=${encodeURIComponent(referer)}`;

  const playerHtml = renderArtplayerHtml({
    title: displayTitle,
    originalTitle,
    mediaType,
    season,
    episode,
    tmdbId,
    lang,
    masterStreamUrl: proxiedMasterStream,
    subtitles,
    referer,
    provider: "DiziBal HD",
    badge: "🐝 DiziBal HD",
    themeColor: "#f59e0b",
  });

  return new NextResponse(playerHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}

