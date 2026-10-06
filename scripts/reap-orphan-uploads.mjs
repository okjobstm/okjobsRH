// Collects CVs that no Submission points at any more. Two paths leave one behind:
// the erase flow, when the Storage delete failed, and an upload that stored the
// file and then failed before the database write.
//
// Usage:
//   set -a && source .env && set +a
//   node --experimental-strip-types --no-warnings scripts/reap-orphan-uploads.mjs
//   node --experimental-strip-types --no-warnings scripts/reap-orphan-uploads.mjs --apply

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { isValidCvKey, listCvKeys, removeCv } from "../lib/supabase/storage.ts";

const APPLY = process.argv.includes("--apply");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  let inBucket;
  try {
    inBucket = await listCvKeys();
  } catch (err) {
    console.error(`Refusing to run: CV bucket unreachable: ${err.message}`);
    process.exit(1);
  }

  // An empty bucket means the credentials or the bucket name are wrong, not that
  // every CV was deleted. Refuse, so an --apply run cannot report success having
  // verified nothing.
  if (inBucket.length === 0) {
    console.error(
      "Refusing to run: the CV bucket is empty, so it is most likely not this app's bucket."
    );
    process.exit(1);
  }

  // Everything we ever write is <candidateId>/<field>_<uuid>.<ext>. A key that
  // breaks that shape means the credentials point at some other bucket, and a
  // --apply run would delete files this app never owned.
  const foreign = inBucket.filter((key) => !isValidCvKey(key));
  if (foreign.length > 0) {
    console.error(
      `Refusing to run: ${foreign.length} key(s) in the bucket do not match the CV layout, so it is not this app's bucket. First offender: ${foreign[0]}`
    );
    process.exit(1);
  }

  const stored = await prisma.submission.findMany({
    where: { cvPath: { not: null } },
    select: { cvPath: true },
  });
  const referenced = new Set(stored.map((row) => row.cvPath.replaceAll("\\", "/")));

  const orphans = inBucket.filter((key) => !referenced.has(key));

  console.log(`Files in bucket: ${inBucket.length}, referenced by a submission: ${referenced.size}`);
  console.log(`Mode: ${APPLY ? "APPLY (will delete)" : "DRY RUN (nothing deleted)"}`);
  console.log();

  let removed = 0;
  let failed = 0;

  for (const orphan of orphans) {
    if (APPLY) {
      try {
        await removeCv(orphan);
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
    console.log("Re-run with --apply to delete them.");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});