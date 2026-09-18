const { execSync } = require('child_process');
const targetUrl = 'https://four.pichive.online/iframe.php?v=5ab18c61518866b97d0337ca58c07e99';
const curlCmd = `curl.exe -s -A "Mozilla/5.0" -H "Referer: https://dizilla.now/" "${targetUrl}"`;
const html = execSync(curlCmd, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');

console.log(html.slice(1000, 2500));
