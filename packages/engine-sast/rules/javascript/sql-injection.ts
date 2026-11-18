// TypeScript test cases for sql-injection.yaml (NestJS and Koa request sources).
// This file is deliberately vulnerable and is never shipped in the npm package.
import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";

@Controller("users")
export class UsersController {
  constructor(private readonly db: any) {}

  @Get(":id")
  findOne(@Param("id") id: string) {
    // ruleid: aegiscode.javascript.sql-injection.tainted-query, aegiscode.javascript.sql-injection.string-built-query
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }

  @Post()
  search(@Body() body: SearchDto) {
    // ruleid: aegiscode.javascript.sql-injection.tainted-query, aegiscode.javascript.sql-injection.string-built-query
    return this.db.query("SELECT * FROM users WHERE name = '" + body.name + "'");
  }

  @Get()
  list(@Query("limit") limit: string) {
    // ok: aegiscode.javascript.sql-injection.tainted-query
    return this.db.query("SELECT * FROM users LIMIT ?", [limit]);
  }
}

router.get("/koa", async (ctx) => {
  // ruleid: aegiscode.javascript.sql-injection.tainted-query, aegiscode.javascript.sql-injection.string-built-query
  ctx.body = await pool.query(`SELECT * FROM users WHERE id = ${ctx.query.id}`);
});
