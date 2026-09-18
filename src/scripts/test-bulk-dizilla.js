const crypto = require("crypto");
const { execSync } = require("child_process");

const algorithm = "aes-256-cbc";
const key = crypto.createHash("sha256").update("!!22xx!!90!!").digest("base64").substring(0, 32);
const iv = Buffer.alloc(16, 0);

function decryptDizilla(ciphertext) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

function resolveDizillaEpisode(seriesSlug, season = 1, episode = 1) {
  const url = `https://dizilla.now/${seriesSlug}-${season}-sezon-${episode}-bolum`;
  try {
    const html = execSync(`curl.exe -s -L -A "Mozilla/5.0" "${url}"`, { maxBuffer: 10 * 1024 * 1024, timeout: 10000 }).toString('utf8');
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;

    const nextData = JSON.parse(match[1]);
    const secureData = nextData.props?.pageProps?.secureData;
    if (!secureData) return null;

    const decrypted = decryptDizilla(secureData);
    const sources = decrypted.content?.result?.RelatedResults?.getEpisodeSources?.result || decrypted.RelatedResults?.getEpisodeSources?.result || [];

    const parsedSources = sources.map(s => {
      const srcMatch = (s.source_content || '').match(/src="([^"]+)"/);
      return {
        sourceName: s.source_name,
        lang: s.language_name,
        quality: s.quality_name,
        iframeSrc: srcMatch ? (srcMatch[1].startsWith('//') ? 'https:' + srcMatch[1] : srcMatch[1]) : null
      };
    }).filter(s => s.iframeSrc);

    return parsedSources;
  } catch (e) {
    return null;
  }
}

const seriesList = [
  { name: "Game of Thrones", slug: "game-of-thrones" },
  { name: "Breaking Bad", slug: "breaking-bad" },
  { name: "Stranger Things", slug: "stranger-things" },
  { name: "The Last of Us", slug: "the-last-of-us" },
  { name: "Better Call Saul", slug: "better-call-saul" },
  { name: "Chernobyl", slug: "chernobyl" },
  { name: "Arcane", slug: "arcane" },
  { name: "Sherlock", slug: "sherlock" },
  { name: "The Boys", slug: "the-boys" },
  { name: "Rick and Morty", slug: "rick-and-morty" },
  { name: "Family Guy", slug: "family-guy" }
];

console.log("Resolving Season 1 Episode 1 for all series on Dizilla:");
for (const s of seriesList) {
  const sources = resolveDizillaEpisode(s.slug, 1, 1);
  if (sources && sources.length > 0) {
    console.log(`[FOUND] ${s.name} (${s.slug}):`);
    sources.forEach(src => console.log(`   - ${src.lang} [${src.quality}] (${src.sourceName}): ${src.iframeSrc}`));
  } else {
    console.log(`[NOT FOUND] ${s.name} (${s.slug})`);
  }
}
