const crypto = require("crypto");
const { execSync } = require("child_process");

const DIZILLA_ALGO = "aes-256-cbc";
const DIZILLA_KEY = crypto.createHash("sha256").update("!!22xx!!90!!").digest("base64").substring(0, 32);
const DIZILLA_IV = Buffer.alloc(16, 0);
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function decryptDizilla(ciphertext) {
  const decipher = crypto.createDecipheriv(DIZILLA_ALGO, DIZILLA_KEY, DIZILLA_IV);
  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

function extractSubtitles(html) {
  try {
    const match = html.match(/window\.openPlayer\([\s\S]*?(\[\s*\{[\s\S]*?\}\s*\])\s*\);/);
    if (match) {
      const parsed = JSON.parse(match[1]);
      return parsed.map((s) => ({
        file: s.file,
        label: s.label || (s.lang === "tr" ? "Türkçe" : "İngilizce"),
        lang: s.lang || (s.label?.toLowerCase().includes("türk") ? "tr" : "en"),
      }));
    }
  } catch (e) {}
  return [];
}

function resolveDizilla(slug, season = 1, episode = 1) {
  const url = `https://dizilla.now/${slug}-${season}-sezon-${episode}-bolum`;
  try {
    const html = execSync(`curl.exe -s -L -A "${CHROME_UA}" "${url}"`, { maxBuffer: 10 * 1024 * 1024, timeout: 8000 }).toString("utf8");
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return [];

    const nextData = JSON.parse(match[1]);
    const secureData = nextData.props?.pageProps?.secureData;
    if (!secureData) return [];

    const decrypted = decryptDizilla(secureData);
    const sources = decrypted.content?.result?.RelatedResults?.getEpisodeSources?.result ||
                    decrypted.RelatedResults?.getEpisodeSources?.result || [];

    const results = [];

    for (const s of sources) {
      const srcMatch = (s.source_content || "").match(/src="([^"]+)"/);
      if (!srcMatch) continue;

      let rawSrc = srcMatch[1].startsWith("//") ? "https:" + srcMatch[1] : srcMatch[1];
      if (rawSrc.includes("dplayer74.site")) {
        rawSrc = rawSrc.replace("dplayer74.site", "dplayer82.site");
      }

      // Fetch iframe HTML to extract playlist and subtitles
      try {
        const pHtml = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: https://dizilla.now/" "${rawSrc}"`, { maxBuffer: 10 * 1024 * 1024, timeout: 8000 }).toString("utf8");
        if (pHtml.includes("Attention Required") || pHtml.includes("Video bulunamadı")) continue;

        const plMatch = pHtml.match(/window\.openPlayer\(\s*'([^']+)'/);
        const subs = extractSubtitles(pHtml);

        if (plMatch) {
          const host = new URL(rawSrc).host;
          const s2Raw = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: ${rawSrc}" "https://${host}/source2.php?v=${encodeURIComponent(plMatch[1])}"`, { maxBuffer: 10 * 1024 * 1024, timeout: 8000 }).toString("utf8");
          const s2Json = JSON.parse(s2Raw);

          if (s2Json.state && s2Json.playlist?.[0]?.sources?.[0]?.file) {
            const m3u8Url = s2Json.playlist[0].sources[0].file.replace("m.php", "master.m3u8");
            
            results.push({
              provider: "Dizilla",
              label: `${s.source_name || "Dizilla"} (1080p)`,
              quality: s.quality_name || "1080P",
              m3u8Url,
              rawIframeSrc: rawSrc,
              referer: rawSrc,
              subtitles: subs,
            });
            break; // Found primary working stream!
          }
        }
      } catch (e) {}
    }

    return results;
  } catch (e) {
    return [];
  }
}

console.log("Testing Stranger Things S1E1:");
const st = resolveDizilla("stranger-things", 1, 1);
console.log(st);

console.log("Testing Breaking Bad S1E1:");
const bb = resolveDizilla("breaking-bad", 1, 1);
console.log(bb);
