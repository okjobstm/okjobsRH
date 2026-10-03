// Collects CV files that no Submission points at any more. Two paths leave a
// file behind: the erase flow, when unlink failed because the disk was busy or
// the file was already gone, and an upload that wrote the file and then failed
// before the database write.
//
// Usage:
//   set -a && source .env && set +a
//   node scripts/reap-orphan-uploads.mjs            # dry run by default
//   node scripts/reap-orphan-uploads.mjs --apply    # actually unlink

import path from "node:path";
import fs from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");
const ROOT = path.resolve(process.env.UPLOADS_DIR ?? "/var/recruit/uploads");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  let entries;
  try {
    entries = await fs.readdir(ROOT, { recursive: true, withFileTypes: true });
  } catch (err) {
    console.error(`Refusing to run: cannot read UPLOADS_DIR (${ROOT}): ${err.message}`);
    process.exit(1);
  }

  const files = entries.filter((entry) => entry.isFile());
  if (files.length === 0) {
    console.error(
      `Refusing to run: ${ROOT} holds no file, so it is most likely not the uploads directory.`
    );
    process.exit(1);
  }

  const stored = await prisma.submission.findMany({
    where: { cvPath: { not: null } },
    select: { cvPath: true },
  });
  const referenced = new Set(stored.map((row) => row.cvPath.split(path.sep).join("/")));

  // Stored paths are relative to the uploads root; key the files the same way.
  const onDisk = files.map((entry) => {
    const parent = entry.parentPath ?? entry.path ?? "";
    return path.relative(ROOT, path.join(parent, entry.name)).split(path.sep).join("/");
  });

  const orphans = onDisk.filter((file) => !referenced.has(file));

  console.log(`Uploads root: ${ROOT}`);
  console.log(`Files on disk: ${files.length}, referenced by a submission: ${referenced.size}`);
  console.log(`Mode: ${APPLY ? "APPLY (will unlink)" : "DRY RUN (nothing deleted)"}`);
  console.log();

  let removed = 0;
  let failed = 0;

  for (const orphan of orphans) {
    const absolutePath = path.join(ROOT, orphan);
    if (APPLY) {
      try {
        await fs.unlink(absolutePath);
        console.log(`  DELETED  ${orphan}`);
        removed++;
      } catch (err) {
        console.log(`  FAILED   ${orphan}  -> ${err.message}`);
        failed++;
      }
    } else {
      console.log(`  ORPHAN   ${orphan}`);
    }
  }

  console.log();
  console.log(
    APPLY
      ? `Summary: ${orphans.length} orphan(s), ${removed} deleted, ${failed} failed`
      : `Summary: ${orphans.length} orphan(s) would be deleted`
  );
  if (!APPLY && orphans.length > 0) {
    console.log("Re-run with --apply to unlink them.");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});