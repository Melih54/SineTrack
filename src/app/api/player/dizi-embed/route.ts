import { NextResponse } from "next/server";
import { resolveSeriesEpisode, SeriesStreamSource } from "@/lib/series-resolver";
import { resolveHdfMovie } from "@/lib/hdfilmcehennemi-resolver";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "";
  const originalTitle = searchParams.get("originalTitle") || null;
  const mediaType = searchParams.get("mediaType") || "tv";
  const isMovie = mediaType === "movie";
  const season = parseInt(searchParams.get("season") || "1", 10);
  const episode = parseInt(searchParams.get("episode") || "1", 10);
  const lang = (searchParams.get("lang") || "tr_dub") as "tr_dub" | "tr_sub" | "original";

  let matched: SeriesStreamSource | null = null;

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
      </body>
      </html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const subtitles = matched.subtitles || [];
  const masterStreamUrl = `/api/player/dizi-m3u8?title=${encodeURIComponent(title)}&season=${season}&episode=${episode}&mediaType=${mediaType}&lang=${lang}`;

  const tracksHtml = subtitles
    .map((sub) => {
      const subProxyUrl = `/api/player/stream-proxy?ref=${encodeURIComponent(matched!.referer)}&url=${encodeURIComponent(sub.file)}`;
      const isDefault = (lang === "tr_sub" || lang === "original") && sub.lang === "tr";
      return `<track label="${sub.label}" kind="subtitles" srclang="${sub.lang}" src="${subProxyUrl}" ${isDefault ? "default" : ""}>`;
    })
    .join("\n      ");

  const displaySubtitle = !isMovie ? `${season}. Sezon ${episode}. Bölüm • ` : "";
  const providerLabel = matched.provider || "HD";

  const playerHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title} ${!isMovie ? `- ${season}. Sezon ${episode}. Bölüm` : ""}</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@1"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      background: #000;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #player-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0b0c15;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    }
    /* Loading Spinner & Mobile Play Trigger */
    #loader {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: #0b0c15;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 20;
      transition: opacity 0.3s ease;
      cursor: pointer;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: #e50914;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-text {
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-align: center;
      padding: 0 16px;
    }
    .loading-sub {
      color: #94a3b8;
      font-size: 12px;
      margin-top: 6px;
      text-align: center;
    }
    .play-tap-hint {
      margin-top: 14px;
      padding: 8px 18px;
      background: #e50914;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      border-radius: 20px;
      box-shadow: 0 4px 14px rgba(229, 9, 20, 0.4);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.9; }
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
      pointer-events: none;
    }
    #player-container:hover #top-bar,
    #player-container:active #top-bar {
      opacity: 1;
      pointer-events: auto;
    }
    .title-info {
      color: #fff;
      font-size: 12px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .title-info span:last-child {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }
    @media (min-width: 640px) {
      .title-info span:last-child { max-width: 320px; font-size: 13px; }
    }
    .badge {
      background: #e50914;
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      shrink: 0;
    }
    .source-badge {
      background: rgba(255, 255, 255, 0.15);
      color: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      shrink: 0;
    }
    .lang-switcher {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      padding: 3px 5px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      shrink: 0;
    }
    .lang-btn {
      background: transparent;
      color: #cbd5e1;
      border: none;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .lang-btn:hover {
      color: #fff;
      background: rgba(255,255,255,0.1);
    }
    .lang-btn.active {
      background: #e50914;
      color: #fff;
      box-shadow: 0 2px 8px rgba(229, 9, 20, 0.4);
    }
  </style>
</head>
<body>
  <div id="player-container">
    <div id="loader" onclick="startManualPlayback()">
      <div class="spinner"></div>
      <div class="loading-text" id="loader-title">${title}</div>
      <div class="loading-sub" id="loader-sub">${displaySubtitle}${lang === "tr_dub" ? "Türkçe Dublaj" : "Türkçe Altyazı"} • ${providerLabel}</div>
      <div class="play-tap-hint" id="play-hint" style="display:none;">
        <span>▶ Başlatmak İçin Dokunun</span>
      </div>
    </div>

    <div id="top-bar">
      <div class="title-info">
        <span class="badge">1080P HD</span>
        <span class="source-badge">${providerLabel}</span>
        <span>${title} ${!isMovie ? `• ${season}. Sezon ${episode}. Bölüm` : ""}</span>
      </div>
      <div class="lang-switcher">
        <button class="lang-btn ${lang === "tr_dub" ? "active" : ""}" id="btn-dub" onclick="switchLang('tr_dub')">🇹🇷 Dublaj</button>
        <button class="lang-btn ${lang === "tr_sub" ? "active" : ""}" id="btn-sub" onclick="switchLang('tr_sub')">💬 Altyazı</button>
      </div>
    </div>

    <video id="video" controls playsinline webkit-playsinline x5-playsinline preload="auto">
      ${tracksHtml}
      Tarayıcınız HTML5 video etiketini desteklemiyor.
    </video>
  </div>

  <script>
    const video = document.getElementById('video');
    const loader = document.getElementById('loader');
    const playHint = document.getElementById('play-hint');
    const masterUrl = "${masterStreamUrl}";
    let hls = null;
    let isStarted = false;

    function hideLoader() {
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 250);
      }
    }

    function showPlayHint() {
      if (playHint) playHint.style.display = 'inline-flex';
    }

    function startManualPlayback() {
      isStarted = true;
      video.play().then(hideLoader).catch(hideLoader);
    }

    function initHls(sourceUrl) {
      if (Hls.isSupported()) {
        if (hls) {
          hls.destroy();
        }
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 4,
          levelLoadingTimeOut: 15000,
          fragLoadingTimeOut: 20000,
          xhrSetup: function(xhr) {
            xhr.withCredentials = false;
          }
        });

        hls.loadSource(sourceUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
          video.play().then(hideLoader).catch(function() {
            // Autoplay blocked on mobile, show tap hint
            showPlayHint();
            setTimeout(hideLoader, 2000);
          });
        });

        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, function(event, data) {
          const targetLang = "${lang}";
          if (hls.audioTracks && hls.audioTracks.length > 0) {
            const trTrack = hls.audioTracks.findIndex(t => (t.lang === 'tr' || (t.name && t.name.toLowerCase().includes('türk')) || (t.name && t.name.toLowerCase().includes('turkish'))));
            const enTrack = hls.audioTracks.findIndex(t => (t.lang === 'en' || (t.name && t.name.toLowerCase().includes('ing')) || (t.name && t.name.toLowerCase().includes('orig')) || (t.name && t.name.toLowerCase().includes('english'))));
            
            if (targetLang === 'tr_dub' && trTrack !== -1) {
              hls.audioTrack = trTrack;
            } else if (targetLang !== 'tr_dub' && enTrack !== -1) {
              hls.audioTrack = enTrack;
            }
          }
        });

        hls.on(Hls.Events.ERROR, function(event, data) {
          if (data.fatal) {
            switch(data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('HLS Network error, recovering...', data);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('HLS Media error, recovering...', data);
                hls.recoverMediaError();
                break;
              default:
                console.error('HLS Fatal error:', data);
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS for Safari (iOS & macOS)
        video.src = sourceUrl;
        video.addEventListener('loadedmetadata', hideLoader);
        video.addEventListener('canplay', hideLoader);
        video.play().then(hideLoader).catch(function() {
          showPlayHint();
          setTimeout(hideLoader, 2000);
        });
      }
    }

    video.addEventListener('playing', hideLoader);
    video.addEventListener('play', hideLoader);
    video.addEventListener('canplay', hideLoader);

    // Fallback: always hide loader after 3.5s so mobile controls are accessible
    setTimeout(hideLoader, 3500);

    initHls(masterUrl);

    function switchLang(newLang) {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', newLang);
      window.location.href = url.toString();
    }
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
