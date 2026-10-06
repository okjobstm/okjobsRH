// End-to-end test of the retention purge: it actually erases.
//
// The dry run only proves the SELECT works. This drives the destructive path:
// a candidate created 25 months ago with a real CV in Storage, two ItemScores,
// and an invite, then `node scripts/purge-expired-candidates.mjs --apply`.
//
// Asserts the CV object, the invite, the candidate, its submission and its
// scores are gone, that a `systeme:purge-retention` audit row exists and carries
// no name or email, and that a candidate inside the retention window is left
// untouched.
//
// Usage:
//   set -a && source .env.test && set +a
//   node tests/e2e/test_retention_purge.mjs
//
// Writes to the database and deletes CVs, so it must never point at a real one.

import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { uploadCv, downloadCv, removeCv } from "../../lib/supabase/storage.ts";

const TS_FLAG = ["--experimental-strip-types", "--no-warnings"];

// Real single-page PDF, the same bytes the Python E2E suite uploads.
const PDF_BYTES = Buffer.from(
  "255044462d312e340a25c4e5f2e5eba7f3a04d0a342030206f626a0a3c3c2f4c656e677468" +
    "203520302052202f46696c746572202f466c6174654465636f64653e3e0a73747265616d0a" +
    "789c2b2934537038339d8b8b50522d562a2dd28b50922e29cf4d2c2949ce4f2dac4f4d49c9" +
    "cc4b07000a47083f0a656e6473747265616d0a656e646f626a0a3520302072082020202020" +
    "202020202020202020202020202020202020202020202020200a322030206f626a0a3c3c2f" +
    "54797065202f50616765202f506172656e74203120302052202f5265736f75726365732033" +
    "2030205220202f436f6e74656e747320342030205220203e3e0a656e646f626a0a33203020" +
    "6f626a0a3c3c2f50726f635365745b2f504446202f546578745d3e3e0a656e646f626a0a31" +
    "2030206f626a0a3c3c2f54797065202f50616765732f4b6964735b32203020525d2f436f75" +
    "6e7420313e3e0a656e646f626a0a362030206f626a0a3c3c2f54797065202f436174616c6f" +
    "67202f50616765732031203020523e3e0a656e646f626a0a78726566203020370a30303030" +
    "303030303030203635353335206620200a30303030303030323733203030303030206e2020" +
    "0a30303030303030313737203030303030206e20200a3030303030303032343220303030" +
    "3030206e20200a30303030303030303135203030303030206e20200a3030303030303031" +
    "3539203030303030206e20200a30303030303030333231203030303030206e20200a7472" +
    "61696c65720a3c3c2f53697a6520370a2f526f6f742036203020520a3e3e0a737461727478" +
    "7265660a3336380a2525454f460a",
  "hex"
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const failures = [];
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`   ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : ` (attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)})`}`);
  if (!ok) failures.push(label);
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

async function seedCandidate({ label, createdAt, withScores }) {
  const ts = Date.now();
  const slug = `e2e-retention-${label}-${ts}`;
  const name = `Retention ${label} ${ts}`;
  const email = `retention.${label}.${ts}@example.com`;

  const job = await prisma.job.create({
    data: {
      title: `E2E Retention ${label} ${ts}`,
      slug,
      department: "Engineering",
      location: "Remote",
      status: "OPEN",
      descriptionText: "Fixture job for the retention purge test.",
      descriptionSource: "PASTED_TEXT",
      createdByEmail: "e2e@example.com",
    },
  });

  const invite = await prisma.invite.create({
    data: {
      jobId: job.id,
      candidateName: name,
      candidateEmail: email,
      token: `retention-${label}-${randomUUID()}`,
      expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      createdByEmail: "e2e@example.com",
    },
  });

  const candidate = await prisma.candidate.create({
    data: {
      jobId: job.id,
      inviteId: invite.id,
      name,
      email,
      createdAt,
      stage: "IN_PROGRESS",
      currentStage: 2,
      completionPercent: 20,
    },
  });

  const cvKey = `${candidate.id}/cv_${randomUUID()}.pdf`;
  await uploadCv(cvKey, PDF_BYTES, "application/pdf");

  const submission = await prisma.submission.create({
    data: {
      candidateId: candidate.id,
      consentGiven: true,
      consentAt: createdAt,
      cvPath: cvKey,
      cvText: "Fixture CV text.",
      cvExtractedAt: createdAt,
    },
  });

  const itemIds = [];
  if (withScores) {
    for (const itemId of ["C-S1", "M-R1"]) {
      const score = await prisma.itemScore.create({
        data: {
          submissionId: submission.id,
          itemId,
          rubricVersion: "v1",
          modelUsed: "claude-sonnet-4-6",
          responseHash: randomUUID().replaceAll("-", ""),
          features: { len: 120, structure: 3 },
          bandEstimate: "B",
          rulesFired: [],
          rawLlmResponse: "{}",
        },
      });
      itemIds.push(score.id);
    }
  }

  return { label, jobId: job.id, inviteId: invite.id, candidateId: candidate.id, submissionId: submission.id, itemIds, name, email, cvKey, createdAt };
}

