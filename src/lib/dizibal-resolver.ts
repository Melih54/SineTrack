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
  const endpoint = mediaType === "tv" ? "series" : "movies";

  for (const q of queries) {
    try {
      const searchUrl = "https://dizibal.org/api/" + endpoint + "?search=" + encodeURIComponent(q.trim()) + "&lang=tr&siteMode=full";
      const searchRes = await fetch(searchUrl, {
        headers: {
          "User-Agent": CHROME_UA,
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!searchRes.ok) continue;
      const searchData = await searchRes.json();
      const items = searchData.data || [];
      if (!items.length) continue;

      // 1. Match by TMDB ID first
      let match = tmdbId ? items.find((x: any) => Number(x.id) === Number(tmdbId)) : null;

      // 2. Match by title similarity
      if (!match) {
        const cleanQ = q.toLowerCase().replace(/[^a-z0-9]/g, "");
        match = items.find((x: any) => {
          const itemTitle = (x.title || x.name || x.title_tr || x.name_tr || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const origTitle = (x.original_title || x.original_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          return itemTitle.includes(cleanQ) || cleanQ.includes(itemTitle) || origTitle.includes(cleanQ);
        }) || items[0];
      }

      if (!match) continue;

      // 3. Resolve stream page URL
      let embedPageUrl = match.streamUrl;
      if (mediaType === "tv") {
        const epUrl = "https://dizibal.org/api/series/" + match._id + "/seasons/" + season + "/episodes/" + episode + "/stream?lang=tr&siteMode=full";
        const epRes = await fetch(epUrl, {
          headers: { "User-Agent": CHROME_UA },
          signal: AbortSignal.timeout(10000),
        });
        if (epRes.ok) {
          const epData = await epRes.json();
          embedPageUrl = epData.data?.streamUrl;
        }
      } else if (!embedPageUrl && match._id) {
        const movieStreamUrl = "https://dizibal.org/api/movies/" + match._id + "/stream?lang=tr&siteMode=full";
        const mRes = await fetch(movieStreamUrl, {
          headers: { "User-Agent": CHROME_UA },
          signal: AbortSignal.timeout(10000),
        });
        if (mRes.ok) {
          const mData = await mRes.json();
          embedPageUrl = mData.data?.streamUrl;
        }
      }

      if (!embedPageUrl || !embedPageUrl.startsWith("http")) continue;

      // 4. Fetch embed page to get stream hash and subtitles
      const origin = new URL(embedPageUrl).origin;
      const pageRes = await fetch(embedPageUrl, {
        headers: {
          "User-Agent": CHROME_UA,
          "Referer": "https://dizibal.org/",
        },
        signal: AbortSignal.timeout(12000),
      });

      if (!pageRes.ok) continue;
      const pageHtml = await pageRes.text();

      // Extract stream parameter: op=get_stream&view_id=...&hash=...
      const streamParamMatch = pageHtml.match(/op=get_stream&view_id=\d+&hash=[0-9a-f-]+/i);
      if (!streamParamMatch) continue;

      // Parse subtitles
      const subtitles: Array<{ label: string; lang: string; file: string }> = [];
      const subMatch = pageHtml.match(/"subtitle"\s*:\s*"([^"]+)"/i);
      if (subMatch && subMatch[1]) {
        const entries = subMatch[1].split(",");
        for (const entry of entries) {
          const m = entry.match(/\[(.*?)\](.*)/);
          if (m) {
            const label = m[1].trim();
            const file = m[2].trim();
            const lang = /turk|türk|tr/i.test(label) ? "tr" : "en";
            subtitles.push({ label, lang, file });
          }
        }
      }

      // 5. Query dl endpoint for direct master m3u8
      const dlUrl = origin + "/dl?" + streamParamMatch[0];
      const dlRes = await fetch(dlUrl, {
        headers: {
          "User-Agent": CHROME_UA,
          "Referer": embedPageUrl,
          "Origin": origin,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!dlRes.ok) continue;
      const dlData = await dlRes.json();
      if (!dlData.url) continue;

      return {
        title: match.title || match.name || q,
        tmdbId: match.id ? Number(match.id) : undefined,
        mediaType,
        m3u8Url: dlData.url,
        referer: origin + "/",
        embedUrl: embedPageUrl,
        subtitles,
      };
    } catch (err) {}
  }

  return null;
}
