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

  const tracksHtml = subtitles
    .map((sub) => {
      const absFile = sub.file.startsWith("http") ? sub.file : new URL(sub.file, referer).href;
      const subProxyUrl = `/api/player/stream-proxy?ref=${encodeURIComponent(referer)}&url=${encodeURIComponent(absFile)}`;
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
    /* Top Bar */
    #top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 10px 14px;
      background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none !important;
    }
    #player-container:hover #top-bar {
      opacity: 1;
    }
    @media (max-width: 640px) {
      #top-bar {
        padding-left: 64px !important;
      }
    }
    .title-info {
      color: #fff;
      font-size: 12px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      pointer-events: none;
    }
    .badge {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f59e0b;
      color: #000;
      shrink: 0;
    }
    .badge-sub {
      background: rgba(255,255,255,0.15);
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      shrink: 0;
    }
    .controls-right {
      display: flex;
      align-items: center;
      gap: 6px;
      pointer-events: auto;
    }
    .btn-fs {
      background: rgba(255,255,255,0.15);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.25);
      padding: 4px 9px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      backdrop-filter: blur(8px);
      transition: all 0.2s;
    }
    .btn-fs:hover {
      background: rgba(255,255,255,0.3);
    }
  </style>
</head>
<body>
  <div id="player-container">
    <div id="top-bar">
      <div class="title-info">
        <span class="badge">🐝 DiziBal HD</span>
        <span class="badge-sub">${mediaType === "tv" ? `S${season}:B${episode}` : "1080p"}</span>
        <span style="font-size:11px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${displayTitle}</span>
      </div>
      <div class="controls-right">
        <button class="btn-fs" onclick="toggleFs()" title="Tam Ekran">
          <span>⛶</span>
          <span style="font-size:10px;">Tam Ekran</span>
        </button>
      </div>
    </div>

    <div id="loader" onclick="startPlay()">
      <div class="spinner"></div>
      <div class="loading-text">Yayın Yükleniyor...</div>
      <div class="play-badge">▶ Başlat</div>
    </div>

    <video
      id="video"
      playsinline
      webkit-playsinline
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

    function notify(type, extra) {
      try {
        window.parent.postMessage(Object.assign({ type: type, source: "dizibal-embed" }, extra || {}), "*");
      } catch(e) {}
    }

    function toggleFs() {
      if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      } else if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      }
    }

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
        notify("STREAM_READY");
        if (data.audioTracks && data.audioTracks.length > 0) {
          const isDub = "${lang}" === "tr_dub";
          const trIndex = data.audioTracks.findIndex(t => /turk|türk|tr/i.test(t.name || t.lang));
          const origIndex = data.audioTracks.findIndex(t => !/turk|türk|tr/i.test(t.name || t.lang));
          if (isDub && trIndex !== -1) {
            hls.audioTrack = trIndex;
          } else if (!isDub && origIndex !== -1) {
            hls.audioTrack = origIndex;
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
              notify("STREAM_ERROR", { reason: data.type });
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS Native HLS
      video.src = streamSource;
      video.addEventListener('loadedmetadata', function() {
        notify("STREAM_READY");
        hideLoader();
        video.play().catch(() => {});
      });
    }

    video.addEventListener('playing', function() {
      notify("STREAM_PLAYING");
      hideLoader();
    });
    video.addEventListener('canplay', hideLoader);
    video.addEventListener('error', function(e) {
      notify("STREAM_ERROR", { reason: "VIDEO_ELEMENT_ERROR" });
    });
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
