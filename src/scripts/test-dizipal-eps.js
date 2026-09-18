const { execSync } = require('child_process');
const html = execSync('curl.exe -s -A "Mozilla/5.0" "https://dizipal1581.com/bolum/game-of-thrones-1x1-c10"', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const epLinks = html.match(/href="[^"]*bolum[^"]*"/g);
console.log('Bolum links in episode page:', epLinks?.slice(0, 15));

const diziLinks = html.match(/href="[^"]*dizi[^"]*"/g);
console.log('Dizi links in episode page:', diziLinks?.slice(0, 15));
