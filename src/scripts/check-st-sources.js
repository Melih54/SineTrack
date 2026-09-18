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

const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const url = "https://dizilla.now/stranger-things-1-sezon-1-bolum";
const html = execSync(`curl.exe -s -L -A "${CHROME_UA}" "${url}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const nextData = JSON.parse(html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)[1]);
const secureData = nextData.props?.pageProps?.secureData;
const decrypted = decryptDizilla(secureData);
const sources = decrypted.content?.result?.RelatedResults?.getEpisodeSources?.result || [];

console.log("Raw sources count:", sources.length);
for (const s of sources) {
  console.log({
    id: s.id,
    source_name: s.source_name,
    language_name: s.language_name,
    quality_name: s.quality_name,
    source_content: s.source_content
  });
}
