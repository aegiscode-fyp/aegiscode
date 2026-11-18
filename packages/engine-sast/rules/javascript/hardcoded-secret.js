// Test cases for hardcoded-secret.yaml.
// "ruleid:" = the next line MUST be flagged. "ok:" = the next line must NOT be flagged.
// Every token below is FAKE (made up for these tests); none is a real credential.
// Each token-format value has a "%%" break so GitHub push protection does not block the
// push. scripts/test-rules.mjs removes every "%%" in a temporary copy before running Semgrep.
// This file is never shipped in the npm package.
const jwt = require("jsonwebtoken");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const { expressjwt } = require("express-jwt");

// ruleid: aegiscode.javascript.hardcoded-secret.credential-assignment
const dbPassword = "Sup3rS3cretP4ss";
// ruleid: aegiscode.javascript.hardcoded-secret.credential-assignment
const STRIPE_API_KEY = process.env.STRIPE_API_KEY || "a7Jk29xQm4Lp0sZ8";
const config = {
  // ruleid: aegiscode.javascript.hardcoded-secret.credential-assignment
  clientSecret: "9f8e7d6c5b4a3210fedcba",
  // ok: aegiscode.javascript.hardcoded-secret.credential-assignment
  passwordField: "password",
  // ok: aegiscode.javascript.hardcoded-secret.credential-assignment
  apiKeyHeader: "x-api-key",
};
// ruleid: aegiscode.javascript.hardcoded-secret.credential-assignment
config.authToken = "Zx81Pq0wLm2Nb7Vc";
// ok: aegiscode.javascript.hardcoded-secret.credential-assignment
const adminPassword = process.env.ADMIN_PASSWORD;
// ok: aegiscode.javascript.hardcoded-secret.credential-assignment
const secretKey = "changeme-in-production";
// ok: aegiscode.javascript.hardcoded-secret.credential-assignment
const passwordEnvVar = "DB_PASSWORD";
// ok: aegiscode.javascript.hardcoded-secret.credential-assignment
const apiKey = "";
// ok: aegiscode.javascript.hardcoded-secret.credential-assignment
const passwordPrompt = "Enter your password";

const JWT_KEY = "my-jwt-signing-key";
function login(user) {
  // ruleid: aegiscode.javascript.hardcoded-secret.jwt-literal-key
  return jwt.sign({ sub: user.id }, "s3cr3t-signing-key", { expiresIn: "1h" });
}
function check(token) {
  // ruleid: aegiscode.javascript.hardcoded-secret.jwt-literal-key
  return jwt.verify(token, JWT_KEY);
}
function checkEnv(token) {
  // ok: aegiscode.javascript.hardcoded-secret.jwt-literal-key
  return jwt.verify(token, process.env.JWT_SECRET);
}
// ruleid: aegiscode.javascript.hardcoded-secret.jwt-literal-key, aegiscode.javascript.hardcoded-secret.credential-assignment
app.use(expressjwt({ secret: "shhhhhhared-secret", algorithms: ["HS256"] }));
// ok: aegiscode.javascript.hardcoded-secret.jwt-literal-key
app.use(expressjwt({ secret: process.env.JWT_SECRET, algorithms: ["HS256"] }));

// ruleid: aegiscode.javascript.hardcoded-secret.session-literal-secret
app.use(session({ secret: "keyboard cat", resave: false }));
// ruleid: aegiscode.javascript.hardcoded-secret.session-literal-secret
app.use(cookieParser("cookie-signing-secret"));
// ok: aegiscode.javascript.hardcoded-secret.session-literal-secret
app.use(session({ secret: process.env.SESSION_SECRET, resave: false }));
// ok: aegiscode.javascript.hardcoded-secret.session-literal-secret
app.use(cookieParser());

// ruleid: aegiscode.javascript.hardcoded-secret.connection-string-password
const mongoUrl = "mongodb://admin:Pr0dDbPa55@db.internal:27017/shop";
// ok: aegiscode.javascript.hardcoded-secret.connection-string-password
const localMongo = "mongodb://localhost:27017/shop";
// ok: aegiscode.javascript.hardcoded-secret.connection-string-password
const pgUrl = `postgres://app:${process.env.PG_PASSWORD}@db:5432/app`;

// ruleid: aegiscode.javascript.hardcoded-secret.aws-access-key
const awsKeyId = "AKIA%%AEGISCODEFAKE001";
// ok: aegiscode.javascript.hardcoded-secret.aws-access-key
const docsKeyId = "AKIA%%IOSFODNN7EXAMPLE";

// ruleid: aegiscode.javascript.hardcoded-secret.github-token
const ghToken = "ghp_%%AegisCodeFakeTokenForRuleTests000000";
// ruleid: aegiscode.javascript.hardcoded-secret.github-token
const ghPat = "github_pat_%%AegisCodeFakeToken0000_AegisCodeFakeTokenForRuleTestsOnlyNotARealCredential0000000";
// ok: aegiscode.javascript.hardcoded-secret.github-token
const ghPrefix = "ghp_";

const pem = `
// ruleid: aegiscode.javascript.hardcoded-secret.private-key-block
-----BEGIN RSA PRIVATE%% KEY-----
AegisCodeFakeKeyMaterialForRuleTestsOnly
-----END RSA PRIVATE%% KEY-----`;
// ok: aegiscode.javascript.hardcoded-secret.private-key-block
const publicPem = "-----BEGIN PUBLIC KEY-----";

// ruleid: aegiscode.javascript.hardcoded-secret.provider-token
const stripeKey = "sk_live_%%AegisCodeFakeKey00000000";
// ruleid: aegiscode.javascript.hardcoded-secret.provider-token
const slackToken = "xoxb-%%aegiscode-fake-token";
// ruleid: aegiscode.javascript.hardcoded-secret.provider-token
const googleKey = "AIza%%AegisCodeFakeGoogleKeyForTests00000";
// ok: aegiscode.javascript.hardcoded-secret.provider-token
const stripeTestKey = "sk_test_%%AegisCodeFakeKey00000000";
