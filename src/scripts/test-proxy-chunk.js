const { execSync } = require('child_process');

const chunkUrl = "https://lkm-rfl68k.q3ed8s147n.cfd/f/26632490/2130599252-387cff0a7d75873cf913/m/a/fbe27.jpg";
const ref = "https://four.pichive.online/";

const proxyUrl = `http://localhost:3000/api/player/stream-proxy?ref=${encodeURIComponent(ref)}&url=${encodeURIComponent(chunkUrl)}`;
console.log('Testing proxyUrl...');
const head = execSync(`curl.exe -s -I "${proxyUrl}"`).toString('utf8');
console.log('Proxy response:\n', head);
