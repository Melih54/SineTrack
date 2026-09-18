const crypto = require("crypto");
const { execSync } = require("child_process");

const password = "3hPn4uCjTVtfYWcjIcoJQ4cL1WWk1qxXI39egLYOmNv6IblA7eKJz68uU3eLzux1biZLCms0quEjTYniGv5z1JcKbNIsDQFSeIZOBZJz4is6pD7UyWDggWWzTLBQbHcQFpBQdClnuQaMNUHtLHTpzCvZy33p6I7wFBvL4fnXBYH84aUIyWGTRvM2G5cfoNf4705tO2kv";

function decryptDizipal(html) {
  const match = html.match(/data-rm-k="true">([^<]+)<\/div>/);
  if (!match) return null;
  const rawJson = match[1].replace(/&quot;/g, '"');
  const encryptedData = JSON.parse(rawJson);

  const salt = Buffer.from(encryptedData.salt, "hex");
  const iv = Buffer.from(encryptedData.iv, "hex");
  const key = crypto.pbkdf2Sync(password, salt, 999, 32, "sha512");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let dec = decipher.update(encryptedData.ciphertext, "base64", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

const html = execSync('curl.exe -s -L -A "Mozilla/5.0" "https://dizipal1581.com/bolum/breaking-bad-1x1"', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const iframeUrl = decryptDizipal(html);
console.log("Breaking Bad 1x1 Iframe URL:", iframeUrl);
