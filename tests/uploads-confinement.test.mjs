// Guard for lib/uploads.ts, the confinement check in front of every read of a
// candidate-uploaded file.
//
// A stored cvPath comes from the database, and each caller used to write its own
// startsWith comparison. One of them forgot the trailing separator, so a sibling
// directory sharing the root's name passed the test. The cases below pin what
// must be refused, because a regression here is an arbitrary file read.
//
// Run:
//   node --experimental-strip-types --no-warnings tests/uploads-confinement.test.mjs

import assert from "node:assert/strict";
import path from "node:path";

process.env.UPLOADS_DIR = "/srv/uploads";

const { resolveInsideUploads, isInsideUploads } = await import("../lib/uploads.ts");

const ROOT = path.resolve("/srv/uploads");

assert.equal(
  resolveInsideUploads("c1/cv_1.pdf"),
  path.join(ROOT, "c1", "cv_1.pdf")
);
console.log("ok  a well-formed stored path resolves inside the root");

assert.equal(resolveInsideUploads("../../etc/passwd"), null);
assert.equal(resolveInsideUploads("c1/../../../etc/passwd"), null);
console.log("ok  traversal out of the root is refused");

assert.equal(resolveInsideUploads("/etc/passwd"), null);
assert.equal(resolveInsideUploads("C:/Windows/System32/config/SAM"), null);
console.log("ok  an absolute path cannot override the root");

assert.equal(resolveInsideUploads("."), null);
assert.equal(resolveInsideUploads(""), null);
assert.equal(resolveInsideUploads("c1/.."), null);
console.log("ok  the root itself is refused");

assert.equal(resolveInsideUploads("../uploads-backup/secret.pdf"), null);
assert.equal(resolveInsideUploads("../uploadsX/secret.pdf"), null);
console.log("ok  a sibling directory sharing the root prefix is outside");

assert.equal(isInsideUploads(path.join(ROOT, "c1", "cv_1.pdf")), true);
assert.equal(isInsideUploads("/etc/passwd"), false);
assert.equal(isInsideUploads(ROOT), false);
console.log("ok  isInsideUploads applies the same rule to an absolute path");

console.log("uploads-confinement: all checks passed");