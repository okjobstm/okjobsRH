import assert from "node:assert/strict";
import { getSafeAdminReturnTo } from "../lib/auth-redirect.ts";

assert.equal(getSafeAdminReturnTo(null), "/admin");
assert.equal(getSafeAdminReturnTo("/admin"), "/admin");
assert.equal(getSafeAdminReturnTo("/admin/jobs/123?tab=review"), "/admin/jobs/123?tab=review");
assert.equal(getSafeAdminReturnTo("/login"), "/admin");
assert.equal(getSafeAdminReturnTo("//evil.example/admin"), "/admin");
assert.equal(getSafeAdminReturnTo("/admin\\evil"), "/admin");
assert.equal(getSafeAdminReturnTo("https://evil.example/admin"), "/admin");

console.log("auth-redirect: ok");
