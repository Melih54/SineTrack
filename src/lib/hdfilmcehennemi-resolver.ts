import { execFileSync } from "child_process";
import vm from "vm";
import { getWorkingDomain } from "./domain-resolver";
import { CURL_BIN } from "./curl";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface HdfSubtitle {
  file: string;
  label: string;
  lang: string;
  default?: boolean;
}

export interface HdfStreamResult {
  provider: "HDFilmCehennemi";
  title: string;
  season?: number;
  episode?: number;
  m3u8Url: string;
  subtitles: HdfSubtitle[];
  referer: string;
  embedIframeUrl: string;
}

// In-memory cache for resolved HDF episodes/movies (30 min TTL)
const hdfCache = new Map<string, { timestamp: number; data: HdfStreamResult }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function decryptHdfStream(embedHtml: string): string | null {
  const scriptMatches = embedHtml.match(/<script[\s\S]*?<\/script>/gi) || [];

  for (const sm of scriptMatches) {
    const code = sm.replace(/<\/?script[^>]*>/gi, "");
    if (code.includes("charCodeAt") && code.includes("atob")) {
      const varMatch = code.match(/var\s+([a-zA-Z0-9_]+)\s*=\s*[a-zA-Z0-9_]+\s*\(\s*\[/);
      if (varMatch) {
        const varName = varMatch[1];
        const sandbox = {
          atob: (str: string) => Buffer.from(str, "base64").toString("binary"),
          btoa: (str: string) => Buffer.from(str, "binary").toString("base64"),
          result: null as string | null,
        };
        try {
          vm.runInNewContext(code + `;\nresult = ${varName};`, sandbox, { timeout: 1500 });
          if (sandbox.result && typeof sandbox.result === "string" && sandbox.result.startsWith("http")) {
            return sandbox.result;
          }
        } catch (e) {}
      }
    }
  }

  return null;
}

function extractHdfSubtitles(embedHtml: string): HdfSubtitle[] {
  const tracksMatch = embedHtml.match(/tracks:\s*(\[\s*\{[\s\S]*?\}\s*\])/);
  if (tracksMatch) {
    try {
      const parsed = JSON.parse(tracksMatch[1]);
      return parsed.map((t: any) => {
        const label = t.label || "";
        const lower = label.toLowerCase();
        const lang = lower.includes("tur") ? "tr" : lower.includes("eng") ? "en" : "other";
        return {
          file: t.file,
          label: label || (lang === "tr" ? "Türkçe" : "İngilizce"),
          lang,
          default: t.default || false,
        };
      });
    } catch (e) {}
  }
  return [];
}

/**
 * Searches HDFilmCehennemi with query and returns parsed results.
 */
function searchHdf(baseDomain: string, query: string): Array<{ title: string; href: string; type: "dizi" | "film" }> {
  try {
    const searchUrl = `${baseDomain}/search?q=${encodeURIComponent(query.trim())}`;
    const raw = execFileSync(
      CURL_BIN,
      [
        "-s",
        "-L",
        "-A", CHROME_UA,
        "-H", "X-Requested-With: fetch",
        "-H", `Referer: ${baseDomain}/`,
        "--connect-timeout", "8",
        "-m", "14",
        searchUrl,
      ],
      { timeout: 15000 }
    ).toString("utf8");

    const json = JSON.parse(raw);
    const resultsHtml: string[] = json.results || [];
    const items: Array<{ title: string; href: string; type: "dizi" | "film" }> = [];

    for (const r of resultsHtml) {
      const hrefMatch = r.match(/href="([^"]+)"/);
      const titleMatch = r.match(/<h4 class="title">([^<]+)<\/h4>/i);
      const typeMatch = r.match(/<span class="type">([^<]+)<\/span>/i);

      if (hrefMatch) {
        const href = hrefMatch[1];
        const title = titleMatch ? titleMatch[1].trim() : "";
        const isDizi = href.includes("/dizi/") || (typeMatch && typeMatch[1].toLowerCase().includes("dizi"));
        items.push({
          title,
          href,
          type: isDizi ? "dizi" : "film",
        });
      }
    }

    return items;
  } catch (err) {
    return [];
  }
}

/**
 * Resolves a TV Series episode stream from HDFilmCehennemi.
 */
export function resolveHdfSeriesEpisode(
  title: string,
  originalTitle: string | null,
  season: number,
  episode: number
): HdfStreamResult | null {
  const cacheKey = `hdf_series_${title}_${season}_${episode}`.toLowerCase();
  const cached = hdfCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let baseDomain = getWorkingDomain("hdfilmcehennemi");
  const queries = [title, originalTitle].filter(Boolean) as string[];

  for (let attempt = 0; attempt < 2; attempt++) {
    for (const q of queries) {
      try {
        const searchItems = searchHdf(baseDomain, q);
        const seriesItem = searchItems.find((it) => it.type === "dizi") || searchItems[0];
        if (!seriesItem) continue;

        // Fetch series main page to find the episode URL
        const seriesHtml = execFileSync(
          CURL_BIN,
          [
            "-s",
            "-L",
            "-A", CHROME_UA,
            "-H", `Referer: ${baseDomain}/`,
            "--connect-timeout", "8",
            "-m", "14",
            seriesItem.href,
          ],
          { timeout: 15000 }
        ).toString("utf8");

        // Look for matching season and episode link
        // e.g. /sezon-1/bolum-1-hd2/ or /sezon-1/bolum-1/
        const epRegex = new RegExp(`href="([^"]*sezon-${season}\\/bolum-${episode}[^"]*)"`, "i");
        let epMatch = seriesHtml.match(epRegex);
        if (!epMatch) {
          const fallbackEpRegex = new RegExp(`href="([^"]*bolum-${episode}[^"]*)"`, "i");
          epMatch = seriesHtml.match(fallbackEpRegex);
        }

        if (!epMatch) continue;
        const episodeUrl = epMatch[1].startsWith("http") ? epMatch[1] : `${baseDomain}${epMatch[1]}`;

        // Fetch episode page to find the embed iframe
        const epHtml = execFileSync(
          CURL_BIN,
          [
            "-s",
            "-L",
            "-A", CHROME_UA,
            "-H", `Referer: ${seriesItem.href}`,
            "--connect-timeout", "8",
            "-m", "14",
            episodeUrl,
          ],
          { timeout: 15000 }
        ).toString("utf8");

        const iframeMatch = epHtml.match(/<iframe[^>]+(?:src|data-src)=["']([^"']+)["']/i);
        if (!iframeMatch) continue;

        let iframeUrl = iframeMatch[1];
        if (iframeUrl.startsWith("//")) iframeUrl = "https:" + iframeUrl;

        // Fetch embed iframe page
        const embedHtml = execFileSync(
          CURL_BIN,
          [
            "-s",
            "-L",
            "-A", CHROME_UA,
            "-H", `Referer: ${episodeUrl}`,
            "--connect-timeout", "8",
            "-m", "15",
            iframeUrl,
          ],
          { timeout: 16000 }
        ).toString("utf8");

        const m3u8Url = decryptHdfStream(embedHtml);
        if (!m3u8Url) continue;

        const subtitles = extractHdfSubtitles(embedHtml);
        const result: HdfStreamResult = {
          provider: "HDFilmCehennemi",
          title,
          season,
          episode,
          m3u8Url,
          subtitles,
          referer: "https://hdfilmcehennemi.mobi/",
          embedIframeUrl: iframeUrl,
        };

        hdfCache.set(cacheKey, { timestamp: Date.now(), data: result });
        return result;
      } catch (err) {
        // continue
      }
    }

    // If attempt 0 failed, force refresh domain and retry once
    if (attempt === 0) {
      baseDomain = getWorkingDomain("hdfilmcehennemi", { forceRefresh: true });
    }
  }

  return null;
}

/**
 * Resolves a Movie stream from HDFilmCehennemi.
 */
export function resolveHdfMovie(
  title: string,
  originalTitle?: string | null
): HdfStreamResult | null {
  const cacheKey = `hdf_movie_${title}`.toLowerCase();
  const cached = hdfCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let baseDomain = getWorkingDomain("hdfilmcehennemi");
  const queries = [originalTitle, title].filter(Boolean) as string[];

  for (let attempt = 0; attempt < 2; attempt++) {
    for (const q of queries) {
      try {
        const searchItems = searchHdf(baseDomain, q);
        const movieItem = searchItems.find((it) => it.type === "film") || searchItems[0];
        if (!movieItem) continue;

        // Fetch movie page to find the embed iframe
        const movieHtml = execFileSync(
          CURL_BIN,
          [
            "-s",
            "-L",
            "-A", CHROME_UA,
            "-H", `Referer: ${baseDomain}/`,
            "--connect-timeout", "8",
            "-m", "14",
            movieItem.href,
          ],
          { timeout: 15000 }
        ).toString("utf8");

        const iframeMatch = movieHtml.match(/<iframe[^>]+(?:src|data-src)=["']([^"']+)["']/i);
        if (!iframeMatch) continue;

        let iframeUrl = iframeMatch[1];
        if (iframeUrl.startsWith("//")) iframeUrl = "https:" + iframeUrl;

        // Fetch embed iframe page
        const embedHtml = execFileSync(
          CURL_BIN,
          [
            "-s",
            "-L",
            "-A", CHROME_UA,
            "-H", `Referer: ${movieItem.href}`,
            "--connect-timeout", "8",
            "-m", "15",
            iframeUrl,
          ],
          { timeout: 16000 }
        ).toString("utf8");

        const m3u8Url = decryptHdfStream(embedHtml);
        if (!m3u8Url) continue;

        const subtitles = extractHdfSubtitles(embedHtml);
        const result: HdfStreamResult = {
          provider: "HDFilmCehennemi",
          title,
          m3u8Url,
          subtitles,
          referer: "https://hdfilmcehennemi.mobi/",
          embedIframeUrl: iframeUrl,
        };

        hdfCache.set(cacheKey, { timestamp: Date.now(), data: result });
        return result;
      } catch (err) {
        // continue
      }
    }

    if (attempt === 0) {
      baseDomain = getWorkingDomain("hdfilmcehennemi", { forceRefresh: true });
    }
  }

  return null;
}
