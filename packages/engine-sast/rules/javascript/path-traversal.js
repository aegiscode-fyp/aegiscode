// Test cases for path-traversal.yaml.
// "ruleid:" = the next line MUST be flagged. "ok:" = the next line must NOT be flagged.
// This file is deliberately vulnerable and is never shipped in the npm package.
const express = require("express");
const fs = require("node:fs");
const fsp = require("fs/promises");
const path = require("path");
const AdmZip = require("adm-zip");

const app = express();
const BASE = path.join(__dirname, "files");

app.get("/read", async (req, res) => {
  // ruleid: aegiscode.javascript.path-traversal.tainted-fs-path
  const text = fs.readFileSync(path.join(BASE, req.query.file), "utf8");
  // ruleid: aegiscode.javascript.path-traversal.tainted-fs-path
  await fsp.writeFile("uploads/" + req.body.name, req.body.content);
  // ruleid: aegiscode.javascript.path-traversal.tainted-fs-path
  fs.promises.unlink(req.params.file);
  // ok: aegiscode.javascript.path-traversal.tainted-fs-path
  fs.readFileSync(path.join(BASE, path.basename(req.query.file)));
  // ok: aegiscode.javascript.path-traversal.tainted-fs-path
  fs.readFileSync(path.join(BASE, "index.html"));
  res.send(text);
});

app.get("/download", (req, res) => {
  // ruleid: aegiscode.javascript.path-traversal.tainted-send-file
  res.sendFile(path.join(BASE, req.query.file));
  // ruleid: aegiscode.javascript.path-traversal.tainted-send-file
  res.download(`${BASE}/${req.params.name}`);
  // ok: aegiscode.javascript.path-traversal.tainted-send-file
  res.sendFile(req.query.file, { root: BASE });
  // ok: aegiscode.javascript.path-traversal.tainted-send-file
  res.sendFile(path.join(BASE, "report.pdf"));
});

function extract(zipPath, outDir) {
  const zip = new AdmZip(zipPath);
  for (const entry of zip.getEntries()) {
    // ruleid: aegiscode.javascript.path-traversal.zip-slip
    const target = path.join(outDir, entry.entryName);
    fs.writeFileSync(target, entry.getData());
  }
}

function safeExtract(zipPath, outDir) {
  const zip = new AdmZip(zipPath);
  for (const entry of zip.getEntries()) {
    // ok: aegiscode.javascript.path-traversal.zip-slip
    const target = path.resolve(outDir, entry.entryName);
    if (!target.startsWith(path.resolve(outDir) + path.sep)) continue;
    fs.writeFileSync(target, entry.getData());
  }
}
