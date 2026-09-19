export interface ArtplayerOptions {
  title: string;
  originalTitle?: string | null;
  mediaType: "movie" | "tv";
  season?: number;
  episode?: number;
  tmdbId?: number | null;
  lang: "tr_dub" | "tr_sub" | "original";
  masterStreamUrl: string;
  subtitles?: Array<{ label: string; lang: string; file: string }>;
  referer: string;
  provider: string;
  badge?: string;
  themeColor?: string;
}

export function renderArtplayerHtml(opts: ArtplayerOptions): string {
  const {
    title,
    mediaType,
    season = 1,
    episode = 1,
    tmdbId,
    lang,
    masterStreamUrl,
    subtitles = [],
    referer,
    provider,
    badge = "HD",
    themeColor = "#e50914",
  } = opts;

  const displayTitle = mediaType === "tv"
    ? `${title} - ${season}. Sezon ${episode}. Bölüm`
    : title;

  // Subtitle should ONLY be enabled by default if user selected "tr_sub" (Altyazılı).
  // In "tr_dub" (Dublaj) or "original" mode, subtitle is OFF by default.
  const isSubLanguage = (lang === "tr_sub");

  const subtitleTracks = subtitles.map((sub) => {
    const absFile = sub.file.startsWith("http")
      ? sub.file
      : new URL(sub.file, referer).href;
    const subProxyUrl = `/api/player/stream-proxy?ref=${encodeURIComponent(referer)}&url=${encodeURIComponent(absFile)}`;
    const isDefault = isSubLanguage && (sub.lang === "tr" || subtitles.length === 1);
    return {
      name: sub.label || (sub.lang === "tr" ? "Türkçe" : sub.lang.toUpperCase()),
      lang: sub.lang,
      url: subProxyUrl,
      isDefault,
    };
  });

  const defaultSub = isSubLanguage
    ? (subtitleTracks.find((s) => s.isDefault) || (subtitleTracks.length > 0 ? subtitleTracks[0] : null))
    : null;

  const storageKey = `sinetrack_resume_${mediaType}_${tmdbId || encodeURIComponent(title)}_${season}_${episode}`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${displayTitle} | SineTrack Player</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@1"></script>
  <script src="https://cdn.jsdelivr.net/npm/artplayer@5/dist/artplayer.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/artplayer-plugin-hls-control@1/dist/artplayer-plugin-hls-control.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%; background: #000; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    #player-wrapper {
      position: relative; width: 100%; height: 100%; background: #000; overflow: hidden;
    }
    #artplayer {
      width: 100%; height: 100%; background: #000;
    }
    /* Top Bar Overlay */
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
      z-index: 25;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    #player-wrapper:hover #top-bar,
    .art-hover #top-bar,
    .art-control-show #top-bar {
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
    .badge-prov {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      background: ${themeColor};
      color: #fff;
      white-space: nowrap;
    }
    .badge-sub {
      background: rgba(255,255,255,0.18);
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
    }
    .title-text {
      font-size: 12px;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 260px;
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
    /* Artplayer Custom UI Overrides */
    .art-notice {
      background: rgba(12, 14, 24, 0.9) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      backdrop-filter: blur(12px) !important;
      border-radius: 10px !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
      padding: 10px 18px !important;
    }
    .art-subtitle {
      text-shadow: 0 2px 5px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.9) !important;
      font-weight: 700 !important;
      margin-bottom: 24px !important;
    }
    .art-btn-next {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 800;
      color: #fff;
      background: #e50914;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(229, 9, 20, 0.4);
    }
    .art-btn-next:hover {
      background: #f43f5e;
      transform: scale(1.04);
    }
  </style>
