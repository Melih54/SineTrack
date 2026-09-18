const { execSync } = require('child_process');

const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const iframeUrl = "https://four.pichive.online/iframe.php?v=23e0fc3639833246e56b9118d7189a4d";

// Let's get master.m3u8 content
const masterM3u8 = execSync(`node src/scripts/test-m3u8.js`).toString('utf8');
const lines = masterM3u8.split('\n');
const ldUrls = lines.filter(l => l.includes('/ld.php?v='));
console.log('Found ldUrls count:', ldUrls.length);
if (ldUrls.length > 0) {
  // Extract URI from URI="..."
  const match = ldUrls[0].match(/URI="([^"]+)"/);
  if (match) {
    const ldUrl = match[1];
    console.log('Fetching ldUrl:\n', ldUrl.substring(0, 80) + '...');
    const ldContent = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: ${iframeUrl}" "${ldUrl}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
    console.log('ld.php content length:', ldContent.length);
    console.log('ld.php preview:\n', ldContent.substring(0, 800));
  }
}
