const { execSync } = require('child_process');
const chunkUrls = [
  'static/chunks/97.1933901a38bed49d.js',
  'static/chunks/1911.7ad8819adab553f8.js'
];

for (const u of chunkUrls) {
  const code = execSync(`curl.exe -s -A "Mozilla/5.0" "https://dizilla.now/_next/${u}"`).toString('utf8');
  console.log(`=== ${u} === (length: ${code.length})`);
  const matches = code.match(/iframe|player|video|m3u8|hls|stream|source/gi);
  console.log('Matches:', [...new Set(matches)]);
}
