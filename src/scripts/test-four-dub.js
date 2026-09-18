const { execSync } = require('child_process');
const fs = require('fs');

const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const hash = "36f8f5ab35b7fa2291ee10e47626a484";
const url = `https://pichive.online/iframe.php?v=${hash}`;
const html = execSync(`curl.exe -s -A "${CHROME_UA}" -H "Referer: https://dizilla.now/" "${url}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
fs.writeFileSync('test_pichive_dub.html', html);

const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log("Scripts count:", scripts.length);
scripts.forEach((s, i) => {
  if (!s.includes("jwplayer.js") && !s.includes("jquery")) {
    console.log(`--- Script ${i} (len ${s.length}) ---`);
    console.log(s.substring(0, 400));
  }
});
