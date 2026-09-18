const { execSync } = require('child_process');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('test_source2.json', 'utf8'));
const m3u8Url = data.playlist[0].sources[0].file.replace('m.php', 'master.m3u8');
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const iframeUrl = "https://four.pichive.online/iframe.php?v=23e0fc3639833246e56b9118d7189a4d";

const res = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: ${iframeUrl}" "${m3u8Url}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
console.log(res);
