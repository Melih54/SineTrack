const fs = require('fs');
const html = fs.readFileSync('scratch_pichive_real.html', 'utf8');
const p = html.indexOf('window.openPlayer');
console.log(html.substring(p, p + 2500));
