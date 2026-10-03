// Retention: erases applications older than the advertised 24 months. The
// privacy page and the stage 1 consent both promise automatic deletion at that
// point, so this is what makes the promise true.
//
// Each run deletes the CV file, the candidate row (Submission, ItemScore and
// events cascade), and the invite, after detaching the audit rows that point at
// the invite: AuditLog.inviteId cascades, and the recruiter's own trail must
// outlive the candidate's data.
//
// Usage:
//   set -a && source .env && set +a
//   node scripts/purge-expired-candidates.mjs            # dry run by default
//   node scripts/purge-expired-candidates.mjs --apply    # actually delete

import path from "node:path";
import fs from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");
const RETENTION_MONTHS = Number(process.env.RETENTION_MONTHS ?? 24);
const ROOT = path.resolve(process.env.UPLOADS_DIR ?? "/var/recruit/uploads");
const ACTOR = "systeme:purge-retention";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function isInsideRoot(target) {
  return target !== ROOT && target.startsWith(ROOT + path.sep);
}

async function main() {
  let entries;
  try {
    entries = await fs.readdir(ROOT, { recursive: true, withFileTypes: true });
  } catch (err) {
    console.error(`Refusing to run: cannot read UPLOADS_DIR (${ROOT}): ${err.message}`);
    process.exit(1);
  }
  if (entries.filter((entry) => entry.isFile()).length === 0) {
    console.error(
      `Refusing to run: ${ROOT} holds no file, so it is most likely not the uploads directory.`
    );
    process.exit(1);
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);

  const expired = await prisma.candidate.findMany({
    where: { createdAt: { lt: cutoff } },
    select: {
      id: true,
      name: true,
      email: true,
      jobId: true,
      inviteId: true,
      createdAt: true,
      submission: { select: { cvPath: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Uploads root: ${ROOT}`);
  console.log(`Cutoff: candidates created before ${cutoff.toISOString()} (${RETENTION_MONTHS} months)`);
  console.log(`Expired applications: ${expired.length}`);
  console.log(`Mode: ${APPLY ? "APPLY (will delete)" : "DRY RUN (nothing deleted)"}`);
  console.log();

  let erased = 0;
  let filesRemoved = 0;
  let filesKept = 0;

  for (const candidate of expired) {
    const storedPath = candidate.submission?.cvPath ?? null;
    console.log(`  ${candidate.createdAt.toISOString().slice(0, 10)}  ${candidate.name}  ${candidate.email}`);

    if (storedPath) {
      const absolutePath = path.resolve(ROOT, storedPath);
      if (!isInsideRoot(absolutePath)) {
        console.log(`      CV kept, stored path outside the uploads root: ${storedPath}`);
        filesKept++;
      } else if (!APPLY) {
        console.log(`      would delete ${storedPath}`);
      } else {
        try {
          await fs.unlink(absolutePath);
          console.log(`      deleted ${storedPath}`);
          filesRemoved++;
        } catch (err) {
          console.log(`      CV kept, unlink failed (${err.code}): ${storedPath}`);
          filesKept++;
        }
      }
    }

    if (!APPLY) continue;

    await prisma.$transaction([
      prisma.auditLog.updateMany({
        where: { inviteId: candidate.inviteId },
        data: { inviteId: null },
      }),
      prisma.candidate.delete({ where: { id: candidate.id } }),
      prisma.auditLog.create({
        data: {
          actorEmail: ACTOR,
          action: "CANDIDATE_DATA_PURGED",
          entityType: "CANDIDATE",
          entityId: candidate.id,
          jobId: candidate.jobId,
        },
      }),
      prisma.invite.delete({ where: { id: candidate.inviteId } }),
    ]);
    erased++;
  }

  console.log();
  console.log(
    APPLY
      ? `Purge complete: ${erased} application(s) erased, ${filesRemoved} CV file(s) deleted, ${filesKept} kept for manual review.`
      : `Dry run: ${expired.length} application(s) would be erased.`
  );
  if (!APPLY && expired.length > 0) {
    console.log("Re-run with --apply to erase them.");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});