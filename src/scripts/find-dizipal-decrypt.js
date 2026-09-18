const fs = require('fs');
const code = fs.readFileSync('scratch_dizipal_app.js', 'utf8');

let idx = 0;
while ((idx = code.indexOf('CryptoJS', idx)) !== -1) {
  console.log('CryptoJS at', idx);
  console.log(code.substring(Math.max(0, idx - 100), Math.min(code.length, idx + 300)));
  idx += 8;
}
