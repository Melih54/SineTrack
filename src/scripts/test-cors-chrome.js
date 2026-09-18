const { execSync } = require('child_process');
const fs = require('fs');

const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const playList = fs.readFileSync('test_pichive.html', 'utf8').match(/window\.openPlayer\(\s*'([^']+)'/)[1];
const url = 'https://four.pichive.online/source2.php?v=' + encodeURIComponent(playList);
const iframeUrl = "https://four.pichive.online/iframe.php?v=23e0fc3639833246e56b9118d7189a4d";

try {
  const headers = execSync(`curl.exe -s -I -A "${CHROME_UA}" -H "Origin: http://localhost:3000" -H "Referer: ${iframeUrl}" "${url}"`).toString('utf8');
  console.log('Headers from source2.php with CHROME_UA:\n', headers);
} catch (e) {
  console.error('Error:', e.message);
}
