import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import path from "path";
import { randomUUID } from "crypto";
import { extractCvText } from "@/lib/cv-extract";
import { validateToken } from "@/lib/apply";
import { logCandidateEvent } from "@/lib/events";
import { uploadCv } from "@/lib/supabase/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const ALLOWED_FIELDS = new Set(["cv"]);

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const token = form.get("token") as string | null;
    const field = (form.get("field") as string | null) ?? "cv";

    if (!file || !token) {
      return NextResponse.json({ error: "Fichier ou jeton manquant" }, { status: 400 });
    }

    if (!ALLOWED_FIELDS.has(field)) {
      return NextResponse.json({ error: "Type de document non autorisé" }, { status: 400 });
    }

    // L'identité vient du jeton d'invitation, jamais du corps de la requête :
    // un candidateId fourni par le client permettrait d'écrire dans le dossier d'un autre candidat.
    const tokenResult = await validateToken(token);
    if (!tokenResult.valid) {
      return NextResponse.json({ error: "Candidat invalide" }, { status: 403 });
    }
    const candidateId = tokenResult.invite.candidateId;
    if (!candidateId) {
      return NextResponse.json({ error: "Candidat invalide" }, { status: 403 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Le fichier dépasse la limite de 10 Mo" }, { status: 400 });
    }

    // Validate file extension
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "Type de fichier non autorisé. Veuillez téléverser un document PDF ou Word." }, { status: 400 });
    }

    // Validate MIME type
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Type de fichier non autorisé." }, { status: 400 });
    }

    // The key is derived from the invitation's candidateId, never from the body,
    // and safeName comes from a whitelist field plus a random UUID, so it can only
    // ever address this candidate's own folder.
    const safeName = `${field}_${randomUUID()}${ext}`;
    const storedPath = `${candidateId}/${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadCv(storedPath, buffer, file.type || "application/octet-stream");

    const extracted = await extractCvText(buffer, safeName);
    await prisma.submission.update({
      where: { candidateId },
      data: {
        cvPath: storedPath,
        cvText: extracted.text,
        cvExtractedAt: extracted.text ? new Date() : null,
        cvExtractError: extracted.error,
      },
    });
    logger.info(
      {
        candidateId,
        field,
        storedPath,
        extractedChars: extracted.text?.length ?? 0,
        extractError: extracted.error,
      },
      "cv uploaded and extracted"
    );

    await logCandidateEvent(candidateId, tokenResult.invite.jobId, "cv_uploaded");

    return NextResponse.json({ path: storedPath });
  } catch (err) {
    logger.error({ err }, "file upload error");
    return NextResponse.json({ error: "Échec du téléversement" }, { status: 500 });
  }
}
