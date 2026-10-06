import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import path from "path";
import { downloadCv, isValidCvKey } from "@/lib/supabase/storage";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { candidateId } = await params;

  const submission = await prisma.submission.findUnique({
    where: { candidateId },
    select: { cvPath: true },
  });

  if (!submission?.cvPath) {
    return NextResponse.json({ error: "Aucun CV trouvé" }, { status: 404 });
  }

  if (!isValidCvKey(submission.cvPath)) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }

  let fileBuffer: Buffer | null;
  try {
    fileBuffer = await downloadCv(submission.cvPath);
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  if (!fileBuffer) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const basename = path.posix.basename(submission.cvPath);
  const ext = path.posix.extname(basename).toLowerCase();

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${basename}"`,
      "Cache-Control": "no-store",
    },
  });
}