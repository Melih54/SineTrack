const { execSync } = require('child_process');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('test_source2.json', 'utf8'));
const m3u8Url = data.playlist[0].sources[0].file.replace('m.php', 'master.m3u8');
const iframeUrl = "https://four.pichive.online/iframe.php?v=23e0fc3639833246e56b9118d7189a4d";

try {
  const headers = execSync(`curl.exe -s -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Origin: http://localhost:3000" -H "Referer: ${iframeUrl}" "${m3u8Url}"`).toString('utf8');
  console.log('Headers from master.m3u8:\n', headers);
} catch (e) {
  console.error('Error:', e.message);
}
