"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import logger from "@/lib/logger";

/**
 * Update a prompt template body. The body is appended to PromptRevision before
 * the template row is overwritten, because the template keeps only the current
 * text: bumping `version` alone leaves no trace of the prompt it replaced.
 */
export async function updatePromptTemplateAction(formData: FormData): Promise<void> {
  const session = await requireAuth();

  const key = formData.get("key");
  const body = formData.get("body");
  if (typeof key !== "string" || typeof body !== "string" || !key || !body) {
    return;
  }

  const version = await prisma.$transaction(async (tx) => {
    const existing = await tx.promptTemplate.findUnique({ where: { key }, select: { version: true } });
    const nextVersion = (existing?.version ?? 0) + 1;

    const template = await tx.promptTemplate.upsert({
      where: { key },
      create: { key, body, version: nextVersion, updatedBy: session.email },
      update: { body, version: nextVersion, updatedBy: session.email },
    });

    await tx.promptRevision.create({
      data: { templateId: template.id, version: nextVersion, body, createdBy: session.email },
    });

    return nextVersion;
  });

  logger.info({ key, version, updatedBy: session.email }, "Prompt template updated");
  revalidatePath("/admin/settings");
}
