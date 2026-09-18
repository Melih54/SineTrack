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

function testSeries(slug) {
  try {
    const url = `https://dizilla.now/${slug}-1-sezon-1-bolum`;
    const html = execSync(`curl.exe -s -L -A "Mozilla/5.0" "${url}"`, { maxBuffer: 10 * 1024 * 1024, timeout: 8000 }).toString('utf8');
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return false;
    const nextData = JSON.parse(match[1]);
    const secureData = nextData.props?.pageProps?.secureData;
    if (!secureData) return false;
    const decrypted = decryptDizilla(secureData);
    const sources = decrypted.content?.result?.RelatedResults?.getEpisodeSources?.result || decrypted.RelatedResults?.getEpisodeSources?.result || [];
    return sources.length > 0;
  } catch (e) {
    return false;
  }
}

console.log("Ezel on Dizilla:", testSeries("ezel"));
console.log("Kurtlar Vadisi on Dizilla:", testSeries("kurtlar-vadisi"));
console.log("Behzat C on Dizilla:", testSeries("behzat-c-bir-ankara-polisiyesi") || testSeries("behzat-c"));
console.log("Gibi on Dizilla:", testSeries("gibi"));
