// Test cases for open-redirect.yaml.
// "ruleid:" = the next line MUST be flagged. "ok:" = the next line must NOT be flagged.
// This file is deliberately vulnerable and is never shipped in the npm package.
const express = require("express");

const app = express();

app.get("/login", (req, res) => {
  // ruleid: aegiscode.javascript.open-redirect.tainted-redirect
  res.redirect(req.query.next);
  // ruleid: aegiscode.javascript.open-redirect.tainted-redirect
  res.redirect(302, req.query.returnTo);
  // ruleid: aegiscode.javascript.open-redirect.tainted-redirect
  res.setHeader("Location", req.query.url);
  // ruleid: aegiscode.javascript.open-redirect.tainted-redirect
  res.redirect("/" + req.query.path);
  // ok: aegiscode.javascript.open-redirect.tainted-redirect
  res.redirect("/users/" + req.query.id);
  // ok: aegiscode.javascript.open-redirect.tainted-redirect
  res.redirect(`https://shop.example.com/search?q=${req.query.q}`);
  // ok: aegiscode.javascript.open-redirect.tainted-redirect
  res.setHeader("X-Request-Id", req.query.id);
  // ok: aegiscode.javascript.open-redirect.tainted-redirect
  res.redirect("/dashboard");
});

router.get("/koa-login", async (ctx) => {
  // ruleid: aegiscode.javascript.open-redirect.tainted-redirect
  ctx.redirect(ctx.query.next);
});
