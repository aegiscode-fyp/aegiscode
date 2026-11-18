// Test cases for code-injection.yaml.
// "ruleid:" = the next line MUST be flagged. "ok:" = the next line must NOT be flagged.
// This file is deliberately vulnerable and is never shipped in the npm package.
const express = require("express");
const vm = require("vm");
const { VM } = require("vm2");

const app = express();

app.post("/calc", (req, res) => {
  // ruleid: aegiscode.javascript.code-injection.tainted-eval
  const result = eval(req.body.expression);
  // ruleid: aegiscode.javascript.code-injection.tainted-eval
  const fn = new Function("x", "return " + req.body.formula);
  // ruleid: aegiscode.javascript.code-injection.tainted-eval
  setTimeout("notify('" + req.query.user + "')", 1000);
  // ok: aegiscode.javascript.code-injection.tainted-eval
  setTimeout(() => notify(req.query.user), 1000);
  // ok: aegiscode.javascript.code-injection.tainted-eval
  const data = JSON.parse(req.body.json);
  // ok: aegiscode.javascript.code-injection.tainted-eval
  eval("1 + 1");
  res.json({ result, fn, data });
});

app.post("/sandbox", (req, res) => {
  // ruleid: aegiscode.javascript.code-injection.tainted-vm-code
  vm.runInNewContext(req.body.code, { console });
  // ruleid: aegiscode.javascript.code-injection.tainted-vm-code
  new vm.Script(req.body.code);
  const box = new VM({ timeout: 100 });
  // ruleid: aegiscode.javascript.code-injection.tainted-vm-code
  box.run(req.body.code);
  // ok: aegiscode.javascript.code-injection.tainted-vm-code
  vm.runInNewContext("1 + 1");
});

app.get("/plugin", async (req, res) => {
  // ruleid: aegiscode.javascript.code-injection.tainted-dynamic-require
  const plugin = require("./plugins/" + req.query.name);
  // ruleid: aegiscode.javascript.code-injection.tainted-dynamic-require
  const mod = await import(req.query.module);
  // ok: aegiscode.javascript.code-injection.tainted-dynamic-require
  const helper = require("./plugins/helper");
  res.json({ plugin, mod, helper });
});
