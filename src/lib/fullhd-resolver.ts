import { execFileSync } from "child_process";
import { getWorkingDomain } from "./domain-resolver";
import { resolveHdfMovie } from "./hdfilmcehennemi-resolver";
import { CURL_BIN } from "./curl";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function rtt(e: string): string {
  return (e + "").replace(/[a-z]/gi, function (c) {
    return String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < "n" ? 13 : -13));
  });
}

export function decryptRapidvid(e: string): string {
  try {
    const rev = e.split("").reverse().join("");
    const t = Buffer.from(rev, "base64").toString("binary");
    let o = "";
    const key = "K9L";
    for (let i = 0; i < t.length; i++) {
      const r = key[i % 3];
      const n = t.charCodeAt(i) - ((r.charCodeAt(0) % 5) + 1);
      o += String.fromCharCode(n);
    }
    return Buffer.from(o, "base64").toString("utf8");
  } catch (err) {
    return "";
  }
}

export function extractRapidvidDirectM3u8(
  rapidvidUrl: string,
  referer = "https://www.fullhdfilmizlesene.now/"
): string | null {
  try {
    const rHtml = execFileSync(
      CURL_BIN,
      [
        "-s",
        "-L",
        "-A",
        CHROME_UA,
        "-H",
        `Referer: ${referer}`,
        "--connect-timeout",
        "8",
        "-m",
        "14",
        rapidvidUrl,
      ],
      { timeout: 15000 }
    ).toString("utf8");

    const m = rHtml.match(/["']file["']\s*:\s*av\(\s*['"]([^'"]+)['"]\s*\)/);
    if (m && m[1]) {
      const decrypted = decryptRapidvid(m[1]);
      if (decrypted && decrypted.startsWith("http")) {
        return decrypted;
      }
    }
  } catch (e) {}
  return null;
}

export interface ResolvedAtomSource {
  slug: string;
  rapidvidUrl: string;
  directM3u8Url?: string;
  embedUrl: string;
  isHdf?: boolean;
}

export function getFullHDSearchQueries(title: string, originalTitle?: string | null): string[] {
  const specificList: string[] = [];
  const generalList: string[] = [];

  const combined = `${title || ""} ${originalTitle || ""}`.toLowerCase();

  const mapping: Record<string, string[]> = {
    "endgame": ["yenilmezler son oyun", "yenilmezler 4 son oyun", "yenilmezler 4"],
    "infinity war": ["yenilmezler sonsuzluk savasi", "yenilmezler 3 sonsuzluk savasi", "yenilmezler 3"],
    "avengers": ["yenilmezler son oyun", "yenilmezler", "yenilmezler 1", "yenilmezler 2"],
    "star wars": ["yildiz savaslari"],
    "lord of the rings": ["yuzuklerin efendisi"],
    "spider-man": ["orumcek adam"],
    "spiderman": ["orumcek adam"],
    "fast and furious": ["hizli ve ofkeli"],
    "dark knight": ["kara sovalye"],
    "pirates of the caribbean": ["karayip korsanlari"],
    "hunger games": ["aclik oyunlari"],
    "ice age": ["buz devri"],
    "iron man": ["demir adam"],
    "captain america": ["kaptan amerika"],
    "guardians of the galaxy": ["galaksinin koruyuculari"],
    "interstellar": ["yildizlararasi"],
    "inception": ["baslangic"],
    "gladiator": ["gladyator"],
    "fight club": ["dovus kulubu"],
    "shawshank redemption": ["esaretin bedeli"],
    "pulp fiction": ["ucuz roman"],
    "forrest gump": ["forrest gump"],
    "green mile": ["yesil yol"],
    "twilight": ["alacakaranlik"],
    "matrix": ["matrix"],
    "godfather": ["baba"],
    "deadpool": ["deadpool"],
  };

  for (const [key, valList] of Object.entries(mapping)) {
    if (combined.includes(key)) {
      for (const val of valList) {
        specificList.push(val);
      }
    }
  }

  // Original & translated titles
  if (originalTitle) generalList.push(originalTitle.trim());
  if (title) generalList.push(title.trim());

  if (title) {
    const clean = title.replace(/[:\-–]/g, " ").replace(/\s+/g, " ").trim();
    if (clean !== title) generalList.push(clean);
  }
  if (originalTitle) {
    const clean = originalTitle.replace(/[:\-–]/g, " ").replace(/\s+/g, " ").trim();
    if (clean !== originalTitle) generalList.push(clean);
  }

  return Array.from(new Set([...specificList, ...generalList]));
}

// In-memory cache for resolved atom movies (30 min TTL)
const atomCache = new Map<string, { timestamp: number; source: ResolvedAtomSource }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

export function resolveFullHDSource(
  title: string,
  originalTitle?: string | null
): ResolvedAtomSource | null {
  const cacheKey = `${title}_${originalTitle || ""}`.toLowerCase();
  const cached = atomCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.source;
  }

  const queries = getFullHDSearchQueries(title, originalTitle);
  let baseDomain = getWorkingDomain("fullhdfilmizlesene");
  if (!baseDomain || baseDomain.includes(".cx")) {
    baseDomain = "https://www.fullhdfilmizlesene.now";
  }

  // 1. PRIMARY: Try FullHDFilmizlesene Atom Player
  for (const q of queries) {
    try {
      const searchUrl = `${baseDomain}/arama/${encodeURIComponent(q.trim())}`;
      const html = execFileSync(
        CURL_BIN,
        [
          "-s",
          "-L",
          "-A",
          CHROME_UA,
          "-H",
          "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "-H",
          "Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
          "--connect-timeout",
          "8",
          "-m",
          "14",
          searchUrl,
        ],
        { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
      ).toString("utf8");

      const matches = html.match(/href="https?:\/\/[^"]*\/film\/([^"]+)\/"/g);
      if (!matches || matches.length === 0) continue;

      // Check first 4 results to find the best match
      for (let i = 0; i < Math.min(4, matches.length); i++) {
        const slugMatch = matches[i].match(/film\/([^"]+)\//);
        if (!slugMatch) continue;
        const slug = slugMatch[1];

        const filmUrl = `${baseDomain}/film/${slug}/`;
        const filmHtml = execFileSync(
          CURL_BIN,
          [
            "-s",
            "-L",
            "-A",
            CHROME_UA,
            "-H",
            `Referer: ${baseDomain}/`,
            "-H",
            "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "-H",
            "Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
            "--connect-timeout",
            "8",
            "-m",
            "14",
            filmUrl,
          ],
          { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
        ).toString("utf8");

        const scxMatch =
          filmHtml.match(/var\s+scx\s*=\s*({[\s\S]*?});\s*<\/script>/) ||
          filmHtml.match(/var\s+scx\s*=\s*({[\s\S]*?});/);
        if (!scxMatch) continue;

        try {
          const scx = JSON.parse(scxMatch[1]);
          if (scx.atom && scx.atom.sx && scx.atom.sx.t) {
            for (const k in scx.atom.sx.t) {
              const raw = scx.atom.sx.t[k];
              const decoded = Buffer.from(rtt(raw), "base64").toString("utf8");
              if (decoded.includes("rapidvid")) {
                const directM3u8Url = extractRapidvidDirectM3u8(decoded, `${baseDomain}/`);
                const result: ResolvedAtomSource = {
                  slug,
                  rapidvidUrl: decoded,
                  directM3u8Url: directM3u8Url || undefined,
                  embedUrl: `/api/player/atom-embed?url=${encodeURIComponent(decoded)}&title=${encodeURIComponent(title)}`,
                };
                atomCache.set(cacheKey, { timestamp: Date.now(), source: result });
                return result;
              }
            }
          }
        } catch {
          // json parse error, continue
        }
      }
    } catch (err) {
      // search query error, try next
    }
  }

  // 2. FALLBACK: Try HDFilmCehennemi for Movie
  try {
    const hdf = resolveHdfMovie(title, originalTitle);
    if (hdf && hdf.m3u8Url) {
      const result: ResolvedAtomSource = {
        slug: title,
        rapidvidUrl: hdf.m3u8Url,
        directM3u8Url: hdf.m3u8Url,
        embedUrl: `/api/player/dizi-embed?title=${encodeURIComponent(title)}&mediaType=movie&lang=tr_dub`,
        isHdf: true,
      };
      atomCache.set(cacheKey, { timestamp: Date.now(), source: result });
      return result;
    }
  } catch (e) {}

  return null;
}
