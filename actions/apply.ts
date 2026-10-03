"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { getApplicationState, computeCompletionPercent, scorePsychometric } from "@/lib/apply";
import { resolveInsideUploads } from "@/lib/uploads";
import { CandidateStage } from "@prisma/client";
import logger from "@/lib/logger";
import { autoAnalyzeCandidate } from "@/lib/scoring/auto-analyze";
import { logCandidateEvent } from "@/lib/events";
import { z } from "zod";

async function resolveCandidate(token: string) {
  const state = await getApplicationState(token);
  if (!state) return null;
  if (state.submission.submittedAt) return null; // already submitted
  return state;
}

// Stage 1: consent
export async function saveStage1Action(formData: FormData) {
  const token = formData.get("token") as string;
  const consentGiven = formData.get("consentGiven") === "true";

  if (!token) return;

  const state = await resolveCandidate(token);
  if (!state) redirect(`/apply/${token}/expired`);

  if (!consentGiven) {
    redirect(`/apply/${token}/stage/1?error=consent_required`);
  }

  await prisma.submission.update({
    where: { candidateId: state.candidate.id },
    data: { consentGiven: true, consentAt: new Date() },
  });

  await advanceStage(state.candidate.id, token, 1, state);
  redirect(`/apply/${token}/stage/2`);
}

// Stage 2: work history (text fields only; file uploads handled via API route)
const stage2Schema = z.object({
  coverLetter: z.string().max(3000).optional(),
});

export async function saveStage2Action(formData: FormData) {
  const token = formData.get("token") as string;
  if (!token) return;

  const state = await resolveCandidate(token);
  if (!state) redirect(`/apply/${token}/expired`);

  const parsed = stage2Schema.safeParse({
    coverLetter: formData.get("coverLetter") || undefined,
  });

  const projectsRaw = formData.get("projectsJson") as string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let projects: any[] = [];
  if (projectsRaw) {
    try { projects = JSON.parse(projectsRaw); } catch { /* ignore */ }
  }

  await prisma.submission.update({
    where: { candidateId: state.candidate.id },
    data: {
      coverLetter: parsed.success ? parsed.data.coverLetter ?? null : null,
      projects: projects,
    },
  });

  if (!state.submission.cvPath) {
    redirect(`/apply/${token}/stage/2?error=cv_required`);
  }

  await advanceStage(state.candidate.id, token, 2, state);
  redirect(`/apply/${token}/stage/3`);
}

// Stage 3: role-specific answers
export async function saveStage3Action(formData: FormData) {
  const token = formData.get("token") as string;
  if (!token) return;

  const state = await resolveCandidate(token);
  if (!state) redirect(`/apply/${token}/expired`);

  const roleAnswers: Record<string, string> = {};
  for (const q of state.job.roleQuestions) {
    const answer = formData.get(`answer_${q.id}`) as string | null;
    if (answer) roleAnswers[q.id] = answer;
  }

  await prisma.submission.update({
    where: { candidateId: state.candidate.id },
    data: { roleAnswers },
  });

  await advanceStage(state.candidate.id, token, 3, state);
  redirect(`/apply/${token}/stage/4`);
}

// Autosave stage 3 (returns nothing, used by client-side interval)
export async function autosaveStage3Action(token: string, roleAnswers: Record<string, string>) {
  const state = await resolveCandidate(token);
  if (!state) return;

  await prisma.submission.update({
    where: { candidateId: state.candidate.id },
    data: { roleAnswers, updatedAt: new Date() },
  });

  await prisma.candidate.update({
    where: { id: state.candidate.id },
    data: { lastActiveAt: new Date() },
  });
}

// Stage 4: standard answers
export async function saveStage4Action(formData: FormData) {
  const token = formData.get("token") as string;
  if (!token) return;

  const state = await resolveCandidate(token);
  if (!state) redirect(`/apply/${token}/expired`);

  const questions = await prisma.standardQuestion.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const standardAnswers: Record<string, string> = {};
  for (const q of questions) {
    const answer = formData.get(`answer_${q.id}`) as string | null;
    if (answer) standardAnswers[q.id] = answer;
  }

  await prisma.submission.update({
    where: { candidateId: state.candidate.id },
    data: { standardAnswers },
  });

  await advanceStage(state.candidate.id, token, 4, state);
  redirect(`/apply/${token}/stage/5`);
}

// Autosave stage 4
export async function autosaveStage4Action(token: string, standardAnswers: Record<string, string>) {
  const state = await resolveCandidate(token);
  if (!state) return;

  await prisma.submission.update({
    where: { candidateId: state.candidate.id },
    data: { standardAnswers, updatedAt: new Date() },
  });

  await prisma.candidate.update({
    where: { id: state.candidate.id },
    data: { lastActiveAt: new Date() },
  });
}

