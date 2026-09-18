const { execSync } = require('child_process');
const html = execSync('curl.exe -s -A "Mozilla/5.0" "https://dizipal1581.com/arama-yap?q=Game+of+Thrones"', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const links = html.match(/href="https:\/\/dizipal1581\.com\/[^"]+"/g);
console.log('Search results links:');
console.log([...new Set(links || [])].slice(0, 20));
