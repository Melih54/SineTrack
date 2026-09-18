const { execSync } = require('child_process');
const html = execSync('curl.exe -s -A "Mozilla/5.0" "https://dizilla.now/family-guy-1-sezon-2-bolum"', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('player') || l.includes('iframe') || l.includes('video') || l.includes('Altyazı') || l.includes('Dublaj')) {
    console.log(i, l.trim().slice(0, 150));
  }
});