async function snapshot(f) {
  const [candidate, invite, submission, scores, audits] = await Promise.all([
    prisma.candidate.findUnique({ where: { id: f.candidateId } }),
    prisma.invite.findUnique({ where: { id: f.inviteId } }),
    prisma.submission.findUnique({ where: { candidateId: f.candidateId } }),
    prisma.itemScore.findMany({ where: { submissionId: f.submissionId } }),
    prisma.auditLog.findMany({ where: { entityId: f.candidateId } }),
  ]);
  const cvExists = async (key) => (await downloadCv(key)) !== null;
  return {
    candidate: !!candidate,
    invite: !!invite,
    submission: !!submission,
    scores: scores.length,
    cvExists: await cvExists(f.cvKey),
    audits,
  };
}

async function main() {
  const expired = await seedCandidate({ label: "expired", createdAt: monthsAgo(25), withScores: true });
  const fresh = await seedCandidate({ label: "fresh", createdAt: monthsAgo(2), withScores: true });
  console.log(`Fixture: ${expired.label} created ${expired.createdAt.toISOString().slice(0, 10)}, ${fresh.label} created ${fresh.createdAt.toISOString().slice(0, 10)}`);

  console.log("\n--- AVANT ---");
  const beforeExpired = await snapshot(expired);
  console.log(`  expire : ${JSON.stringify({ ...beforeExpired, audits: beforeExpired.audits.length })}`);
  const beforeFresh = await snapshot(fresh);
  console.log(`  recent : ${JSON.stringify({ ...beforeFresh, audits: beforeFresh.audits.length })}`);

  check("AVANT: le candidat expire existe", beforeExpired.candidate, true);
  check("AVANT: son CV est dans le bucket", beforeExpired.cvExists, true);
  check("AVANT: il a 2 scores", beforeExpired.scores, 2);
  check("AVANT: aucun audit de purge", beforeExpired.audits.length, 0);

  console.log("\n--- PURGE --apply ---");
  const run = spawnSync(
    process.execPath,
    [...TS_FLAG, "scripts/purge-expired-candidates.mjs", "--apply"],
    { encoding: "utf8", env: process.env }
  );
  console.log(run.stdout.trim().split("\n").map((l) => `  | ${l}`).join("\n"));
  if (run.stderr.trim()) console.log(run.stderr.trim().split("\n").map((l) => `  ! ${l}`).join("\n"));
  check("PURGE: code de sortie 0", run.status, 0);

  console.log("\n--- APRES ---");
  const afterExpired = await snapshot(expired);
  console.log(`  expire : ${JSON.stringify({ ...afterExpired, audits: afterExpired.audits.map((a) => ({ actor: a.actorEmail, action: a.action })) })}`);
  const afterFresh = await snapshot(fresh);
  console.log(`  recent : ${JSON.stringify({ ...afterFresh, audits: afterFresh.audits.length })}`);

  check("APRES: le CV du candidat expire a disparu du bucket", afterExpired.cvExists, false);
  check("APRES: l'invitation a disparu", afterExpired.invite, false);
  check("APRES: le candidat a disparu", afterExpired.candidate, false);
  check("APRES: la soumission a disparu (cascade)", afterExpired.submission, false);
  check("APRES: les 2 scores ont disparu (cascade)", afterExpired.scores, 0);

  const purgeAudit = afterExpired.audits.find((a) => a.action === "CANDIDATE_DATA_PURGED");
  check("APRES: un audit CANDIDATE_DATA_PURGED existe", !!purgeAudit, true);
  check("APRES: l'acteur est systeme:purge-retention", purgeAudit?.actorEmail, "systeme:purge-retention");
  check("APRES: l'audit ne contient ni nom ni email", /Retention|@example\.com/.test(JSON.stringify(purgeAudit)), false);

  check("APRES: le candidat recent est intact", afterFresh.candidate, true);
  check("APRES: l'invitation du recent est intacte", afterFresh.invite, true);
  check("APRES: son CV est toujours dans le bucket", afterFresh.cvExists, true);
  check("APRES: ses 2 scores sont la", afterFresh.scores, 2);
  check("APRES: aucun audit de purge sur le recent", afterFresh.audits.length, 0);

  // Leave no fixture behind: the recent candidate is the only survivor.
  await prisma.job.delete({ where: { id: fresh.jobId } });
  await removeCv(fresh.cvKey);

  console.log("");
  if (failures.length > 0) {
    console.log(`ECHEC: ${failures.length} verification(s) : ${failures.join(", ")}`);
    process.exit(1);
  }
  console.log("OK: la purge efface reellement, et laisse intact ce qui est dans la fenetre.");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});