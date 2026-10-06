"""
YFS Recruit - End-to-end test of the candidate self-erasure.

Drives a real browser to the erase button on a mid-application stage, accepts the
confirmation dialog, then checks through Prisma and Supabase Storage that the CV
object, the invite, the candidate and its submission are gone, and that the audit
row records the erasure without keeping the name or the email address.

The previous version of this flow reactivated the invite instead of deleting it,
so the token stayed live and the personal data stayed in the database. Asserting
the invite is really gone is the point of this test.

Run with:
    set -a && source .env.test && set +a
    cd /path/to/recruit && npm run dev:safe &
    python tests/e2e/test_candidate_erase.py

Writes to the database and deletes CVs, so it must never point at a real one.
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
ROOT = Path(__file__).resolve().parents[2]
ERASE_LABEL = "Effacer mes données"

# lib/supabase/storage.ts is TypeScript, so the helpers below need a file URL
# rather than a bare specifier.
IMPORT_STORAGE = (
    "const { pathToFileURL } = await import('node:url');"
    "const { %s } = await import("
    "  pathToFileURL(process.env.ROOT + '/lib/supabase/storage.ts').href);"
)

# Seeds a candidate sitting on stage 2 with a CV already stored, so the test can
# go straight to the erase button instead of walking the six stages. The erase
# path never parses the CV, so the file content is irrelevant here.
SEED = (
    "import { randomUUID } from 'node:crypto';"
    + IMPORT_STORAGE % "uploadCv"
    + r"""
const { PrismaClient } = await import("@prisma/client");
const { PrismaPg } = await import("@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const token = process.env.FIXTURE_TOKEN;
const invite = await prisma.invite.findUniqueOrThrow({ where: { token } });
const job = await prisma.job.findUniqueOrThrow({ where: { id: invite.jobId } });
const candidate = await prisma.candidate.create({
  data: {
    jobId: job.id, inviteId: invite.id, name: invite.candidateName,
    email: invite.candidateEmail, stage: "IN_PROGRESS", currentStage: 2, completionPercent: 20,
  },
});
const cvKey = `${candidate.id}/cv_${randomUUID()}.pdf`;
await uploadCv(cvKey, Buffer.from("%PDF-1.4\n% erase-test fixture, never parsed\n%%EOF\n"), "application/pdf");
const submission = await prisma.submission.create({
  data: { candidateId: candidate.id, consentGiven: true, consentAt: new Date(), cvPath: cvKey, cvText: "Fixture CV text." },
});
console.log(JSON.stringify({ candidateId: candidate.id, inviteId: invite.id, submissionId: submission.id, cvKey, name: invite.candidateName, email: invite.candidateEmail }));
await prisma.$disconnect();
"""
)

# Reads back everything that must have disappeared.
INSPECT = (
    IMPORT_STORAGE % "downloadCv"
    + r"""
const { PrismaClient } = await import("@prisma/client");
const { PrismaPg } = await import("@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const { candidateId, inviteId, cvKey } = JSON.parse(process.env.PROBE);
const [candidate, invite, submission, audits] = await Promise.all([
  prisma.candidate.findUnique({ where: { id: candidateId } }),
  prisma.invite.findUnique({ where: { id: inviteId } }),
  prisma.submission.findUnique({ where: { candidateId } }),
  prisma.auditLog.findMany({ where: { entityId: candidateId } }),
]);
console.log(JSON.stringify({
  candidate: !!candidate, invite: !!invite, submission: !!submission,
  cvInBucket: (await downloadCv(cvKey)) !== null,
  audits: audits.map((a) => ({ actor: a.actorEmail, action: a.action, entityId: a.entityId })),
}));
await prisma.$disconnect();
"""
)


def run_node(script: str, extra_env: dict) -> dict:
    env = {**os.environ, **extra_env, "ROOT": str(ROOT)}
    result = subprocess.run(
        ["node", "-e", script],
        capture_output=True,
        text=True,
        env=env,
        cwd=ROOT,
    )
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr, file=sys.stderr)
        sys.exit(f"node helper failed: {result.returncode}")
    return json.loads(result.stdout.strip().splitlines()[-1])


def check(label: str, actual, expected) -> None:
    ok = actual == expected
    print(f"   {'PASS' if ok else 'FAIL'}  {label}" + ("" if ok else f" (attendu {expected!r}, obtenu {actual!r})"))
    if not ok:
        FAILURES.append(label)


FAILURES: list[str] = []


def main() -> None:
    fixture = run_node(
        "import { execFileSync } from 'node:child_process';"
        "const out = execFileSync(process.execPath, ['tests/e2e/setup_fixture.mjs'], { encoding: 'utf8' });"
        "console.log(out);",
        {},
    )
    print(f"Fixture: {fixture['jobId']} / candidat {fixture['candidateEmail']}")
    seed = run_node(SEED, {"FIXTURE_TOKEN": fixture["token"]})
    print(f"  candidat {seed['candidateId']} avec CV {seed['cvKey']}")

    probe = json.dumps(
        {
            "candidateId": seed["candidateId"],
            "inviteId": seed["inviteId"],
            "cvKey": seed["cvKey"],
        }
    )
    before = run_node(INSPECT, {"PROBE": probe})
    print(f"  avant : {before}")
    check("AVANT: le candidat existe", before["candidate"], True)
    check("AVANT: son CV est dans le bucket", before["cvInBucket"], True)
    check("AVANT: aucun audit d'effacement", len(before["audits"]), 0)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"{BASE_URL}/apply/{fixture['token']}", wait_until="networkidle")
        print(f"  page : {page.url}")

        trigger = page.get_by_role("button", name=ERASE_LABEL).first
        trigger.wait_for(state="visible", timeout=15_000)
        trigger.click()

        dialog = page.get_by_role("alertdialog")
        dialog.wait_for(state="visible", timeout=10_000)
        print(f"  dialogue : {dialog.inner_text().splitlines()[0]}")
        dialog.get_by_role("button", name=ERASE_LABEL).click()

        page.wait_for_url(re.compile(r"/expired\?reason=deleted"), timeout=20_000)
        print(f"  apres : {page.url}")
        body = page.inner_text("body")
        check("la page confirme l'effacement", "Données effacées" in body, True)
        check("la page annonce les 28 jours de sauvegardes", "28 jours" in body, True)
        browser.close()

    after = run_node(INSPECT, {"PROBE": probe})
    print(f"  apres (base) : {after}")
    check("APRES: le CV a disparu du bucket", after["cvInBucket"], False)
    check("APRES: l'invitation a disparu", after["invite"], False)
    check("APRES: le candidat a disparu", after["candidate"], False)
    check("APRES: la soumission a disparu", after["submission"], False)

    erasure = [a for a in after["audits"] if a["action"] == "CANDIDATE_DATA_ERASED"]
    check("APRES: un audit CANDIDATE_DATA_ERASED existe", len(erasure), 1)
    check("APRES: l'acteur est candidat:auto-service", erasure[0]["actor"] if erasure else None, "candidat:auto-service")

    leak = re.search(re.escape(seed["name"]) + "|" + re.escape(seed["email"]), json.dumps(after["audits"]))
    check("APRES: l'audit ne contient ni nom ni email", bool(leak), False)

    print("")
    if FAILURES:
        print(f"ECHEC: {len(FAILURES)} verification(s) : {', '.join(FAILURES)}")
        sys.exit(1)
    print("OK: l'effacement par le candidat detruit les donnees et ne garde ni nom ni email dans l'audit.")


if __name__ == "__main__":
    main()