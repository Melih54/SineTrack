const crypto = require("crypto");
const { execSync } = require("child_process");

const algorithm = "aes-256-cbc";
const key = crypto.createHash("sha256").update("!!22xx!!90!!").digest("base64").substring(0, 32);
const iv = Buffer.alloc(16, 0);

function decrypt(ciphertext) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

const html = execSync('curl.exe -s -A "Mozilla/5.0" "https://dizilla.now/family-guy-1-sezon-2-bolum"', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
const nextData = JSON.parse(match[1]);
const result = decrypt(nextData.props.pageProps.secureData);

const sources = result.content?.result?.RelatedResults?.getEpisodeSources?.result || result.RelatedResults?.getEpisodeSources?.result;
console.log("ALL EPISODE SOURCES IN FAMILY GUY 1x2:");
console.log(JSON.stringify(sources, null, 2));
