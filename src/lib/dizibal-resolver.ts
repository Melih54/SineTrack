import { execFileSync } from "child_process";
import { CURL_BIN } from "./curl";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface DizibalResolvedStream {
  title: string;
  tmdbId?: number;
  mediaType: "movie" | "tv";
  m3u8Url: string;
  referer: string;
  embedUrl: string;
  subtitles: Array<{
    label: string;
    lang: string;
    file: string;
  }>;
}

export async function resolveDizibalSource(params: {
  title: string;
  originalTitle?: string | null;
  tmdbId?: number | null;
  mediaType: "movie" | "tv";
  season?: number;
  episode?: number;
}): Promise<DizibalResolvedStream | null> {
  const { title, originalTitle, tmdbId, mediaType, season = 1, episode = 1 } = params;
  const queries = Array.from(new Set([title, originalTitle].filter(Boolean))) as string[];
  const isTv = mediaType === "tv";

  for (const q of queries) {
    try {
      const searchUrl = `https://dizibal.org/ara?q=${encodeURIComponent(q.trim())}`;
      const searchHtml = execFileSync(
        CURL_BIN,
        ["-s", "-L", "-A", CHROME_UA, "--connect-timeout", "8", "-m", "12", searchUrl],
        { timeout: 15000 }
      ).toString("utf8");

      const pattern = isTv
        ? /href="https:\/\/dizibal\.org\/series\/([^"\/]+)"/i
        : /href="https:\/\/dizibal\.org\/movie\/([^"\/]+)"/i;

      let match = searchHtml.match(pattern);
      if (!match && !isTv) {
        match = searchHtml.match(/href="https:\/\/dizibal\.org\/film\/([^"\/]+)"/i);
      }
      if (!match) continue;

      const slug = match[1];
      const targetUrl = isTv
        ? `https://dizibal.org/series/${slug}/season/${season}/episode/${episode}`
        : `https://dizibal.org/movie/${slug}`;

      const pageHtml = execFileSync(
        CURL_BIN,
        ["-s", "-L", "-A", CHROME_UA, "-H", "Referer: https://dizibal.org/", "--connect-timeout", "8", "-m", "14", targetUrl],
        { timeout: 15000 }
      ).toString("utf8");

      const pvMatch = pageHtml.match(/data-pv="([^"]+)"/i);
      if (!pvMatch) continue;

      const pvSlug = pvMatch[1];
      const sPhpUrl = `https://pilavyerplay.top/assets/js/s.php?s=${encodeURIComponent(pvSlug)}`;

      const sPhpHtml = execFileSync(
        CURL_BIN,
        ["-s", "-L", "-A", CHROME_UA, "-H", "Referer: https://dizibal.org/", "--connect-timeout", "8", "-m", "14", sPhpUrl],
        { timeout: 15000 }
      ).toString("utf8");

      const playerMatch = sPhpHtml.match(/window\.__PLAYER__\s*=\s*(\{[\s\S]*?\});/);
      if (!playerMatch) continue;

      const playerObj = JSON.parse(playerMatch[1]);
      if (!playerObj.stream) continue;

      const subtitles: Array<{ label: string; lang: string; file: string }> = [];
      if (Array.isArray(playerObj.subs)) {
        for (const sub of playerObj.subs) {
          subtitles.push({
            label: sub.label || (sub.lang === "tr" ? "Türkçe" : "İngilizce"),
            lang: sub.lang || (sub.label?.toLowerCase().includes("türk") ? "tr" : "en"),
            file: sub.src,
          });
        }
      }

      return {
        title: playerObj.title || title,
        tmdbId: tmdbId ? Number(tmdbId) : undefined,
        mediaType,
        m3u8Url: playerObj.stream,
        referer: sPhpUrl,
        embedUrl: sPhpUrl,
        subtitles,
      };
    } catch (err) {}
  }

  return null;
}
