export interface EmbedServer {
  id: string;
  name: string;
  badge?: string;
  language: "tr_dub" | "tr_sub" | "original";
  getUrl: (params: {
    mediaType: "movie" | "tv";
    tmdbId: number;
    season?: number;
    episode?: number;
    title?: string;
  }) => string;
}

export function formatEpisodeUrl(
  templateUrl: string | null | undefined,
  params: {
    tmdbId?: number | null;
    season?: number;
    episode?: number;
    mediaType?: "movie" | "tv";
    title?: string;
  }
): string {
  if (!templateUrl || !templateUrl.trim()) return "";
  const { tmdbId, season = 1, episode = 1, mediaType = "movie", title = "" } = params;
  if (mediaType === "movie") return templateUrl;

  let formatted = templateUrl;
  formatted = formatted.replace(/{season}/gi, season.toString());
  formatted = formatted.replace(/{episode}/gi, episode.toString());
  formatted = formatted.replace(/{title}/gi, encodeURIComponent(title));

  if (tmdbId) {
    formatted = formatted.replace(
      new RegExp(`(/tv/${tmdbId})/\\d+/\\d+`, "i"),
      `$1/${season}/${episode}`
    );
  } else {
    formatted = formatted.replace(/(\/tv\/[^/?#]+)\/\d+\/\d+/i, `$1/${season}/${episode}`);
  }

  formatted = formatted.replace(/([?&]s=)\d+(&e=)\d+/i, `$1${season}$2${episode}`);
  formatted = formatted.replace(/([?&]s=)\d+(&[^e]|$)/i, `$1${season}$2`);
  formatted = formatted.replace(/([?&]e=)\d+/i, `$1${episode}`);

  if (tmdbId) {
    formatted = formatted.replace(new RegExp(`(${tmdbId})-\\d+-\\d+`, "i"), `$1-${season}-${episode}`);
  }

  return formatted;
}

export function parseSmartVideoUrl(rawUrl: string | null | undefined): {
  url: string;
  isDirectVideo: boolean;
} {
  if (!rawUrl || !rawUrl.trim()) return { url: "", isDirectVideo: false };

  let cleanUrl = rawUrl.trim();

  const iframeMatch = cleanUrl.match(/src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) cleanUrl = iframeMatch[1];

  const ytWatchMatch = cleanUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i);
  if (ytWatchMatch && ytWatchMatch[1]) {
    return { url: `https://www.youtube.com/embed/${ytWatchMatch[1]}?autoplay=1&rel=0`, isDirectVideo: false };
  }

  const driveMatch = cleanUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    return { url: `https://drive.google.com/file/d/${driveMatch[1]}/preview`, isDirectVideo: false };
  }

  if (cleanUrl.includes("mixdrop.") && cleanUrl.includes("/f/")) cleanUrl = cleanUrl.replace("/f/", "/e/");
  if (cleanUrl.includes("streamtape.") && cleanUrl.includes("/v/")) cleanUrl = cleanUrl.replace("/v/", "/e/");
  if (cleanUrl.includes("dood.") && cleanUrl.includes("/d/")) cleanUrl = cleanUrl.replace("/d/", "/e/");

  const isDirect =
    cleanUrl.endsWith(".mp4") || cleanUrl.endsWith(".webm") || cleanUrl.endsWith(".m3u8") ||
    cleanUrl.includes(".mp4?") || cleanUrl.includes(".m3u8?");

  return { url: cleanUrl, isDirectVideo: isDirect };
}

export const EMBED_SERVERS: EmbedServer[] = [
  // --- TURKCE ALTYAZILI (tr_sub) ---
  {
    id: "atom-player-sub",
    name: "⚡ Dizipal & Dizilla / Atom",
    badge: "1080p • Takılmasız",
    language: "tr_sub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1, title = "" }) =>
      mediaType === "movie"
        ? `/api/player/atom-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}`
        : `/api/player/dizi-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&season=${season}&episode=${episode}&lang=tr_sub`,
  },
  {
    id: "hdf-player-sub",
    name: "🔥 HDFilmCehennemi",
    badge: "1080p • Altyazılı",
    language: "tr_sub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1, title = "" }) =>
      mediaType === "movie"
        ? `/api/player/hdf-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&mediaType=movie&lang=tr_sub`
        : `/api/player/hdf-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&season=${season}&episode=${episode}&mediaType=tv&lang=tr_sub`,
  },
  {
    id: "vidlink-pro",
    name: "VidLink Pro",
    badge: "Onerilen - Full HD - CC Altyazi",
    language: "tr_sub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://vidlink.pro/movie/${tmdbId}?primaryColor=e50914`
        : `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=e50914`,
  },
  {
    id: "videasy",
    name: "Videasy",
    badge: "4K / OpenSubtitles",
    language: "tr_sub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://player.videasy.net/movie/${tmdbId}`
        : `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "vidsrc-to",
    name: "VidSrc.to",
    badge: "Genis Arsiv",
    language: "tr_sub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "vidsrc-cc",
    name: "VidSrc.cc",
    badge: "v2 Sunucu",
    language: "tr_sub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "embed-su",
    name: "Embed.su",
    badge: "Stabil",
    language: "tr_sub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://embed.su/embed/movie/${tmdbId}`
        : `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    badge: "TMDB Tabanli",
    language: "tr_sub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://autoembed.to/movie/tmdb/${tmdbId}`
        : `https://autoembed.to/tv/tmdb/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "2embed",
    name: "2Embed",
    badge: "Yedek Sunucu",
    language: "tr_sub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://www.2embed.cc/embed/${tmdbId}`
        : `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
  },
  {
    id: "superembed",
    name: "SuperEmbed",
    badge: "Coklu Kaynak",
    language: "tr_sub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://www.superembed.stream/embed/movie?tmdb=${tmdbId}`
        : `https://www.superembed.stream/embed/tv?tmdb=${tmdbId}&s=${season}&e=${episode}`,
  },
  {
    id: "multiembed-sub",
    name: "MultiEmbed TR",
    badge: "Turkce Altyazi",
    language: "tr_sub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&sub=Turkish`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}&sub=Turkish`,
  },
  {
    id: "smashystream",
    name: "SmashyStream",
    badge: "Yeni Sunucu",
    language: "tr_sub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://player.smashy.stream/movie/${tmdbId}`
        : `https://player.smashy.stream/tv/${tmdbId}?s=${season}&e=${episode}`,
  },

  // --- TURKCE DUBLAJ (tr_dub) ---
  {
    id: "atom-player-dub",
    name: "⚡ Dizipal & Dizilla / Atom",
    badge: "1080p • Türkçe Dublaj",
    language: "tr_dub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1, title = "" }) =>
      mediaType === "movie"
        ? `/api/player/atom-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}`
        : `/api/player/dizi-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&season=${season}&episode=${episode}&lang=tr_dub`,
  },
  {
    id: "hdf-player-dub",
    name: "🔥 HDFilmCehennemi",
    badge: "1080p • Türkçe Dublaj",
    language: "tr_dub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1, title = "" }) =>
      mediaType === "movie"
        ? `/api/player/hdf-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&mediaType=movie&lang=tr_dub`
        : `/api/player/hdf-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&season=${season}&episode=${episode}&mediaType=tv&lang=tr_dub`,
  },
  {
    id: "dub-multiembed",
    name: "MultiEmbed TR Ses",
    badge: "Turkce Ses (Mevcutsa)",
    language: "tr_dub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&audio=tr`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}&audio=tr`,
  },
  {
    id: "dub-vidlink",
    name: "VidLink Coklu Ses",
    badge: "Full HD - Coklu Dil",
    language: "tr_dub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://vidlink.pro/movie/${tmdbId}?multiLang=1`
        : `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?multiLang=1`,
  },
  {
    id: "dub-videasy",
    name: "Videasy TR Ses",
    badge: "Hizli",
    language: "tr_dub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://player.videasy.net/movie/${tmdbId}?audio=tr`
        : `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}?audio=tr`,
  },
  {
    id: "dub-vidsrc",
    name: "VidSrc.to TR Ses",
    badge: "Coklu Ses",
    language: "tr_dub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "dub-embed-su",
    name: "Embed.su TR Ses",
    badge: "Yedek Dublaj",
    language: "tr_dub",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://embed.su/embed/movie/${tmdbId}`
        : `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,
  },

  // --- ORIJINAL DIL (original) ---
  {
    id: "orig-videasy",
    name: "Videasy Orijinal",
    badge: "4K/1080p",
    language: "original",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://player.videasy.net/movie/${tmdbId}`
        : `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "orig-vidlink",
    name: "VidLink Orijinal",
    badge: "Global HD",
    language: "original",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://vidlink.pro/movie/${tmdbId}`
        : `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "orig-vidsrc",
    name: "VidSrc.to Orijinal",
    badge: "Hizli",
    language: "original",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "orig-embed-su",
    name: "Embed.su Orijinal",
    badge: "Stabil",
    language: "original",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://embed.su/embed/movie/${tmdbId}`
        : `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "orig-autoembed",
    name: "AutoEmbed Orijinal",
    badge: "TMDB",
    language: "original",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://autoembed.to/movie/tmdb/${tmdbId}`
        : `https://autoembed.to/tv/tmdb/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "orig-smashy",
    name: "SmashyStream Orijinal",
    badge: "Yeni",
    language: "original",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://player.smashy.stream/movie/${tmdbId}`
        : `https://player.smashy.stream/tv/${tmdbId}?s=${season}&e=${episode}`,
  },
  {
    id: "orig-superembed",
    name: "SuperEmbed Orijinal",
    badge: "Coklu Kaynak",
    language: "original",
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://www.superembed.stream/embed/movie?tmdb=${tmdbId}`
        : `https://www.superembed.stream/embed/tv?tmdb=${tmdbId}&s=${season}&e=${episode}`,
  },
];
