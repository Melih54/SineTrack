const { execSync } = require('child_process');
const fs = require('fs');

const url = "https://pichive.online/iframe.php?v=36f8f5ab35b7fa2291ee10e47626a484";
const html = execSync(`curl.exe -s -A "Mozilla/5.0" -H "Referer: https://dizilla.now/" "${url}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
fs.writeFileSync('test_dub.html', html);
console.log("HTML length:", html.length);
console.log("Head:", html.substring(0, 500));

// Find script tags
const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log("Found scripts:", scripts.length);
scripts.forEach((s, i) => {
  console.log(`--- Script ${i} (len ${s.length}) ---`);
  console.log(s.substring(0, 300));
});