// Stage 5: psychometric
export async function saveStage5Action(formData: FormData) {
  const token = formData.get("token") as string;
  if (!token) return;

  const state = await resolveCandidate(token);
  if (!state) redirect(`/apply/${token}/expired`);

  const items = await prisma.psychometricItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const psychoAnswers: Record<string, string | string[]> = {};
  for (const item of items) {
    if (item.itemType === "tradeoff_rank") {
      const raw = formData.get(`item_${item.id}`) as string | null;
      if (raw) psychoAnswers[item.id] = raw.split(",").filter(Boolean);
    } else {
      const val = formData.get(`item_${item.id}`) as string | null;
      if (val) psychoAnswers[item.id] = val;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const psychoScores = scorePsychometric(items, psychoAnswers) as any;

  await prisma.submission.update({
    where: { candidateId: state.candidate.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { psychoAnswers: psychoAnswers as any, psychoScores },
  });

  await advanceStage(state.candidate.id, token, 5, state);
  redirect(`/apply/${token}/stage/6`);
}

// Stage 6: final reflection + submit
export async function submitApplicationAction(formData: FormData) {
  const token = formData.get("token") as string;
  if (!token) return;

  const state = await resolveCandidate(token);
  if (!state) redirect(`/apply/${token}/expired`);

  const finalReflection = (formData.get("finalReflection") as string | null) ?? null;

  const updatedState = { ...state, submission: { ...state.submission, finalReflection } };
  const completionPercent = computeCompletionPercent(updatedState);

  await prisma.$transaction([
    prisma.submission.update({
      where: { candidateId: state.candidate.id },
      data: { finalReflection, submittedAt: new Date() },
    }),
    prisma.candidate.update({
      where: { id: state.candidate.id },
      data: {
        stage: CandidateStage.COMPLETED,
        currentStage: 7,
        completionPercent,
        lastActiveAt: new Date(),
      },
    }),
  ]);

  logger.info({ candidateId: state.candidate.id, jobId: state.job.id }, "candidate submitted application");

  await logCandidateEvent(state.candidate.id, state.job.id, "application_submitted");

  // Fire scoring + synthesis in the background after the response is sent
  const candidateIdForAnalysis = state.candidate.id;
  after(async () => {
    await autoAnalyzeCandidate(candidateIdForAnalysis).catch((err) => {
      logger.error({ candidateId: candidateIdForAnalysis, err }, "auto-analysis failed");
    });
  });

  revalidatePath(`/admin/jobs/${state.job.id}`);
  redirect(`/apply/${token}/submitted`);
}

// Erase application: the candidate asked for their data to go, so the invite is
// deleted rather than reactivated. Reactivating it kept the name and the email
// address and left the token live, which is the opposite of what was promised.
export async function deleteApplicationAction(formData: FormData) {
  const token = formData.get("token") as string;
  if (!token) return;

  const state = await resolveCandidate(token);
  if (!state) redirect(`/apply/${token}/expired`);

  const { candidate, invite, job, submission } = state;

  if (submission.cvPath) {
    const absolutePath = resolveInsideUploads(submission.cvPath);
    if (absolutePath) {
      await fs.unlink(absolutePath).catch((err) => {
        logger.warn(
          { err, storedPath: submission.cvPath },
          "cv still on disk after erase, the reaper will collect it"
        );
      });
    } else {
      logger.warn({ storedPath: submission.cvPath }, "stored cvPath outside the uploads root, not deleted");
    }
  }

  await prisma.$transaction([
    // AuditLog.inviteId cascades on Invite, so the recruiter's trail is detached
    // first: erasing candidate data must not erase the company's own history.
    prisma.auditLog.updateMany({ where: { inviteId: invite.id }, data: { inviteId: null } }),
    prisma.candidate.delete({ where: { id: candidate.id } }),
    prisma.auditLog.create({
      data: {
        actorEmail: "candidat:auto-service",
        action: "CANDIDATE_DATA_ERASED",
        entityType: "CANDIDATE",
        entityId: candidate.id,
        jobId: job.id,
      },
    }),
    prisma.invite.delete({ where: { id: invite.id } }),
  ]);

  logger.info({ candidateId: candidate.id, jobId: job.id }, "candidate erased their application data");

  revalidatePath(`/admin/jobs/${job.id}`);
  redirect(`/apply/${token}/expired?reason=deleted`);
}

// Save and exit (autosave current state without advancing stage)
export async function saveAndExitAction(formData: FormData) {
  const token = formData.get("token") as string;
  if (!token) return;

  const candidate = await prisma.candidate.findFirst({
    where: { invite: { token } },
    select: { id: true, jobId: true },
  });

  if (candidate) {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { lastActiveAt: new Date() },
    });
    await logCandidateEvent(candidate.id, candidate.jobId, "save_and_exit");
  }

  redirect(`/apply/${token}/saved`);
}

async function advanceStage(
  candidateId: string,
  token: string,
  completedStage: number,
  state: Awaited<ReturnType<typeof resolveCandidate>>
) {
  if (!state) return;
  const nextStage = Math.max(state.candidate.currentStage, completedStage + 1);
  const updatedState = { ...state, candidate: { ...state.candidate, currentStage: nextStage } };
  const completionPercent = computeCompletionPercent(updatedState);

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      currentStage: nextStage,
      completionPercent,
      lastActiveAt: new Date(),
    },
  });

  await logCandidateEvent(candidateId, state.job.id, "stage_completed", {
    stage: completedStage,
  });
}
