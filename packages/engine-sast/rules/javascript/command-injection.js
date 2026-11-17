// Test cases for command-injection.yaml.
// "ruleid:" = the next line MUST be flagged. "ok:" = the next line must NOT be flagged.
// This file is deliberately vulnerable and is never shipped in the npm package.
const express = require("express");
const cp = require("child_process");
const { exec, execFile } = require("node:child_process");
const shell = require("shelljs");
const { execaCommand } = require("execa");

const app = express();

app.get("/ping", (req, res) => {
  const host = req.query.host;
  // ruleid: aegiscode.javascript.command-injection.tainted-exec, aegiscode.javascript.command-injection.exec-non-literal
  cp.exec("ping -c 1 " + host);
  // ruleid: aegiscode.javascript.command-injection.tainted-exec, aegiscode.javascript.command-injection.exec-non-literal
  exec(`nslookup ${req.query.domain}`, (err, out) => res.send(out));
  // ruleid: aegiscode.javascript.command-injection.tainted-exec
  cp.spawn(req.body.program, ["--version"]);
  // ruleid: aegiscode.javascript.command-injection.tainted-exec
  require("child_process").execSync(req.body.cmd);
  // ok: aegiscode.javascript.command-injection.tainted-exec
  execFile("ping", ["-c", "1", host]);
  // ok: aegiscode.javascript.command-injection.tainted-exec
  cp.exec("ping -c " + parseInt(req.query.count, 10) + " localhost");
  // ok: aegiscode.javascript.command-injection.tainted-exec
  cp.exec("uptime");
});

app.post("/convert", (req, res) => {
  // ruleid: aegiscode.javascript.command-injection.tainted-shell-library
  shell.exec("convert " + req.body.file + " out.png");
  // ruleid: aegiscode.javascript.command-injection.tainted-shell-library
  execaCommand(`git log ${req.body.ref}`);
  // ok: aegiscode.javascript.command-injection.tainted-shell-library
  shell.exec("npm run build");
});

function backup(dir, name) {
  const BACKUP_DIR = "/var/backups";
  // ruleid: aegiscode.javascript.command-injection.exec-non-literal
  cp.execSync("tar czf " + name + ".tgz " + dir);
  const cmd = `rm -rf ${dir}/tmp`;
  // ruleid: aegiscode.javascript.command-injection.exec-non-literal
  exec(cmd);
  // ruleid: aegiscode.javascript.command-injection.exec-non-literal
  cp.exec(["ls", dir].join(" "));
  // ok: aegiscode.javascript.command-injection.exec-non-literal
  cp.execSync("ls -la " + BACKUP_DIR);
  // ok: aegiscode.javascript.command-injection.exec-non-literal
  cp.execSync("ls -la /tmp");
}

function runTool(tool, file) {
  // ruleid: aegiscode.javascript.command-injection.spawn-shell-true
  cp.spawn("convert", [file, "out.png"], { shell: true });
  // ruleid: aegiscode.javascript.command-injection.spawn-shell-true
  cp.spawn(tool, { shell: true });
  // ruleid: aegiscode.javascript.command-injection.spawn-shell-true
  cp.execFileSync("git", ["log", file], { shell: "/bin/bash" });
  // ok: aegiscode.javascript.command-injection.spawn-shell-true
  cp.spawn("npm", ["install"], { shell: true });
  // ok: aegiscode.javascript.command-injection.spawn-shell-true
  cp.spawn("convert", [file, "out.png"]);
  // ok: aegiscode.javascript.command-injection.spawn-shell-true
  cp.spawn(tool, [file], { shell: false });
}
