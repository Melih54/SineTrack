const { execSync } = require('child_process');
const html = require('fs').readFileSync('scratch_pichive_real.html', 'utf8');
const match = html.match(/openPlayer\('([^']+)'/);
if (match) {
  const playList = encodeURIComponent(match[1]);
  const url = `https://four.pichive.online/source2.php?v=${playList}`;
  const curlCmd = `curl.exe -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Referer: https://four.pichive.online/" "${url}"`;
  const res = execSync(curlCmd, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
  console.log('source2.php response:');
  console.log(res.slice(0, 2000));
}
