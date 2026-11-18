// Test cases for weak-crypto.yaml.
// "ruleid:" = the next line MUST be flagged. "ok:" = the next line must NOT be flagged.
// This file is deliberately vulnerable and is never shipped in the npm package.
const crypto = require("crypto");
const https = require("https");
const CryptoJS = require("crypto-js");
const md5 = require("md5");
const forge = require("node-forge");

function hashes(data, password) {
  // ruleid: aegiscode.javascript.weak-crypto.weak-hash
  crypto.createHash("md5").update(password).digest("hex");
  // ruleid: aegiscode.javascript.weak-crypto.weak-hash
  crypto.createHash("sha1").update(data).digest("hex");
  // ruleid: aegiscode.javascript.weak-crypto.weak-hash
  CryptoJS.MD5(password).toString();
  // ruleid: aegiscode.javascript.weak-crypto.weak-hash
  md5(password);
  // ok: aegiscode.javascript.weak-crypto.weak-hash
  crypto.createHash("sha256").update(data).digest("hex");
  // ok: aegiscode.javascript.weak-crypto.weak-hash
  CryptoJS.SHA256(data).toString();
}

function ciphers(key, text) {
  // ruleid: aegiscode.javascript.weak-crypto.weak-cipher
  crypto.createCipheriv("des-ede3-cbc", key, crypto.randomBytes(8));
  // ruleid: aegiscode.javascript.weak-crypto.weak-cipher
  crypto.createCipheriv("aes-128-ecb", key, null);
  // ruleid: aegiscode.javascript.weak-crypto.weak-cipher
  CryptoJS.DES.encrypt(text, key);
  // ruleid: aegiscode.javascript.weak-crypto.weak-cipher
  CryptoJS.AES.encrypt(text, key, { mode: CryptoJS.mode.ECB });
  // ok: aegiscode.javascript.weak-crypto.weak-cipher
  crypto.createCipheriv("aes-256-gcm", key, crypto.randomBytes(12));
  // ok: aegiscode.javascript.weak-crypto.weak-cipher
  CryptoJS.AES.encrypt(text, key);
}

function ivs(key, text) {
  // ruleid: aegiscode.javascript.weak-crypto.static-or-missing-iv
  crypto.createCipher("aes-256-cbc", key);
  // ruleid: aegiscode.javascript.weak-crypto.static-or-missing-iv
  crypto.createCipheriv("aes-256-cbc", key, "1234567890123456");
  const iv = Buffer.alloc(16, 0);
  // ruleid: aegiscode.javascript.weak-crypto.static-or-missing-iv
  crypto.createCipheriv("aes-256-cbc", key, iv);
  // ok: aegiscode.javascript.weak-crypto.static-or-missing-iv
  crypto.createCipheriv("aes-256-cbc", key, crypto.randomBytes(16));
}

function randoms(user) {
  // ruleid: aegiscode.javascript.weak-crypto.insecure-random
  const resetToken = Math.random().toString(36).slice(2);
  // ruleid: aegiscode.javascript.weak-crypto.insecure-random
  user.otp = Math.floor(100000 + Math.random() * 900000);
  // ok: aegiscode.javascript.weak-crypto.insecure-random
  const delayMs = Math.random() * 1000;
  // ok: aegiscode.javascript.weak-crypto.insecure-random
  const sessionToken = crypto.randomBytes(32).toString("hex");
  return { resetToken, delayMs, sessionToken };
}

// ruleid: aegiscode.javascript.weak-crypto.insecure-random
function generatePassword() {
  return Math.random().toString(36).slice(-10);
}

function keys() {
  // ruleid: aegiscode.javascript.weak-crypto.weak-rsa-key
  crypto.generateKeyPairSync("rsa", { modulusLength: 1024 });
  // ruleid: aegiscode.javascript.weak-crypto.weak-rsa-key
  forge.pki.rsa.generateKeyPair({ bits: 512 });
  // ok: aegiscode.javascript.weak-crypto.weak-rsa-key
  crypto.generateKeyPairSync("rsa", { modulusLength: 4096 });
}

// ruleid: aegiscode.javascript.weak-crypto.tls-verification-disabled
const agent = new https.Agent({ rejectUnauthorized: false });
// ruleid: aegiscode.javascript.weak-crypto.tls-verification-disabled
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// ok: aegiscode.javascript.weak-crypto.tls-verification-disabled
const safeAgent = new https.Agent({ rejectUnauthorized: true, ca: caCert });
