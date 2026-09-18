export interface EmbedServer {
  id: string;
  name: string;
  badge?: string;
  language: "tr_dub" | "tr_sub" | "original";
  supportedMediaTypes?: ("movie" | "tv")[];
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
    supportedMediaTypes: ["movie", "tv"],
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
    supportedMediaTypes: ["movie", "tv"],
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1, title = "" }) =>
      mediaType === "movie"
        ? `/api/player/hdf-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&mediaType=movie&lang=tr_sub`
        : `/api/player/hdf-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&season=${season}&episode=${episode}&mediaType=tv&lang=tr_sub`,
  },
  {
    id: "turbofilmizle-sub",
    name: "🚀 TurboFilmizle",
    badge: "HotStream HD",
    language: "tr_sub",
    supportedMediaTypes: ["movie"], // Movie only
    getUrl: ({ title = "", tmdbId }) =>
      `/api/player/turbo-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}`,
  },
  {
    id: "multiembed-sub",
    name: "🌐 MultiEmbed TR",
    badge: "Türkçe Altyazı • Kesintisiz",
    language: "tr_sub",
    supportedMediaTypes: ["movie", "tv"],
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&sub=Turkish`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}&sub=Turkish`,
  },
  {
    id: "videasy-sub",
    name: "🎬 Videasy TR",
    badge: "4K / 1080p",
    language: "tr_sub",
    supportedMediaTypes: ["movie", "tv"],
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://player.videasy.to/movie/${tmdbId}`
        : `https://player.videasy.to/tv/${tmdbId}/${season}/${episode}`,
  },

  // --- TURKCE DUBLAJ (tr_dub) ---
  {
    id: "atom-player-dub",
    name: "⚡ Dizipal & Dizilla / Atom",
    badge: "1080p • Türkçe Dublaj",
    language: "tr_dub",
    supportedMediaTypes: ["movie", "tv"],
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
    supportedMediaTypes: ["movie", "tv"],
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1, title = "" }) =>
      mediaType === "movie"
        ? `/api/player/hdf-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&mediaType=movie&lang=tr_dub`
        : `/api/player/hdf-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&season=${season}&episode=${episode}&mediaType=tv&lang=tr_dub`,
  },
  {
    id: "turbofilmizle-dub",
    name: "🚀 TurboFilmizle Dublaj",
    badge: "HotStream HD Dublaj",
    language: "tr_dub",
    supportedMediaTypes: ["movie"], // Movie only
    getUrl: ({ title = "", tmdbId }) =>
      `/api/player/turbo-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}`,
  },
  {
    id: "multiembed-dub",
    name: "🌐 MultiEmbed Dublaj",
    badge: "Türkçe Ses • Kesintisiz",
    language: "tr_dub",
    supportedMediaTypes: ["movie", "tv"],
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&audio=tr`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}&audio=tr`,
  },

  // --- ORIJINAL DIL (original) ---
  {
    id: "atom-player-orig",
    name: "⚡ Dizipal & Dizilla / Atom",
    badge: "Orijinal Dil",
    language: "original",
    supportedMediaTypes: ["movie", "tv"],
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1, title = "" }) =>
      mediaType === "movie"
        ? `/api/player/atom-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}`
        : `/api/player/dizi-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&season=${season}&episode=${episode}&lang=original`,
  },
  {
    id: "hdf-player-orig",
    name: "🔥 HDFilmCehennemi Orijinal",
    badge: "Orijinal Dil",
    language: "original",
    supportedMediaTypes: ["movie", "tv"],
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1, title = "" }) =>
      mediaType === "movie"
        ? `/api/player/hdf-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&mediaType=movie&lang=original`
        : `/api/player/hdf-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}&season=${season}&episode=${episode}&mediaType=tv&lang=original`,
  },
  {
    id: "turbofilmizle-orig",
    name: "🚀 TurboFilmizle Orijinal",
    badge: "Orijinal Ses",
    language: "original",
    supportedMediaTypes: ["movie"], // Movie only
    getUrl: ({ title = "", tmdbId }) =>
      `/api/player/turbo-embed?title=${encodeURIComponent(title)}&tmdbId=${tmdbId}`,
  },
  {
    id: "multiembed-orig",
    name: "🌐 MultiEmbed Orijinal",
    badge: "Orijinal Dil",
    language: "original",
    supportedMediaTypes: ["movie", "tv"],
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
  },
  {
    id: "videasy-orig",
    name: "🎬 Videasy Orijinal",
    badge: "1080p",
    language: "original",
    supportedMediaTypes: ["movie", "tv"],
    getUrl: ({ mediaType, tmdbId, season = 1, episode = 1 }) =>
      mediaType === "movie"
        ? `https://player.videasy.to/movie/${tmdbId}`
        : `https://player.videasy.to/tv/${tmdbId}/${season}/${episode}`,
  },
];
