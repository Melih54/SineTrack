const { execSync } = require('child_process');
const html = execSync('curl.exe -s -A "Mozilla/5.0" "https://dizipal1581.com/bolum/game-of-thrones-1x1-c10"', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const p = html.lastIndexOf('searchInp', 69000);
console.log('before 69000:', p);
if (p !== -1) console.log(html.slice(p - 100, p + 300));
