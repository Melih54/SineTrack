import { execFileSync } from "child_process";
import crypto from "crypto";
import { getWorkingDomain } from "./domain-resolver";
import { resolveHdfSeriesEpisode } from "./hdfilmcehennemi-resolver";
import { CURL_BIN } from "./curl";

const DIZILLA_ALGO = "aes-256-cbc";
const DIZILLA_KEY = crypto.createHash("sha256").update("!!22xx!!90!!").digest("base64").substring(0, 32);
const DIZILLA_IV = Buffer.alloc(16, 0);

const DIZIPAL_PASS =
  "3hPn4uCjTVtfYWcjIcoJQ4cL1WWk1qxXI39egLYOmNv6IblA7eKJz68uU3eLzux1biZLCms0quEjTYniGv5z1JcKbNIsDQFSeIZOBZJz4is6pD7UyWDggWWzTLBQbHcQFpBQdClnuQaMNUHtLHTpzCvZy33p6I7wFBvL4fnXBYH84aUIyWGTRvM2G5cfoNf4705tO2kv";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function decryptDizilla(ciphertext: string) {
  const decipher = crypto.createDecipheriv(DIZILLA_ALGO, DIZILLA_KEY, DIZILLA_IV);
  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

function decryptDizipal(ciphertext: string, ivHex: string, saltHex: string) {
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.pbkdf2Sync(DIZIPAL_PASS, salt, 999, 32, "sha512");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function extractSubtitles(html: string): Array<{ file: string; label: string; lang: string }> {
  try {
    const match = html.match(/\[\s*\{\s*"file"\s*:\s*"https:[^"]+"[\s\S]*?\}\s*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return parsed.map((s: any) => ({
        file: s.file,
        label: s.label || (s.lang === "tr" ? "Türkçe" : "İngilizce"),
        lang: s.lang || (s.label?.toLowerCase().includes("türk") ? "tr" : "en"),
      }));
    }
  } catch (e) {}
  return [];
}

export interface SeriesSubtitle {
  file: string;
  label: string;
  lang: string;
}

export interface SeriesStreamSource {
  provider: "Dizipal" | "Dizilla" | "HDFilmCehennemi" | "DiziBal";
  lang: "tr_dub" | "tr_sub" | "original";
  label: string;
  quality: string;
  m3u8Url?: string;
  rawIframeSrc?: string;
  referer: string;
  embedUrl: string;
  subtitles?: SeriesSubtitle[];
}

export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// In-memory cache for resolved series episodes (30 min TTL)
const seriesCache = new Map<string, { timestamp: number; sources: SeriesStreamSource[] }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

