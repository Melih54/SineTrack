const { execSync } = require('child_process');
const html = require('fs').readFileSync('scratch_pichive_real.html', 'utf8');
const match = html.match(/openPlayer\('([^']+)'/);
const playList = encodeURIComponent(match[1]);
const url = `https://four.pichive.online/source2.php?v=${playList}`;
const curlCmd = `curl.exe -s -i -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Referer: https://four.pichive.online/iframe.php?v=5ab18c61518866b97d0337ca58c07e99" -H "sec-ch-ua: \"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"" -H "sec-ch-ua-mobile: ?0" -H "sec-ch-ua-platform: \"Windows\"" -H "Sec-Fetch-Dest: empty" -H "Sec-Fetch-Mode: cors" -H "Sec-Fetch-Site: same-origin" "${url}"`;
const res = execSync(curlCmd, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
console.log(res.slice(0, 1000));
