// Retention: erases applications older than the advertised 24 months. The
// privacy page and the stage 1 consent both promise automatic deletion at that
// point, so this is what makes the promise true.
//
// Each run deletes the CV from the private Storage bucket, the candidate row
// (Submission, ItemScore and events cascade), and the invite, after detaching the
// audit rows that point at the invite: AuditLog.inviteId cascades, and the
// recruiter's own trail must outlive the candidate's data.
//
// Usage:
//   set -a && source .env && set +a
//   node --experimental-strip-types --no-warnings scripts/purge-expired-candidates.mjs
//   node --experimental-strip-types --no-warnings scripts/purge-expired-candidates.mjs --apply

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { listCvKeys, removeCv } from "../lib/supabase/storage.ts";

const APPLY = process.argv.includes("--apply");
const RETENTION_MONTHS = Number(process.env.RETENTION_MONTHS ?? 24);
const ACTOR = "systeme:purge-retention";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Never erase the rows while the bucket is unreachable: the CV objects would
  // survive with nothing left pointing at them, and the reaper would collect them
  // as orphans while the retention copy still promised they were gone.
  let inBucket;
  try {
    inBucket = await listCvKeys();
  } catch (err) {
    console.error(`Refusing to run: CV bucket unreachable: ${err.message}`);
    process.exit(1);
  }

  // An empty bucket means the credentials or the bucket name are wrong, not that
  // every CV was deleted. Refuse, same as the reaper.
  if (inBucket.length === 0) {
    console.error(
      "Refusing to run: the CV bucket is empty, so it is most likely not this app's bucket."
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
      if (!APPLY) {
        console.log(`      would delete ${storedPath}`);
      } else {
        try {
          await removeCv(storedPath);
          console.log(`      deleted ${storedPath}`);
          filesRemoved++;
        } catch (err) {
          console.log(`      CV kept, deletion failed: ${err.message}`);
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