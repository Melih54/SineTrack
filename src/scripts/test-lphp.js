const { execSync } = require('child_process');
const fs = require('fs');

const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const iframeUrl = "https://four.pichive.online/iframe.php?v=23e0fc3639833246e56b9118d7189a4d";

// Let's get master.m3u8 content
const masterM3u8 = execSync(`node src/scripts/test-m3u8.js`).toString('utf8');
const lines = masterM3u8.split('\n');
const lUrls = lines.filter(l => l.includes('/l.php?v='));
console.log('Found lUrls count:', lUrls.length);
if (lUrls.length > 0) {
  const lUrl = lUrls[0].trim();
  console.log('Fetching first lUrl:\n', lUrl.substring(0, 80) + '...');
  const lContent = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: ${iframeUrl}" "${lUrl}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
  console.log('l.php content length:', lContent.length);
  console.log('l.php preview:\n', lContent.substring(0, 800));
}
