const { execSync } = require('child_process');
const code = execSync('curl.exe -s -A "Mozilla/5.0" "https://dizilla.now/_next/static/chunks/pages/_app-62e92aeedbdc35dc.js"', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const idx = code.indexOf('379:function');
console.log(code.substring(idx, idx + 2500));
