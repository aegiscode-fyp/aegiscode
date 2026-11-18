// Test cases for prototype-pollution.yaml.
// "ruleid:" = the next line MUST be flagged. "ok:" = the next line must NOT be flagged.
// This file is deliberately vulnerable and is never shipped in the npm package.
const express = require("express");
const _ = require("lodash");
const objectPath = require("object-path");

const app = express();
const settings = {};

app.post("/settings", (req, res) => {
  const { section, key, value } = req.body;
  // ruleid: aegiscode.javascript.prototype-pollution.tainted-key-assignment
  settings[section][key] = value;

  const group = settings[req.body.group];
  // ruleid: aegiscode.javascript.prototype-pollution.tainted-key-assignment
  group[req.body.name] = req.body.value;

  // ok: aegiscode.javascript.prototype-pollution.tainted-key-assignment
  settings.theme[key] = value;

  const safe = Object.create(null);
  // ok: aegiscode.javascript.prototype-pollution.tainted-key-assignment
  safe[section][key] = value;

  // ruleid: aegiscode.javascript.prototype-pollution.tainted-deep-merge
  _.merge(settings, req.body);
  // ruleid: aegiscode.javascript.prototype-pollution.tainted-deep-merge
  $.extend(true, {}, settings, req.body.prefs);
  // ruleid: aegiscode.javascript.prototype-pollution.tainted-deep-merge
  deepMerge(settings, req.body);
  // ok: aegiscode.javascript.prototype-pollution.tainted-deep-merge
  _.merge(settings, { theme: "dark" });
  // ok: aegiscode.javascript.prototype-pollution.tainted-deep-merge
  _.merge(settings, _.pick(defaults, ["theme"]));

  // ruleid: aegiscode.javascript.prototype-pollution.tainted-set-by-path
  _.set(settings, req.body.path, req.body.value);
  // ruleid: aegiscode.javascript.prototype-pollution.tainted-set-by-path
  objectPath.set(settings, req.query.field, "on");
  // ok: aegiscode.javascript.prototype-pollution.tainted-set-by-path
  _.set(settings, "ui.theme", req.body.value);

  res.json(settings);
});

function merge(target, source) {
  for (const key in source) {
    if (typeof source[key] === "object") {
      // ruleid: aegiscode.javascript.prototype-pollution.unsafe-recursive-merge
      merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const deepCopy = (target, source) => {
  Object.keys(source).forEach((key) => {
    // ruleid: aegiscode.javascript.prototype-pollution.unsafe-recursive-merge
    deepCopy(target[key], source[key]);
  });
};

function safeMerge(target, source) {
  for (const key in source) {
    if (key === "__proto__" || key === "constructor") continue;
    // ok: aegiscode.javascript.prototype-pollution.unsafe-recursive-merge
    safeMerge(target[key], source[key]);
  }
  return target;
}

function guardedMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (isSafeKey(key)) {
      // ok: aegiscode.javascript.prototype-pollution.unsafe-recursive-merge
      guardedMerge(target[key], source[key]);
    }
  }
}
