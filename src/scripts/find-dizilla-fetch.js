const fs = require('fs');
const code = fs.readFileSync('scratch_dizilla_slug.js', 'utf8');

const matches = code.match(/XMLHttpRequest|axios|\.get\(|\.post\(/gi);
console.log('Http clients in slug chunk:', matches);
