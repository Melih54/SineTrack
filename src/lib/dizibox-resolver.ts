import { execFileSync } from "child_process";
import { CURL_BIN } from "./curl";
import { toSlug } from "./series-resolver";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface DiziboxSource {
  provider: "Dizibox";
  lang: "tr_dub" | "tr_sub" | "original";
  label: string;
  quality: string;
  m3u8Url: string;
  rawIframeSrc: string;
  referer: string;
  embedUrl: string;
}

const diziboxCache = new Map<string, { timestamp: number; data: DiziboxSource | null }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Resolves episode from dizibox.live extracting the Vidmoly master.m3u8.
 * Vidmoly CDN (vmpx.online) has full CORS support (Access-Control-Allow-Origin: *).
 */
export function resolveDiziboxEpisode(
  title: string,
  originalTitle: string | null,
  season: number,
  episode: number
): DiziboxSource | null {
  const cacheKey = `dizibox_${toSlug(title)}_${season}_${episode}`;
  const cached = diziboxCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const slugs = new Set<string>();
  if (title) slugs.add(toSlug(title));
  if (originalTitle) slugs.add(toSlug(originalTitle));

  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("the mentalist") || lowerTitle.includes("mentalist")) {
    slugs.add("the-mentalist");
  }
  if (lowerTitle.includes("breaking bad")) {
    slugs.add("breaking-bad");
  }

  for (const slug of slugs) {
    try {
      // Dizibox episode URL pattern with option 2 or 1
      const candidateUrls = [
        `https://www.dizibox.live/${slug}-${season}-sezon-${episode}-bolum-izle/2/`,
        `https://www.dizibox.live/${slug}-${season}-sezon-${episode}-bolum-izle/`,
      ];

      for (const epUrl of candidateUrls) {
        let pageHtml = "";
        try {
          pageHtml = execFileSync(
            CURL_BIN,
            [
              "-s",
              "-L",
              "-A",
              CHROME_UA,
              "--connect-timeout",
              "6",
              "-m",
              "10",
              epUrl,
            ],
            { maxBuffer: 10 * 1024 * 1024, timeout: 12000 }
          ).toString("utf8");
        } catch {
          continue;
        }

        const molyIframeMatch = pageHtml.match(/<iframe[^>]+src=["']([^"']*moly\.php[^"']*)["']/i);
        if (!molyIframeMatch) continue;

        const molyPhpUrl = molyIframeMatch[1];
        let molyHtml = "";
        try {
          molyHtml = execFileSync(
            CURL_BIN,
            [
              "-s",
              "-L",
              "-A",
              CHROME_UA,
              "-H",
              "Referer: https://www.dizibox.live/",
              "--connect-timeout",
              "6",
              "-m",
              "10",
              molyPhpUrl,
            ],
            { maxBuffer: 10 * 1024 * 1024, timeout: 12000 }
          ).toString("utf8");
        } catch {
          continue;
        }

        const unescapeMatch = molyHtml.match(/unescape\("([^"]+)"\)/);
        if (!unescapeMatch) continue;

        const b64 = decodeURIComponent(unescapeMatch[1]);
        const decoded = Buffer.from(b64, "base64").toString("utf8");

        const vidmolyMatch = decoded.match(/src=["'](https:\/\/[^"']*vidmoly[^"']*)["']/i);
        if (!vidmolyMatch) continue;

        const vidmolyUrl = vidmolyMatch[1];
        let vidmolyHtml = "";
        try {
          vidmolyHtml = execFileSync(
            CURL_BIN,
            [
              "-s",
              "-L",
              "-A",
              CHROME_UA,
              "-H",
              "Referer: https://www.dizibox.live/",
              "--connect-timeout",
              "6",
              "-m",
              "10",
              vidmolyUrl,
            ],
            { maxBuffer: 10 * 1024 * 1024, timeout: 12000 }
          ).toString("utf8");
        } catch {
          continue;
        }

        const sourceMatch = vidmolyHtml.match(/sources:\s*\[\s*\{\s*file:\s*['"]([^'"]+)['"]/);
        if (!sourceMatch) continue;

        const m3u8Url = sourceMatch[1];
        const result: DiziboxSource = {
          provider: "Dizibox",
          lang: "tr_sub",
          label: "Dizibox (Vidmoly HLS)",
          quality: "1080P",
          m3u8Url,
          rawIframeSrc: vidmolyUrl,
          referer: "https://www.dizibox.live/",
          embedUrl: `/api/player/dizi-embed?title=${encodeURIComponent(title)}&season=${season}&episode=${episode}&lang=tr_sub&source=dizibox`,
        };

        diziboxCache.set(cacheKey, { timestamp: Date.now(), data: result });
        return result;
      }
    } catch {
      // continue
    }
  }

  diziboxCache.set(cacheKey, { timestamp: Date.now(), data: null });
  return null;
}
