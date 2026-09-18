const { execSync } = require('child_process');

const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const iframeUrl = "https://four.pichive.online/iframe.php?v=23e0fc3639833246e56b9118d7189a4d";

// 1. Fetch iframe HTML
const html = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: https://dizilla.now/" "${iframeUrl}"`, { maxBuffer: 15 * 1024 * 1024 }).toString('utf8');
const playList = html.match(/window\.openPlayer\(\s*'([^']+)'/)[1];

// 2. Fetch source2.php
const s2Raw = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: ${iframeUrl}" "https://four.pichive.online/source2.php?v=${encodeURIComponent(playList)}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const s2Json = JSON.parse(s2Raw);
const m3u8Url = s2Json.playlist[0].sources[0].file.replace('m.php', 'master.m3u8');
console.log('Step 1 & 2 Success: Got m3u8Url:', m3u8Url.substring(0, 60) + '...');

// 3. Fetch master.m3u8
const masterM3u8 = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: ${iframeUrl}" "${m3u8Url}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
console.log('Step 3 Success: Got master.m3u8, length:', masterM3u8.length);

// 4. Extract audio & video playlist URLs
const lines = masterM3u8.split('\n');
const audioMatch = masterM3u8.match(/URI="([^"]+)"/);
const audioUrl = audioMatch ? audioMatch[1] : null;
const videoUrl = lines.find(l => l.includes('/l.php?v='));

console.log('Audio playlist URL:', audioUrl ? audioUrl.substring(0, 60) + '...' : 'none');
console.log('Video playlist URL:', videoUrl ? videoUrl.substring(0, 60) + '...' : 'none');

// 5. Fetch audio playlist
if (audioUrl) {
  const audioPl = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: ${iframeUrl}" "${audioUrl}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
  const firstAudioChunk = audioPl.split('\n').find(l => l.startsWith('http'));
  console.log('Step 5 Success: First audio chunk:', firstAudioChunk ? firstAudioChunk.substring(0, 60) + '...' : 'none');
  if (firstAudioChunk) {
    const chunkHead = execSync(`curl.exe -s -I "${firstAudioChunk.trim()}"`).toString('utf8');
    console.log('Audio chunk response:', chunkHead.split('\n')[0].trim());
  }
}

// 6. Fetch video playlist
if (videoUrl) {
  const videoPl = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: ${iframeUrl}" "${videoUrl.trim()}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
  const firstVideoChunk = videoPl.split('\n').find(l => l.startsWith('http'));
  console.log('Step 6 Success: First video chunk:', firstVideoChunk ? firstVideoChunk.substring(0, 60) + '...' : 'none');
  if (firstVideoChunk) {
    const chunkHead = execSync(`curl.exe -s -I "${firstVideoChunk.trim()}"`).toString('utf8');
    console.log('Video chunk response:', chunkHead.split('\n')[0].trim());
  }
}
