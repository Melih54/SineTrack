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
  const queries = Array.from(new Set([title, originalTitle].filter(Boolean))) as string[];

  for (const q of queries) {
    // 1. Check RSS Feed which contains embed iframes directly
    try {
      const rssUrl = "https://turbofilmizle.org/search/" + encodeURIComponent(q.trim()) + "/feed/rss2/";
      const rssCmd = CURL_BIN + ' -s -L -A "' + CHROME_UA + '" --connect-timeout 8 -m 14 "' + rssUrl + '"';
      const rssXml = execSync(rssCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }).toString("utf8");

      const rssEmbeds = rssXml.match(/https:\/\/[a-zA-Z0-9.-]+\/embed\/[a-zA-Z0-9_-]+/g);
      if (rssEmbeds && rssEmbeds.length > 0) {
        const hotstreamUrl = rssEmbeds[0];
        return {
          title: q,
          hotstreamUrl,
          embedUrl: "/api/player/turbo-embed?url=" + encodeURIComponent(hotstreamUrl),
        };
      }
    } catch (err) {}

    // 2. Check Standard HTML Search
    try {
      const searchUrl = "https://turbofilmizle.org/?s=" + encodeURIComponent(q.trim());
      const searchCmd = CURL_BIN + ' -s -L -A "' + CHROME_UA + '" --connect-timeout 8 -m 14 "' + searchUrl + '"';
      const searchHtml = execSync(searchCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }).toString("utf8");

      const matches = searchHtml.match(/href="(https:\/\/turbofilmizle\.org\/[^"?#\/]+\/)"/g);
      if (!matches || matches.length === 0) continue;

      const uniqueLinks = Array.from(new Set(matches.map((m) => m.replace(/^href="/, "").replace(/"$/, ""))))
        .filter((l) => !l.includes("/tag/") && !l.includes("/category/") && !l.includes("/wp-") && !l.includes("/feed/"));

      for (const filmUrl of uniqueLinks.slice(0, 3)) {
        try {
          const filmCmd = CURL_BIN + ' -s -L -A "' + CHROME_UA + '" -H "Referer: https://turbofilmizle.org/" --connect-timeout 8 -m 14 "' + filmUrl + '"';
          const filmHtml = execSync(filmCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }).toString("utf8");

          const embedMatches = filmHtml.match(/https:\/\/[a-zA-Z0-9.-]+\/embed\/[a-zA-Z0-9_-]+/g);
          if (embedMatches && embedMatches.length > 0) {
            const hotstreamUrl = embedMatches[0];
            return {
              title: q,
              hotstreamUrl,
              embedUrl: "/api/player/turbo-embed?url=" + encodeURIComponent(hotstreamUrl),
            };
          }
        } catch (err) {}
      }
    } catch (err) {}
  }

  return null;
}
