const { execSync } = require('child_process');

const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const iframeUrl = "https://four.pichive.online/iframe.php?v=23e0fc3639833246e56b9118d7189a4d";

console.log("--- TEST 1: NO REFERER ---");
try {
  const h1 = execSync(`curl.exe -s -I -A "${CHROME_UA}" "${iframeUrl}"`).toString('utf8');
  console.log(h1.substring(0, 300));
} catch (e) {
  console.log("Error 1:", e.message);
}

console.log("--- TEST 2: REFERER: http://localhost:3000 ---");
try {
  const h2 = execSync(`curl.exe -s -I -A "${CHROME_UA}" -H "Referer: http://localhost:3000/" "${iframeUrl}"`).toString('utf8');
  console.log(h2.substring(0, 300));
} catch (e) {
  console.log("Error 2:", e.message);
}
