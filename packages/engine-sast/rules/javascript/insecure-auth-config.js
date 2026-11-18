// Test cases for insecure-auth-config.yaml.
// "ruleid:" = the next line MUST be flagged. "ok:" = the next line must NOT be flagged.
// This file is deliberately vulnerable and is never shipped in the npm package.
const express = require("express");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const cookieSession = require("cookie-session");
const cors = require("cors");

const app = express();

function verifyToken(token) {
  // ruleid: aegiscode.javascript.insecure-auth-config.jwt-insecure-options
  jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256", "none"] });
  // ruleid: aegiscode.javascript.insecure-auth-config.jwt-insecure-options
  jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
  // ok: aegiscode.javascript.insecure-auth-config.jwt-insecure-options
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
}

function currentUser(req) {
  const token = req.headers.authorization.split(" ")[1];
  // ruleid: aegiscode.javascript.insecure-auth-config.jwt-decode-without-verify
  const payload = jwt.decode(token);
  return payload.sub;
}

function currentUserChecked(req) {
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  // ok: aegiscode.javascript.insecure-auth-config.jwt-decode-without-verify
  const payload = jwt.decode(token, { complete: true });
  return payload.header.kid;
}

app.post("/login", (req, res) => {
  // ruleid: aegiscode.javascript.insecure-auth-config.insecure-cookie-flags
  res.cookie("session", req.sessionID, { httpOnly: false, secure: true });
  // ok: aegiscode.javascript.insecure-auth-config.insecure-cookie-flags
  res.cookie("session", req.sessionID, { httpOnly: true, secure: true, sameSite: "lax" });
  res.end();
});

app.use(
  // ruleid: aegiscode.javascript.insecure-auth-config.insecure-cookie-flags
  session({ secret: process.env.SESSION_SECRET, cookie: { secure: false } }),
);
// ruleid: aegiscode.javascript.insecure-auth-config.insecure-cookie-flags
app.use(cookieSession({ name: "s", keys: [process.env.KEY], httpOnly: false }));
// ok: aegiscode.javascript.insecure-auth-config.insecure-cookie-flags
app.use(session({ secret: process.env.SESSION_SECRET, cookie: { secure: true, httpOnly: true } }));

// ruleid: aegiscode.javascript.insecure-auth-config.permissive-cors
app.use(cors({ origin: true, credentials: true }));
// ok: aegiscode.javascript.insecure-auth-config.permissive-cors
app.use(cors({ origin: ["https://shop.example.com"], credentials: true }));
// ok: aegiscode.javascript.insecure-auth-config.permissive-cors
app.use(cors({ origin: "*" }));

app.use((req, res, next) => {
  // ruleid: aegiscode.javascript.insecure-auth-config.permissive-cors
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
  // ok: aegiscode.javascript.insecure-auth-config.permissive-cors
  res.setHeader("Access-Control-Allow-Origin", "https://shop.example.com");
  next();
});