</head>
<body>
  <div id="player-wrapper">
    <div id="top-bar">
      <div class="title-info">
        <span class="badge-prov">${badge}</span>
        <span class="badge-sub" id="top-res">${mediaType === "tv" ? `S${season}:B${episode}` : "HD"}</span>
        <span class="title-text">${title}</span>
      </div>
      <div class="controls-right">
        <button class="btn-fs" onclick="toggleArtFullscreen()" title="Tam Ekran">
          <span>⛶</span>
          <span style="font-size:10px;">Tam Ekran</span>
        </button>
      </div>
    </div>

    <div id="artplayer"></div>
  </div>

  <script>
    const streamSource = "${masterStreamUrl}";
    const mediaType = "${mediaType}";
    const storageKey = "${storageKey}";
    let currentLang = "${lang}";
    const subtitleTracks = ${JSON.stringify(subtitleTracks)};
    const defaultSub = ${JSON.stringify(defaultSub)};

    function notify(type, extra) {
      try {
        window.parent.postMessage(Object.assign({ type: type, source: "${provider}" }, extra || {}), "*");
      } catch(e) {}
    }

    // Standardized resolution formatter (handles 2.35:1 widescreen formats like 1280x544 -> 720P HD)
    function formatResolution(level) {
      if (!level) return 'HD';
      const w = level.width || 0;
      const h = level.height || 0;
      if (w >= 3800 || h >= 2000) return '4K UHD';
      if (w >= 2500 || h >= 1400) return '2K QHD';
      if (w >= 1800 || h >= 800) return '1080P Full HD';
      if (w >= 1200 || h >= 500) return '720P HD';
      if (w >= 800 || h >= 400) return '480P';
      if (w >= 600 || h >= 300) return '360P';
      return h ? h + 'P' : (level.name || 'HD');
    }

    // Resume position resolver
    const searchParams = new URLSearchParams(window.location.search);
    const urlTime = parseFloat(searchParams.get('t') || '0');
    let savedLocalTime = 0;
    try {
      savedLocalTime = parseFloat(localStorage.getItem(storageKey) || '0');
    } catch(e) {}
    const targetResumeTime = (urlTime > 0) ? urlTime : (savedLocalTime > 5 ? savedLocalTime : 0);

    let didResume = false;
    function attemptResume(artInstance) {
      if (didResume || !targetResumeTime || targetResumeTime < 5) return;
      if (artInstance.duration && targetResumeTime >= artInstance.duration - 15) return;
      didResume = true;
      artInstance.currentTime = targetResumeTime;
      const m = Math.floor(targetResumeTime / 60);
      const s = Math.floor(targetResumeTime % 60);
      const fmt = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      artInstance.notice.show = 'Kaldığınız yerden devam ediliyor (' + fmt + ')';
    }

    // Initialize Artplayer
    const art = new Artplayer({
      container: '#artplayer',
      url: streamSource,
      type: 'm3u8',
      title: "${displayTitle}",
      theme: "${themeColor}",
      lang: 'tr',
      i18n: {
        'tr': {
          Play: 'Oynat',
          Pause: 'Duraklat',
          Mute: 'Sessiz',
          Volume: 'Ses',
          Fullscreen: 'Tam Ekran',
          'Exit Fullscreen': 'Tam Ekrandan Çık',
          'Web Fullscreen': 'Pencere Tam Ekranı',
          'Exit Web Fullscreen': 'Pencere Tam Ekranından Çık',
          Settings: 'Ayarlar',
          'Play Speed': 'Oynatma Hızı',
          Normal: 'Normal',
          'Aspect Ratio': 'En-Boy Oranı',
          Default: 'Varsayılan',
          'Picture in Picture': 'Pencere İçinde Pencere',
          Screenshot: 'Ekran Görüntüsü',
          Subtitle: 'Altyazı',
          'Subtitle Offset': 'Altyazı Senkronu',
          Flip: 'Çevir',
          Horizontal: 'Yatay',
          Vertical: 'Dikey',
          Restart: 'Yeniden Başlat',
        }
      },
      volume: 0.9,
      isLive: false,
      muted: false,
      autoplay: true,
      autoOrientation: true,
      pip: true,
      autoSize: false,
      autoMini: false,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      plugins: [
        typeof artplayerPluginHlsControl !== 'undefined' ? artplayerPluginHlsControl({
          quality: {
            control: true,
            setting: true,
            title: 'Kalite',
            auto: 'Otomatik',
            getName: formatResolution,
          },
          audio: {
            control: true,
            setting: true,
            title: 'Ses Dili',
            auto: 'Varsayılan',
            getName: function(track) {
              const name = (track.name || track.lang || '').toLowerCase();
              if (name.includes('tur') || name.includes('tr')) return '🇹🇷 Türkçe Dublaj';
              if (name.includes('eng') || name.includes('en') || name.includes('orig')) return '🌐 Orijinal Ses';
              return track.name || track.lang || 'Ses';
            }
          }
        }) : function() {}
      ],
      customType: {
        m3u8: function(video, url, artInstance) {
          if (Hls.isSupported()) {
            if (artInstance.hls) artInstance.hls.destroy();
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 90,
              maxBufferLength: 60,
            });
            hls.loadSource(url);
            hls.attachMedia(video);
            artInstance.hls = hls;
            artInstance.on('destroy', () => hls.destroy());

            function triggerPluginUpdate() {
              try {
                if (artInstance.plugins && artInstance.plugins.artplayerPluginHlsControl && typeof artInstance.plugins.artplayerPluginHlsControl.update === 'function') {
                  artInstance.plugins.artplayerPluginHlsControl.update();
                }
              } catch(e) {}
            }

            hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
              notify("STREAM_READY");

              // Update top-bar badge with actual detected stream resolution
              const topRes = document.getElementById('top-res');
              if (topRes && mediaType !== 'tv' && hls.levels && hls.levels.length > 0) {
                const bestLevel = hls.levels.reduce((prev, curr) => ((curr.width || 0) > (prev.width || 0) ? curr : prev), hls.levels[0]);
                topRes.textContent = formatResolution(bestLevel);
              }

              // Check audio tracks
              if (hls.audioTracks && hls.audioTracks.length > 0) {
                const isDub = (currentLang === "tr_dub");
                const trIndex = hls.audioTracks.findIndex(t => /turk|türk|tr/i.test(t.name || t.lang));
                const origIndex = hls.audioTracks.findIndex(t => !/turk|türk|tr/i.test(t.name || t.lang));
                if (isDub && trIndex !== -1) {
                  hls.audioTrack = trIndex;
                } else if (!isDub && origIndex !== -1) {
                  hls.audioTrack = origIndex;
                }
              }
              triggerPluginUpdate();
              attemptResume(artInstance);
            });

            hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, triggerPluginUpdate);
            hls.on(Hls.Events.LEVEL_LOADED, triggerPluginUpdate);

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
            video.src = url;
            video.addEventListener('loadedmetadata', function() {
              notify("STREAM_READY");
              attemptResume(artInstance);
            });
          } else {
            artInstance.notice.show = 'Tarayıcınız bu akış formatını desteklemiyor.';
          }
        }
      },
      subtitle: {
        url: defaultSub ? defaultSub.url : '',
        type: 'vtt',
        style: {
          color: '#ffffff',
          fontSize: '20px',
          textShadow: '0 2px 4px #000, 0 0 2px #000',
          fontWeight: '700',
          marginBottom: '24px',
        },
        encoding: 'utf-8',
      },
    });

    function toggleArtFullscreen() {
      if (art) art.fullscreen = !art.fullscreen;
    }

    // 10s Rewind and 10s Forward controls
    art.controls.add({
      name: 'backward-10',
      position: 'left',
      index: 10,
      html: '<span style="font-size:13px;cursor:pointer;opacity:0.85;display:inline-flex;align-items:center;padding:0 4px;" title="10 Saniye Geri">↺10</span>',
      tooltip: '10 Saniye Geri',
      click: function() {
        art.currentTime = Math.max(0, art.currentTime - 10);
      },
    });

    art.controls.add({
      name: 'forward-10',
      position: 'left',
      index: 11,
      html: '<span style="font-size:13px;cursor:pointer;opacity:0.85;display:inline-flex;align-items:center;padding:0 4px;" title="10 Saniye İleri">10↻</span>',
      tooltip: '10 Saniye İleri',
      click: function() {
        art.currentTime = Math.min(art.duration || Infinity, art.currentTime + 10);
      },
    });

    // TV Series Next Episode Control
    if (mediaType === 'tv') {
      art.controls.add({
        name: 'next-episode',
        position: 'left',
        index: 25,
        html: '<span class="art-btn-next">Sonraki Bölüm ▶</span>',
        tooltip: 'Sonraki Bölüme Geç',
        click: function() {
          notify('NEXT_EPISODE');
        },
      });
    }

    // Subtitles selector in control bar if subtitles exist
    if (subtitleTracks.length > 0) {
      const subSelector = [
        { html: 'Altyazı Kapat', value: '', default: !defaultSub },
        ...subtitleTracks.map(s => ({
          html: s.name,
          value: s.url,
          default: defaultSub ? s.url === defaultSub.url : false,
        }))
      ];

      art.controls.add({
        name: 'subtitles-selector',
        position: 'right',
        index: 12,
        html: '💬 Altyazı',
        tooltip: 'Altyazı',
        selector: subSelector,
        onSelect: function(item) {
          if (item.value) {
            art.subtitle.switch(item.value, { name: item.html });
            art.subtitle.show = true;
            art.notice.show = 'Altyazı: ' + item.html;
          } else {
            art.subtitle.show = false;
            art.notice.show = 'Altyazı Kapatıldı';
          }
          return item.html;
        }
      });
    }

    // Event Listeners
    art.on('ready', function() {
      // If not in subtitle mode, ensure subtitle is hidden
      if (!defaultSub && art.subtitle) {
        art.subtitle.show = false;
      }
      attemptResume(art);
    });

    art.on('video:canplay', function() {
      attemptResume(art);
    });

    art.on('video:playing', function() {
      notify('STREAM_PLAYING');
      attemptResume(art);
    });

    art.on('video:ended', function() {
      try {
        localStorage.removeItem(storageKey);
      } catch(e) {}
      if (mediaType === 'tv') {
        notify('NEXT_EPISODE');
      }
    });

    // Time Update & Resume Saving
    let lastSavedSec = 0;
    art.on('video:timeupdate', function() {
      const currentSec = Math.floor(art.currentTime);
      if (currentSec > 0 && currentSec !== lastSavedSec) {
        lastSavedSec = currentSec;
        try {
          localStorage.setItem(storageKey, currentSec.toString());
        } catch(e) {}
        notify('TIME_UPDATE', { currentTime: art.currentTime, duration: art.duration });
      }
    });

    // Listen for parent window messages (Language change without reload)
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'CHANGE_LANGUAGE') {
        const newLang = e.data.lang;
        currentLang = newLang;
        const isDub = (newLang === "tr_dub");

        // Altyazı durumunu senkronize et
        if (art && art.subtitle) {
          if (isDub) {
            art.subtitle.show = false;
            art.notice.show = 'Dublaj Modu: Altyazı Kapatıldı';
          } else if (subtitleTracks.length > 0) {
            const trSub = subtitleTracks.find(s => s.lang === 'tr') || subtitleTracks[0];
            if (trSub) {
              art.subtitle.switch(trSub.url, { name: trSub.name });
              art.subtitle.show = true;
              art.notice.show = 'Altyazı: ' + trSub.name;
            }
          }
        }

        // Ses kanalını senkronize et
        if (art && art.hls && art.hls.audioTracks && art.hls.audioTracks.length > 1) {
          const trIndex = art.hls.audioTracks.findIndex(t => /turk|türk|tr/i.test(t.name || t.lang));
          const origIndex = art.hls.audioTracks.findIndex(t => !/turk|türk|tr/i.test(t.name || t.lang));
          if (isDub && trIndex !== -1) {
            art.hls.audioTrack = trIndex;
            art.notice.show = 'Ses Dili: Türkçe Dublaj';
            return;
          } else if (!isDub && origIndex !== -1) {
            art.hls.audioTrack = origIndex;
            art.notice.show = 'Ses Dili: Orijinal Ses';
            return;
          }
        }

        // Fallback: If not dual-audio or cannot switch live, reload with ?t=
        const url = new URL(window.location.href);
        url.searchParams.set('lang', newLang);
        if (art && art.currentTime > 5) {
          url.searchParams.set('t', Math.floor(art.currentTime).toString());
        }
        window.location.href = url.toString();
      }
    });
  </script>
</body>
</html>`;
}
