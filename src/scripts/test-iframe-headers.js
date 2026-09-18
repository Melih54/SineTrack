const { execSync } = require('child_process');

const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const iframeUrl = "https://four.pichive.online/iframe.php?v=23e0fc3639833246e56b9118d7189a4d";

try {
  const headers = execSync(`curl.exe -s -I -A "${CHROME_UA}" -H "Referer: https://dizilla.now/" "${iframeUrl}"`).toString('utf8');
  console.log('Headers from iframe.php:\n', headers);
} catch (e) {
  console.error('Error:', e.message);
}
