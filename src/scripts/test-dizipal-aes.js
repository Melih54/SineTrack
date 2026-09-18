const crypto = require("crypto");

const encryptedData = {"ciphertext":"MMEIJLdVxKJ5bVeY/AZMDkVO6++U3xVMka9P8RMm6GShNYpWhLnv4N96ojcQRwSRS9Prmv2XLCpZHnNXrUwWV8eRrfyfv9nWWjSD/C9LP8Y=","iv":"b21a634e575523064dd5a461c5a8cd52","salt":"204fe25dcdebe53c2631b6d5158e9984519a3e391eec19be4824e252bd2023a38d1b478a89a6632f33deca8a4a6ac7cced24fe30767880f589f5efdedb4316f7a8a9b10e58322b0f966a71db972fd4632fe1c83025d87b849870f779b7ccdcb479ea976fa763f7ee87ca5fa8f2c127e9b03a1c72d14721c8c7bdf8655bb542c95dc47b5ef0749c4a969b0d59eee55c0b4314a774569b3bddcd9bc94f50ed43a2bfa1189afd098613d9393151b5749084e3ff36ac0b1811064edd7ebc7c1697b42813bd95405c468d162c0785231c6af07d62ed0d1047b9a65bddf623b777d1139df98e1f2ffa6338a9f06d2e4e2c72443a2c3fc6f09bcdf8c0ee83c56fd08d0d"};

const password = "3hPn4uCjTVtfYWcjIcoJQ4cL1WWk1qxXI39egLYOmNv6IblA7eKJz68uU3eLzux1biZLCms0quEjTYniGv5z1JcKbNIsDQFSeIZOBZJz4is6pD7UyWDggWWzTLBQbHcQFpBQdClnuQaMNUHtLHTpzCvZy33p6I7wFBvL4fnXBYH84aUIyWGTRvM2G5cfoNf4705tO2kv";

const salt = Buffer.from(encryptedData.salt, "hex");
const iv = Buffer.from(encryptedData.iv, "hex");
const key = crypto.pbkdf2Sync(password, salt, 999, 32, "sha512");
const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
let dec = decipher.update(encryptedData.ciphertext, "base64", "utf8");
dec += decipher.final("utf8");

console.log("DECRYPTED DIZIPAL IFRAME SRC:");
console.log(dec);
