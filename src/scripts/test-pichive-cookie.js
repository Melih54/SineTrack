const { execSync } = require('child_process');
const targetUrl = 'https://four.pichive.online/iframe.php?v=5ab18c61518866b97d0337ca58c07e99';
const curlCmd = `curl.exe -s -i -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Referer: https://dizilla.now/" -H "sec-ch-ua: \"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"" -H "sec-ch-ua-mobile: ?0" -H "sec-ch-ua-platform: \"Windows\"" -H "Sec-Fetch-Dest: iframe" -H "Sec-Fetch-Mode: navigate" -H "Sec-Fetch-Site: cross-site" "${targetUrl}"`;
const res = execSync(curlCmd, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const cookies = res.match(/set-cookie:[^\r\n]+/gi);
console.log('Set-Cookie headers:', cookies);
