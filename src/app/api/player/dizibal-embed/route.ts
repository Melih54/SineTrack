import { NextResponse } from "next/server";
import { resolveDizibalSource } from "@/lib/dizibal-resolver";
import { resolveFullHDSource } from "@/lib/fullhd-resolver";

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
      return NextResponse.redirect(new URL(atom.embedUrl, req.url));
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
      </body>
      </html>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Proxied master stream URL so CORS & Referer headers are handled seamlessly
  const proxiedMasterStream = `/api/player/stream-proxy?ref=${encodeURIComponent(referer)}&url=${encodeURIComponent(m3u8Url)}`;

  const tracksHtml = subtitles
    .map((sub) => {
      const subProxyUrl = `/api/player/stream-proxy?ref=${encodeURIComponent(referer)}&url=${encodeURIComponent(sub.file)}`;
      const isDefault = sub.lang === "tr" && lang !== "original";
      return `<track label="${sub.label}" kind="subtitles" srclang="${sub.lang}" src="${subProxyUrl}" ${isDefault ? "default" : ""}>`;
    })
    .join("\n        ");

  const playerHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${displayTitle} ${mediaType === "tv" ? `- ${season}. Sezon ${episode}. Bölüm` : ""}</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@1"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%; background: #000; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #player-container {
      position: relative; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center; background: #000;
    }
    video {
      width: 100%; height: 100%; object-fit: contain; background: #000;
    }
    #loader {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: #0b0c15; display: flex; flex-direction: column;
      align-items: center; justify-content: center; z-index: 20;
      transition: opacity 0.3s ease; cursor: pointer;
    }
    .spinner {
      width: 48px; height: 48px; border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: #f59e0b; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { color: #fff; font-size: 14px; font-weight: 600; }
    .play-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 24px; background: #f59e0b; color: #000;
      font-size: 14px; font-weight: bold; border-radius: 9999px; margin-top: 14px;
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
    }
    .info-bar {
      position: absolute; top: 12px; left: 12px; z-index: 15;
      display: flex; align-items: center; gap: 8px; pointer-events: none;
    }
    .badge {
      font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.15); color: #fff;
    }
    .badge-provider { background: rgba(245, 158, 11, 0.85); color: #000; border: none; }
  </style>
</head>
<body>
  <div id="player-container">
    <div class="info-bar">
      <span class="badge badge-provider">🐝 DiziBal HLS HD</span>
      <span class="badge">${mediaType === "tv" ? `S${season}:B${episode}` : "1080p"}</span>
      <span class="badge" style="color:#10b981;">✓ Çift Ses & Altyazı</span>
    </div>

    <div id="loader" onclick="startPlay()">
      <div class="spinner"></div>
      <div class="loading-text">Yayın Yükleniyor...</div>
      <div class="play-badge">▶ Başlat</div>
    </div>

    <video
      id="video"
      playsinline
      controls
      crossorigin="anonymous"
      poster="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80"
    >
      ${tracksHtml}
    </video>
  </div>

  <script>
    const video = document.getElementById('video');
    const loader = document.getElementById('loader');
    const streamSource = "${proxiedMasterStream}";
    let started = false;

    function hideLoader() {
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 300);
      }
    }

    function startPlay() {
      started = true;
      video.play().then(hideLoader).catch(() => {});
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hls.loadSource(streamSource);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
        // Automatically select Turkish audio track if available
        if (data.audioTracks && data.audioTracks.length > 0) {
          const trIndex = data.audioTracks.findIndex(t => /turk|türk|tr/i.test(t.name || t.lang));
          if (trIndex !== -1) {
            hls.audioTrack = trIndex;
          }
        }
        hideLoader();
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, function(event, data) {
        if (data.fatal) {
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS Native HLS
      video.src = streamSource;
      video.addEventListener('loadedmetadata', function() {
        hideLoader();
        video.play().catch(() => {});
      });
    }

    video.addEventListener('playing', hideLoader);
    video.addEventListener('canplay', hideLoader);
  </script>
</body>
</html>`;

  return new NextResponse(playerHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}
