const { execSync } = require('child_process');
const html = execSync('curl.exe -s -A "Mozilla/5.0" "https://dizilla.now/family-guy-1-sezon-2-bolum"', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const chunks = html.match(/src="(\/_next\/static\/chunks\/[^"]+)"/g);
console.log('All chunks:', chunks);
