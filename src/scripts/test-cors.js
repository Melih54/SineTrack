const { execSync } = require('child_process');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('test_source2.json', 'utf8'));
const playList = fs.readFileSync('test_pichive.html', 'utf8').match(/window\.openPlayer\(\s*'([^']+)'/)[1];
const url = 'https://four.pichive.online/source2.php?v=' + encodeURIComponent(playList);

const headers = execSync(`curl.exe -s -I -A "Mozilla/5.0" -H "Origin: http://localhost:3000" -H "Referer: https://four.pichive.online/iframe.php?v=23e0fc3639833246e56b9118d7189a4d" "${url}"`).toString('utf8');
console.log('Headers from source2.php:\n', headers);
