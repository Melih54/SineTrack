import { execSync } from "child_process";
import { CURL_BIN } from "./curl";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface ResolvedTurboSource {
  title: string;
  hotstreamUrl: string;
  embedUrl: string;
}

export function resolveTurboSource(
  title: string,
  originalTitle?: string | null
): ResolvedTurboSource | null {
  const queries = [title, originalTitle].filter(Boolean) as string[];

  for (const q of queries) {
    try {
      const searchUrl = `https://turbofilmizle.org/?s=${encodeURIComponent(q.trim())}`;
      const searchCmd = `${CURL_BIN} -s -L -A "${CHROME_UA}" --connect-timeout 8 -m 14 "${searchUrl}"`;
      const searchHtml = execSync(searchCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }).toString("utf8");

      const matches = searchHtml.match(/href="(https:\/\/turbofilmizle\.org\/filmler[^"]+)"/g);
      if (!matches || matches.length === 0) continue;

      // Check first 3 links
      const uniqueLinks = Array.from(new Set(matches.map(m => m.replace(/^href="/, "").replace(/"$/, ""))));
      for (const filmUrl of uniqueLinks.slice(0, 3)) {
        try {
          const filmCmd = `${CURL_BIN} -s -L -A "${CHROME_UA}" -H "Referer: https://turbofilmizle.org/" --connect-timeout 8 -m 14 "${filmUrl}"`;
          const filmHtml = execSync(filmCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }).toString("utf8");

          const embedMatches = filmHtml.match(/https:\/\/[a-zA-Z0-9.-]+\/embed\/[a-zA-Z0-9_-]+/g);
          if (embedMatches && embedMatches.length > 0) {
            const hotstreamUrl = embedMatches[0];
            return {
              title: q,
              hotstreamUrl,
              embedUrl: `/api/player/turbo-embed?url=${encodeURIComponent(hotstreamUrl)}`,
            };
          }
        } catch (err) {}
      }
    } catch (err) {}
  }

  return null;
}
