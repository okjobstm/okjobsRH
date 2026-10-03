// One-off: record the current body of every prompt template as a PromptRevision.
// Templates edited before prompt versioning existed carry a version number but no
// history, so this captures the body in force right now as version N.
//
// Usage:
//   set -a && source .env && set +a
//   node scripts/backfill-prompt-revisions.mjs            # dry run by default
//   node scripts/backfill-prompt-revisions.mjs --apply    # actually insert

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const templates = await prisma.promptTemplate.findMany({
    select: { id: true, key: true, version: true, updatedBy: true, body: true },
    orderBy: { key: "asc" },
  });

  const existing = await prisma.promptRevision.count();
  const rows = templates.map((template) => ({
    templateId: template.id,
    version: template.version,
    body: template.body,
    createdBy: template.updatedBy,
  }));

  console.log(`Templates: ${templates.length}, revisions already recorded: ${existing}`);
  console.log(`Mode: ${APPLY ? "APPLY (will insert)" : "DRY RUN (no DB writes)"}`);
  console.log();

  for (const template of templates) {
    console.log(
      `  ${template.key}  version ${template.version}  ${template.body.length} chars  by ${template.updatedBy ?? "(unknown)"}`
    );
  }

  if (APPLY && rows.length > 0) {
    // skipDuplicates makes a re-run harmless: (templateId, version) is unique.
    const result = await prisma.promptRevision.createMany({ data: rows, skipDuplicates: true });
    console.log();
    console.log(`Inserted ${result.count} revision(s) of ${rows.length} attempted.`);
  } else if (!APPLY && rows.length > 0) {
    console.log();
    console.log("Re-run with --apply to insert.");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});