// Test cases for sql-injection.yaml. Run: semgrep --test packages/engine-sast/rules
// "ruleid:" = the next line MUST be flagged. "ok:" = the next line must NOT be flagged.
// This file is deliberately vulnerable and is never shipped in the npm package.
const express = require("express");
const mysql = require("mysql2");
const knex = require("knex")({ client: "pg" });
const { Sequelize } = require("sequelize");
const { PrismaClient, Prisma } = require("@prisma/client");

const app = express();
const db = mysql.createConnection({});
const sequelize = new Sequelize("sqlite::memory:");
const prisma = new PrismaClient();

app.get("/users", (req, res) => {
  const id = req.query.id;

  // ruleid: aegiscode.javascript.sql-injection.tainted-query, aegiscode.javascript.sql-injection.string-built-query
  db.query("SELECT * FROM users WHERE id = " + id);

  // ruleid: aegiscode.javascript.sql-injection.tainted-query, aegiscode.javascript.sql-injection.string-built-query
  db.execute(`SELECT * FROM users WHERE name = '${req.query.name}'`);

  // ruleid: aegiscode.javascript.sql-injection.tainted-query
  db.query(req.body.sql);

  // ruleid: aegiscode.javascript.sql-injection.tainted-query, aegiscode.javascript.sql-injection.string-built-query
  db.query({ sql: "SELECT * FROM t WHERE a = '" + req.body.a + "'" });

  // ok: aegiscode.javascript.sql-injection.tainted-query
  db.query("SELECT * FROM users WHERE id = ?", [id]);

  // ok: aegiscode.javascript.sql-injection.tainted-query
  db.query("SELECT * FROM users WHERE id = " + parseInt(req.query.id, 10));

  // ok: aegiscode.javascript.sql-injection.tainted-query
  db.query("SELECT * FROM users WHERE id = " + db.escape(id));

  // ok: aegiscode.javascript.sql-injection.tainted-query
  cache.get(req.query.key);

  res.send("done");
});

app.post("/sqlite", async (request, response) => {
  const { name } = request.body;
  // ruleid: aegiscode.javascript.sql-injection.tainted-query
  this.db.all(`SELECT * FROM items WHERE name = '${name}'`);
  // ok: aegiscode.javascript.sql-injection.tainted-query
  this.db.all("SELECT * FROM items WHERE name = ?", [name]);
});

function listOrders(table, limit) {
  const TABLE = "orders";
  // ruleid: aegiscode.javascript.sql-injection.string-built-query
  db.query("SELECT * FROM " + table);

  const sql = "SELECT * FROM t WHERE x = '" + limit + "'";
  // ruleid: aegiscode.javascript.sql-injection.string-built-query
  db.query(sql);

  // ok: aegiscode.javascript.sql-injection.string-built-query
  db.query("SELECT * FROM " + TABLE);

  // ok: aegiscode.javascript.sql-injection.string-built-query
  db.query(`SELECT * FROM users`);

  // ok: aegiscode.javascript.sql-injection.string-built-query
  db.query("SELECT * FROM users LIMIT " + 10);

  // ok: aegiscode.javascript.sql-injection.string-built-query
  db.query("SELECT * FROM users LIMIT " + parseInt(limit, 10) + " OFFSET 0");
}

app.get("/sequelize", async (req, res) => {
  // ruleid: aegiscode.javascript.sql-injection.sequelize-literal
  await User.findAll({ where: sequelize.literal("name = '" + req.query.name + "'") });
  // ok: aegiscode.javascript.sql-injection.sequelize-literal
  await User.findAll({ where: sequelize.literal("deleted_at IS NULL") });
  // ok: aegiscode.javascript.sql-injection.sequelize-literal
  await User.findAll({ where: { name: req.query.name } });
});

app.get("/knex", async (req, res) => {
  // ruleid: aegiscode.javascript.sql-injection.knex-raw
  await knex.raw("SELECT * FROM users WHERE id = " + req.params.id);
  // ruleid: aegiscode.javascript.sql-injection.knex-raw
  await knex("users").whereRaw(`name = '${req.query.name}'`);
  // ruleid: aegiscode.javascript.sql-injection.knex-raw
  await knex("users").orderByRaw(req.query.sort);
  // ok: aegiscode.javascript.sql-injection.knex-raw
  await knex.raw("SELECT * FROM users WHERE id = ?", [req.params.id]);
  // ok: aegiscode.javascript.sql-injection.knex-raw
  await knex("users").where("name", req.query.name);
});

app.get("/typeorm", async (req, res) => {
  const qb = dataSource.getRepository(User).createQueryBuilder("user");
  // ruleid: aegiscode.javascript.sql-injection.query-builder-string
  await qb.where(`user.name = '${req.query.name}'`).getMany();
  // ruleid: aegiscode.javascript.sql-injection.query-builder-string
  await qb.andWhere("user.id = " + req.query.id).getMany();
  // ok: aegiscode.javascript.sql-injection.query-builder-string
  await qb.where("user.name = :name", { name: req.query.name }).getMany();
});

app.get("/prisma", async (req, res) => {
  const email = req.query.email;
  // ruleid: aegiscode.javascript.sql-injection.prisma-unsafe-raw
  await prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE email = '${email}'`);
  // ruleid: aegiscode.javascript.sql-injection.prisma-unsafe-raw
  await prisma.$executeRawUnsafe("DELETE FROM t WHERE id = " + email);
  // ok: aegiscode.javascript.sql-injection.prisma-unsafe-raw
  await prisma.$queryRawUnsafe('SELECT * FROM "User" WHERE email = $1', email);
  // ok: aegiscode.javascript.sql-injection.prisma-unsafe-raw
  await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${email}`;
});
