const { execSync } = require('child_process');
const fs = require('fs');

const content = fs.readFileSync('test_pichive.html', 'utf8');
const match = content.match(/window\.openPlayer\(\s*'([^']+)'/);
const playList = match[1];

const iframeUrl = "https://four.pichive.online/iframe.php?v=23e0fc3639833246e56b9118d7189a4d";
const source2Url = "https://four.pichive.online/source2.php?v=" + encodeURIComponent(playList);

const raw = execSync(`curl.exe -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Referer: ${iframeUrl}" "${source2Url}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
fs.writeFileSync('test_source2.json', raw);
const data = JSON.parse(raw);
console.log("Keys in JSON:", Object.keys(data));
console.log("Sources count:", data.playlist?.[0]?.sources?.length);
data.playlist?.[0]?.sources?.forEach((s, idx) => {
  console.log(`[${idx}] title="${s.title}", file="${s.file}"`);
});
