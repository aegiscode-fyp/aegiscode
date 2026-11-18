// Test cases for nosql-injection.yaml.
// "ruleid:" = the next line MUST be flagged. "ok:" = the next line must NOT be flagged.
// This file is deliberately vulnerable and is never shipped in the npm package.
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
const User = mongoose.model("User", new mongoose.Schema({ username: String, password: String }));

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // ruleid: aegiscode.javascript.nosql-injection.tainted-query-filter
  const user = await User.findOne({ username: username, password: password });
  // ruleid: aegiscode.javascript.nosql-injection.tainted-query-filter
  await db.collection("users").find(req.query).toArray();
  // ruleid: aegiscode.javascript.nosql-injection.tainted-query-filter
  await User.deleteMany({ owner: req.body.owner });
  // ok: aegiscode.javascript.nosql-injection.tainted-query-filter
  await User.findOne({ username: String(username), password: String(password) });
  // ok: aegiscode.javascript.nosql-injection.tainted-query-filter
  await User.findOne({ username: `${username}` });
  // ok: aegiscode.javascript.nosql-injection.tainted-query-filter
  await User.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
  // ok: aegiscode.javascript.nosql-injection.tainted-query-filter
  await User.findOne({ username: "admin" });
  res.json(user);
});

app.get("/search", async (req, res) => {
  // ruleid: aegiscode.javascript.nosql-injection.tainted-where-operator
  await User.find({ $where: "this.username == '" + req.query.name + "'" });
  // ruleid: aegiscode.javascript.nosql-injection.tainted-where-operator
  await User.find().$where(req.query.filter);
  // ok: aegiscode.javascript.nosql-injection.tainted-where-operator
  await User.find({ $where: "this.age > 18" });

  // ruleid: aegiscode.javascript.nosql-injection.tainted-regex-query
  await Product.find({ name: { $regex: req.query.q, $options: "i" } });
  // ruleid: aegiscode.javascript.nosql-injection.tainted-regex-query
  await Product.find({ name: new RegExp(req.query.q, "i") });
  // ok: aegiscode.javascript.nosql-injection.tainted-regex-query
  await Product.find({ name: { $regex: _.escapeRegExp(req.query.q), $options: "i" } });
  // ok: aegiscode.javascript.nosql-injection.tainted-regex-query
  await Product.find({ name: { $regex: "^shoe" } });
});
