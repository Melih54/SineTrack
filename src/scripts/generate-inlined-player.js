const { execSync } = require('child_process');
const fs = require('fs');

const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const iframeUrl = "https://four.pichive.online/iframe.php?v=23e0fc3639833246e56b9118d7189a4d";

let html = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: https://dizilla.now/" "${iframeUrl}"`, { maxBuffer: 15 * 1024 * 1024 }).toString('utf8');

const plMatch = html.match(/window\.openPlayer\(\s*'([^']+)'/);
if (!plMatch) {
  console.log('openPlayer not found');
  process.exit(1);
}

const playList = plMatch[1];
const s2Raw = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: ${iframeUrl}" "https://four.pichive.online/source2.php?v=${encodeURIComponent(playList)}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const s2Json = JSON.parse(s2Raw);

console.log('s2 state:', s2Json.state);

// Remove anti-devtool
html = html.replace(/<script[^>]*disable-devtool[^>]*><\/script>/gi, "");

// Inline source2.php
html = html.replace(
  '$.getJSON("source2.php?v=" + playList, function (Response) {',
  `(function(cb){ cb(${JSON.stringify(s2Json)}); })(function (Response) {`
);

// Auto-call initP
html = html.replace('//initP()', 'setTimeout(function(){ if (typeof initP === "function") initP(); }, 100);');

// Inject base href
html = html.replace("<head>", `<head><base href="https://four.pichive.online/">`);

fs.writeFileSync('test_player_inlined.html', html);
console.log('Written test_player_inlined.html, length:', html.length);
