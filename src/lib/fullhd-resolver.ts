import { execSync } from "child_process";
import { getWorkingDomain } from "./domain-resolver";
import { resolveHdfMovie } from "./hdfilmcehennemi-resolver";

export function rtt(e: string): string {
  return (e + "").replace(/[a-z]/gi, function (c) {
    return String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < "n" ? 13 : -13));
  });
}

export interface ResolvedAtomSource {
  slug: string;
  rapidvidUrl: string;
  embedUrl: string;
  isHdf?: boolean;
}

export function resolveFullHDSource(
  title: string,
  originalTitle?: string | null
): ResolvedAtomSource | null {
  const queries = [originalTitle, title].filter(Boolean) as string[];
  const baseDomain = getWorkingDomain("fullhdfilmizlesene");

  // 1. PRIMARY: Try FullHDFilmizlesene Atom Player
  for (const q of queries) {
    try {
      const searchUrl = `${baseDomain}/arama/${encodeURIComponent(q.trim())}`;
      const curlCmd = `curl.exe -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${searchUrl}"`;
      const html = execSync(curlCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 10000 }).toString("utf8");

      const matches = html.match(/href="https?:\/\/[^"]*\/film\/([^"]+)\/"/g);
      if (!matches || matches.length === 0) continue;

      // Check first 3 results to find the best match
      for (let i = 0; i < Math.min(3, matches.length); i++) {
        const slugMatch = matches[i].match(/film\/([^"]+)\//);
        if (!slugMatch) continue;
        const slug = slugMatch[1];

        const filmUrl = `${baseDomain}/film/${slug}/`;
        const filmCmd = `curl.exe -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${filmUrl}"`;
        const filmHtml = execSync(filmCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 10000 }).toString("utf8");

        const scxMatch = filmHtml.match(/var\s+scx\s*=\s*({[\s\S]*?});/);
        if (!scxMatch) continue;

        try {
          const scx = JSON.parse(scxMatch[1]);
          if (scx.atom && scx.atom.sx && scx.atom.sx.t) {
            for (const k in scx.atom.sx.t) {
              const raw = scx.atom.sx.t[k];
              const decoded = Buffer.from(rtt(raw), "base64").toString("utf8");
              if (decoded.includes("rapidvid")) {
                return {
                  slug,
                  rapidvidUrl: decoded,
                  embedUrl: `/api/player/atom-embed?url=${encodeURIComponent(decoded)}`,
                };
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
      return {
        slug: title,
        rapidvidUrl: hdf.m3u8Url,
        embedUrl: `/api/player/dizi-embed?title=${encodeURIComponent(title)}&mediaType=movie&lang=tr_dub`,
        isHdf: true,
      };
    }
  } catch (e) {}

  return null;
}
