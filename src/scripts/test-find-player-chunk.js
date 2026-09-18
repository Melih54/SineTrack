const { execSync } = require('child_process');
const webpack = execSync('curl.exe -s -A "Mozilla/5.0" "https://dizilla.now/_next/static/chunks/webpack-925b46c8f474e060.js"').toString('utf8');
const p = webpack.indexOf('({');
const end = webpack.indexOf('}[e]', p);
const mapStr = webpack.substring(p + 1, end + 1);
const map = eval('(' + mapStr + ')');
console.log('Total dynamic chunks:', Object.keys(map).length);

for (const id of Object.keys(map)) {
  const hash = map[id];
  const url = `https://dizilla.now/_next/static/chunks/${id}.${hash}.js`;
  try {
    const code = execSync(`curl.exe -s -A "Mozilla/5.0" "${url}"`).toString('utf8');
    if (code.includes('m3u8') || code.includes('hls') || code.includes('player') || code.includes('iframe') || code.includes('video')) {
      const hits = code.match(/m3u8|jwplayer|artplayer|video\.js|hls\.js|rapidvid|dplayer/gi);
      if (hits && hits.length > 0) {
        console.log(`CHUNK ${id}.${hash}.js has hits:`, [...new Set(hits)]);
      }
    }
  } catch (e) {}
}