export function resolveSeriesEpisode(
  title: string,
  originalTitle: string | null,
  season: number,
  episode: number
): SeriesStreamSource[] {
  const cacheKey = `${toSlug(title)}_${season}_${episode}`;
  const cached = seriesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.sources.length > 0) {
    return cached.sources;
  }

  const slugs = new Set<string>();
  if (title) slugs.add(toSlug(title));
  if (originalTitle) slugs.add(toSlug(originalTitle));

  // Common title mappings
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("game of thrones") || lowerTitle.includes("taht oyunlari")) {
    slugs.add("game-of-thrones");
  }
  if (lowerTitle.includes("breaking bad")) {
    slugs.add("breaking-bad");
  }
  if (lowerTitle.includes("stranger things")) {
    slugs.add("stranger-things");
  }
  if (lowerTitle.includes("the mentalist") || lowerTitle.includes("mentalist")) {
    slugs.add("the-mentalist");
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
  if (lowerTitle.includes("chernobyl")) {
    slugs.add("chernobyl");
  }
  if (lowerTitle.includes("family guy")) {
    slugs.add("family-guy");
  }
  if (lowerTitle.includes("kurtlar vadisi")) {
    slugs.add("kurtlar-vadisi");
  }
  if (lowerTitle.includes("behzat")) {
    slugs.add("behzat-c");
  }
  if (lowerTitle.includes("ezel")) {
    slugs.add("ezel");
  }

  const results: SeriesStreamSource[] = [];

  // 1. PRIMARY: Try Dizilla (Dual-Audio TR Dublaj + EN + Subtitles)
  const dizillaBase = getWorkingDomain("dizilla");
  for (const slug of slugs) {
    try {
      const candidateUrls = [
        `${dizillaBase}/${slug}-${season}-sezon-${episode}-bolum`,
        `${dizillaBase}/${slug}-${season}-sezon-${episode}-bolum-c01`,
        `${dizillaBase}/${slug}-${season}-sezon-${episode}-bolum-c02`,
      ];

      let html = "";
      for (const cUrl of candidateUrls) {
        try {
          const res = execFileSync(
            CURL_BIN,
            ["-s", "-L", "-A", CHROME_UA, "--connect-timeout", "8", "-m", "14", cUrl],
            { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
          ).toString("utf8");
          if (res.includes("__NEXT_DATA__")) {
            html = res;
            break;
          }
        } catch {}
      }

      if (!html) continue;

      const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!match) continue;

      const nextData = JSON.parse(match[1]);
      const secureData = nextData.props?.pageProps?.secureData;
      if (!secureData) continue;

      const decrypted = decryptDizilla(secureData);
      const sources =
        decrypted.content?.result?.RelatedResults?.getEpisodeSources?.result ||
        decrypted.RelatedResults?.getEpisodeSources?.result ||
        decrypted.result?.RelatedResults?.getEpisodeSources?.result ||
        [];

      for (const s of sources) {
        const srcMatch = (s.source_content || "").match(/src="([^"]+)"/);
        if (!srcMatch) continue;

        let rawSrc = srcMatch[1].startsWith("//") ? "https:" + srcMatch[1] : srcMatch[1];
        if (rawSrc.includes("dplayer74.site")) {
          rawSrc = rawSrc.replace("dplayer74.site", "dplayer82.site");
        }

        try {
          const pHtml = execFileSync(
            CURL_BIN,
            [
              "-s",
              "-A",
              CHROME_UA,
              "-H",
              `Referer: ${dizillaBase}/`,
              "--connect-timeout",
              "8",
              "-m",
              "14",
              rawSrc,
            ],
            { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
          ).toString("utf8");

          if (pHtml.includes("Attention Required") || pHtml.includes("Video bulunamadı")) {
            continue;
          }

          const plMatch = pHtml.match(/window\.openPlayer\(\s*'([^']+)'/);
          const subs = extractSubtitles(pHtml);

          if (plMatch) {
            const host = new URL(rawSrc).host;
            const s2Raw = execFileSync(
              CURL_BIN,
              [
                "-s",
                "-A",
                CHROME_UA,
                "-H",
                `Referer: ${rawSrc}`,
                "-H",
                "X-Requested-With: XMLHttpRequest",
                "--connect-timeout",
                "8",
                "-m",
                "14",
                `https://${host}/source2.php?v=${encodeURIComponent(plMatch[1])}`,
              ],
              { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
            ).toString("utf8");

            const s2Json = JSON.parse(s2Raw);
            if (s2Json.state && s2Json.playlist?.[0]?.sources?.[0]?.file) {
              const m3u8Url = s2Json.playlist[0].sources[0].file.replace("m.php", "master.m3u8");

              // Verify that m3u8Url actually returns a valid playlist before accepting
              let isWorking = false;
              try {
                const probe = execFileSync(
                  CURL_BIN,
                  ["-s", "-L", "-A", CHROME_UA, "-H", `Referer: ${rawSrc}`, "--connect-timeout", "6", "-m", "10", m3u8Url],
                  { timeout: 12000 }
                ).toString("utf8");
                isWorking = probe.includes("#EXTM3U");
              } catch {}

              if (!isWorking) {
                continue; // Stream dead/blocked, try next source or fallback to HDFilmCehennemi
              }

              results.push({
                provider: "Dizilla",
                lang: "tr_dub",
                label: `${s.source_name || "Dizilla"} (Türkçe Dublaj)`,
                quality: s.quality_name || "1080P",
                m3u8Url,
                rawIframeSrc: rawSrc,
                referer: rawSrc,
                embedUrl: `/api/player/dizi-embed?title=${encodeURIComponent(title)}&season=${season}&episode=${episode}&lang=tr_dub`,
                subtitles: subs,
              });

              results.push({
                provider: "Dizilla",
                lang: "tr_sub",
                label: `${s.source_name || "Dizilla"} (Türkçe Altyazılı)`,
                quality: s.quality_name || "1080P",
                m3u8Url,
                rawIframeSrc: rawSrc,
                referer: rawSrc,
                embedUrl: `/api/player/dizi-embed?title=${encodeURIComponent(title)}&season=${season}&episode=${episode}&lang=tr_sub`,
                subtitles: subs,
              });

              break;
            }
          }
        } catch {}
      }

      if (results.length > 0) break;
    } catch {}
  }

  // 2. SECONDARY / RESILIENT FALLBACK: Try HDFilmCehennemi
  // If Dizilla has no playable stream (e.g. The Mentalist), HDFilmCehennemi immediately steps in!
  if (results.length === 0) {
    try {
      const hdf = resolveHdfSeriesEpisode(title, originalTitle, season, episode);
      if (hdf && hdf.m3u8Url) {
        results.push({
          provider: "HDFilmCehennemi",
          lang: "tr_dub",
          label: "HDFilmCehennemi (Türkçe Dublaj)",
          quality: "1080P",
          m3u8Url: hdf.m3u8Url,
          rawIframeSrc: hdf.embedIframeUrl,
          referer: hdf.referer,
          embedUrl: `/api/player/dizi-embed?title=${encodeURIComponent(title)}&season=${season}&episode=${episode}&lang=tr_dub`,
          subtitles: hdf.subtitles,
        });

        results.push({
          provider: "HDFilmCehennemi",
          lang: "tr_sub",
          label: "HDFilmCehennemi (Türkçe Altyazılı)",
          quality: "1080P",
          m3u8Url: hdf.m3u8Url,
          rawIframeSrc: hdf.embedIframeUrl,
          referer: hdf.referer,
          embedUrl: `/api/player/dizi-embed?title=${encodeURIComponent(title)}&season=${season}&episode=${episode}&lang=tr_sub`,
          subtitles: hdf.subtitles,
        });
      }
    } catch {}
  }

  // 3. TERTIARY FALLBACK: Try Dizipal if both Dizilla and HDFilmCehennemi had no stream
  if (results.length === 0) {
    const dizipalBase = getWorkingDomain("dizipal");
    for (const slug of slugs) {
      try {
        const url = `${dizipalBase}/bolum/${slug}-${season}x${episode}`;
        const html = execFileSync(
          CURL_BIN,
          ["-s", "-L", "-A", CHROME_UA, "--connect-timeout", "8", "-m", "14", url],
          { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
        ).toString("utf8");

        if (html.includes("Attention Required")) continue;

        const match = html.match(/data-rm-k="true">([^<]+)<\/div>/);
        if (!match) continue;

        const rawJson = match[1].replace(/&quot;/g, '"');
        const encrypted = JSON.parse(rawJson);
        let iframeSrc = decryptDizipal(encrypted.ciphertext, encrypted.iv, encrypted.salt);
        if (iframeSrc.startsWith("//")) iframeSrc = "https:" + iframeSrc;

        const pHtml = execFileSync(
          CURL_BIN,
          [
            "-s",
            "-A",
            CHROME_UA,
            "-H",
            `Referer: ${dizipalBase}/`,
            "--connect-timeout",
            "8",
            "-m",
            "14",
            iframeSrc,
          ],
          { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
        ).toString("utf8");

        if (pHtml.includes("Attention Required")) continue;

        const plMatch = pHtml.match(/openPlayer\(\s*['"]([^'"]+)['"]/);
        const subs = extractSubtitles(pHtml);
        if (plMatch) {
          const host = new URL(iframeSrc).host;
          const sBody = execFileSync(
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
              "8",
              "-m",
              "14",
              `https://${host}/source2.php?v=${encodeURIComponent(plMatch[1])}`,
            ],
            { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
          ).toString("utf8");

          const sJson = JSON.parse(sBody);
          const sources = sJson.playlist?.[0]?.sources || [];

          for (const s of sources) {
            const titleStr = (s.title || "").toLowerCase();
            const isDub = titleStr.includes("dublaj") || titleStr.includes("ses");
            const langType: "tr_dub" | "tr_sub" = isDub ? "tr_dub" : "tr_sub";
            const m3u8Url = (s.file || "").replace("m.php", "master.m3u8");

            results.push({
              provider: "Dizipal",
              lang: langType,
              label: s.title || (isDub ? "Türkçe Dublaj" : "Türkçe Altyazı"),
              quality: "1080P",
              m3u8Url,
              rawIframeSrc: iframeSrc,
              referer: iframeSrc,
              embedUrl: `/api/player/dizi-embed?title=${encodeURIComponent(title)}&season=${season}&episode=${episode}&lang=${langType}`,
              subtitles: subs,
            });
          }
        }

        if (results.length > 0) break;
      } catch {}
    }
  }

  if (results.length > 0) {
    seriesCache.set(cacheKey, { timestamp: Date.now(), sources: results });
  }

  return results;
}
