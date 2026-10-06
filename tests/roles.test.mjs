import assert from "node:assert/strict";
import { parseUserRole, roleHome } from "../lib/roles.ts";

assert.equal(parseUserRole("candidate"), "CANDIDATE");
assert.equal(parseUserRole(" COMPANY "), "COMPANY");
assert.equal(parseUserRole("ADMIN"), "ADMIN");
assert.equal(parseUserRole("owner"), null);
assert.equal(parseUserRole(null), null);

assert.equal(roleHome("ADMIN"), "/admin");
assert.equal(roleHome("CANDIDATE"), "/dashboard");
assert.equal(roleHome("COMPANY"), "/admin");

console.log("roles: ok");
