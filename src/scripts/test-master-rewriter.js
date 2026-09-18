const { execSync } = require('child_process');

const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const iframeUrl = "https://four.pichive.online/iframe.php?v=23e0fc3639833246e56b9118d7189a4d";

// 1. Fetch iframe
const html = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: https://dizilla.now/" "${iframeUrl}"`, { maxBuffer: 15 * 1024 * 1024 }).toString('utf8');
const playList = html.match(/window\.openPlayer\(\s*'([^']+)'/)[1];

// 2. Fetch source2.php
const s2Raw = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: ${iframeUrl}" "https://four.pichive.online/source2.php?v=${encodeURIComponent(playList)}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const s2Json = JSON.parse(s2Raw);
const masterUrl = s2Json.playlist[0].sources[0].file.replace('m.php', 'master.m3u8');

// 3. Fetch master m3u8
const masterM3u8 = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: ${iframeUrl}" "${masterUrl}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');

// Test rewriting master playlist for tr_dub
function rewriteMaster(content, isDub) {
  const lines = content.split('\n');
  const out = [];
  for (let line of lines) {
    if (line.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
      const isTr = line.includes('LANGUAGE="tr"');
      if (isDub) {
        line = line.replace(/DEFAULT=(YES|NO)/, isTr ? 'DEFAULT=YES' : 'DEFAULT=NO')
                   .replace(/AUTOSELECT=(YES|NO)/, isTr ? 'AUTOSELECT=YES' : 'AUTOSELECT=NO');
      } else {
        line = line.replace(/DEFAULT=(YES|NO)/, !isTr ? 'DEFAULT=YES' : 'DEFAULT=NO')
                   .replace(/AUTOSELECT=(YES|NO)/, !isTr ? 'AUTOSELECT=YES' : 'AUTOSELECT=NO');
      }
      line = line.replace(/URI="([^"]+)"/, (match, uri) => {
        return `URI="/api/player/dizi-m3u8?playlistUrl=${encodeURIComponent(uri)}&ref=${encodeURIComponent(iframeUrl)}"`;
      });
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      line = `/api/player/dizi-m3u8?playlistUrl=${encodeURIComponent(line.trim())}&ref=${encodeURIComponent(iframeUrl)}`;
    }
    out.push(line);
  }
  return out.join('\n');
}

const rewrittenMaster = rewriteMaster(masterM3u8, true);
console.log('--- REWRITTEN MASTER M3U8 PREVIEW ---');
console.log(rewrittenMaster.substring(0, 1000));
