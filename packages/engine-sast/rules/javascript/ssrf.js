// Test cases for ssrf.yaml.
// "ruleid:" = the next line MUST be flagged. "ok:" = the next line must NOT be flagged.
// This file is deliberately vulnerable and is never shipped in the npm package.
const express = require("express");
const axios = require("axios");
const http = require("http");

const app = express();

app.get("/preview", async (req, res) => {
  // ruleid: aegiscode.javascript.ssrf.tainted-request-url
  const page = await fetch(req.query.url);
  // ruleid: aegiscode.javascript.ssrf.tainted-request-url
  const img = await axios.get(req.body.imageUrl, { responseType: "arraybuffer" });
  // ruleid: aegiscode.javascript.ssrf.tainted-request-url
  await axios({ method: "post", url: req.body.webhook, data: {} });
  // ruleid: aegiscode.javascript.ssrf.tainted-request-url
  http.get("http://" + req.query.host + "/status");
  // ok: aegiscode.javascript.ssrf.tainted-request-url
  await axios.get("https://api.github.com/users/" + req.query.user);
  // ok: aegiscode.javascript.ssrf.tainted-request-url
  await fetch(`https://api.example.com/items/${req.params.id}`);
  // ok: aegiscode.javascript.ssrf.tainted-request-url
  await fetch("https://api.example.com/health");
  res.json({ page, img });
});

app.get("/proxy", (req, res) => {
  // ruleid: aegiscode.javascript.ssrf.tainted-request-host
  http.request({ hostname: req.query.target, path: "/", method: "GET" });
  // ruleid: aegiscode.javascript.ssrf.tainted-request-host
  const client = axios.create({ baseURL: req.body.api });
  // ruleid: aegiscode.javascript.ssrf.tainted-request-host
  const url = new URL("/v1/data", req.query.base);
  // ok: aegiscode.javascript.ssrf.tainted-request-host
  http.request({ hostname: "api.internal", path: "/" + req.query.page });
  // ok: aegiscode.javascript.ssrf.tainted-request-host
  const fixed = axios.create({ baseURL: process.env.API_URL });
  res.json({ client, url, fixed });
});
