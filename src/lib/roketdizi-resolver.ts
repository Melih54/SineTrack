import { execFileSync } from "child_process";
import { CURL_BIN } from "./curl";
import { toSlug } from "./series-resolver";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface RoketDiziSource {
  provider: "RoketDizi";
  lang: "tr_dub" | "tr_sub" | "original";
  label: string;
  quality: string;
  m3u8Url: string;
  rawIframeSrc: string;
  referer: string;
  embedUrl: string;
  subtitles?: Array<{ file: string; label: string; lang: string }>;
}

const roketCache = new Map<string, { timestamp: number; sources: RoketDiziSource[] }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Resolves streams from roketdizi.life using their base64-encoded secureData.
 */
export function resolveRoketDiziEpisode(
  title: string,
  originalTitle: string | null,
  season: number,
  episode: number
): RoketDiziSource[] {
  const cacheKey = `roket_${toSlug(title)}_${season}_${episode}`;
  const cached = roketCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.sources.length > 0) {
    return cached.sources;
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
  if (lowerTitle.includes("game of thrones") || lowerTitle.includes("taht oyunlari")) {
    slugs.add("game-of-thrones");
  }
  if (lowerTitle.includes("stranger things")) {
    slugs.add("stranger-things");
  }
  if (lowerTitle.includes("the boys")) {
    slugs.add("the-boys");
  }
  if (lowerTitle.includes("the last of us")) {
    slugs.add("the-last-of-us");
  }
  if (lowerTitle.includes("better call saul")) {
    slugs.add("better-call-saul");
  }
  if (lowerTitle.includes("rick and morty")) {
    slugs.add("rick-and-morty");
  }
  if (lowerTitle.includes("arcane")) {
    slugs.add("arcane");
  }
  if (lowerTitle.includes("sherlock")) {
    slugs.add("sherlock");
  }
  if (lowerTitle.includes("dexter")) {
    slugs.add("dexter");
  }
  if (lowerTitle.includes("prison break")) {
    slugs.add("prison-break");
  }

  const results: RoketDiziSource[] = [];

  for (const slug of slugs) {
    try {
      const url = `https://roketdizi.life/dizi/${slug}/sezon-${season}/bolum-${episode}`;
      const pageHtml = execFileSync(
        CURL_BIN,
        [
          "-s",
          "-L",
          "-A",
          CHROME_UA,
          "--connect-timeout",
          "6",
          "-m",
          "12",
          url,
        ],
        { maxBuffer: 10 * 1024 * 1024, timeout: 14000 }
      ).toString("utf8");

      const match = pageHtml.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!match) continue;

      const nextData = JSON.parse(match[1]);
      const secureData = nextData.props?.pageProps?.secureData;
      if (!secureData) continue;

      let decoded: any = null;
      try {
        decoded = JSON.parse(Buffer.from(secureData, "base64").toString("utf8"));
      } catch {
        continue;
      }

      const sources = decoded?.RelatedResults?.getEpisodeSources?.result || [];
      if (!Array.isArray(sources) || sources.length === 0) continue;

      for (const s of sources) {
        const content = s.source_content || "";
        const iframeMatch = content.match(/src=["']([^"']+)["']/i);
        if (!iframeMatch) continue;

        let iframeSrc = iframeMatch[1];
        if (iframeSrc.startsWith("//")) iframeSrc = "https:" + iframeSrc;

        // Currently four.pichive.online handles the openPlayer token exchange reliably
        try {
          const host = new URL(iframeSrc).host;
          const ifrHtml = execFileSync(
            CURL_BIN,
            [
              "-s",
              "-L",
              "-A",
              CHROME_UA,
              "-H",
              "Referer: https://roketdizi.life/",
              "--connect-timeout",
              "6",
              "-m",
              "10",
              iframeSrc,
            ],
            { maxBuffer: 10 * 1024 * 1024, timeout: 12000 }
          ).toString("utf8");

          const plMatch = ifrHtml.match(/window\.openPlayer\(\s*'([^']+)'/);
          if (!plMatch) continue;

          const token = plMatch[1];
          const s2Raw = execFileSync(
            CURL_BIN,
            [
              "-s",
              "-A",
              CHROME_UA,
              "-H",
              `Referer: ${iframeSrc}`,
              "-H",
              "X-Requested-With: XMLHttpRequest",
              "--connect-timeout",
              "6",
              "-m",
              "10",
              `https://${host}/source2.php?v=${encodeURIComponent(token)}`,
            ],
            { maxBuffer: 10 * 1024 * 1024, timeout: 12000 }
          ).toString("utf8");

          const s2 = JSON.parse(s2Raw);
          const rawFile = s2.playlist?.[0]?.sources?.[0]?.file;
          if (!rawFile) continue;

          // m.php provides the full HLS master playlist
          const isDub = (s.language_name || "").toLowerCase().includes("dub");
          const langType: "tr_dub" | "tr_sub" = isDub ? "tr_dub" : "tr_sub";

          // Check if we already have this langType
          if (!results.some((r) => r.lang === langType)) {
            results.push({
              provider: "RoketDizi",
              lang: langType,
              label: `RoketDizi (${isDub ? "Türkçe Dublaj" : "Türkçe Altyazı"})`,
              quality: "1080P",
              m3u8Url: rawFile,
              rawIframeSrc: iframeSrc,
              referer: iframeSrc,
              embedUrl: `/api/player/dizi-embed?title=${encodeURIComponent(title)}&season=${season}&episode=${episode}&lang=${langType}&source=roket`,
            });
          }
        } catch {
          // continue to next source
        }
      }

      if (results.length > 0) break;
    } catch {
      // continue to next slug
    }
  }

  if (results.length > 0) {
    roketCache.set(cacheKey, { timestamp: Date.now(), sources: results });
  }

  return results;
}
