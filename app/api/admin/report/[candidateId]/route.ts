import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import PDFDocument from "pdfkit";
import type { SynthesisResult, DimensionBand, RoleFitBand, PatternFlag } from "@/lib/scoring/synthesis";
import { MOTIVATOR_LABELS } from "@/lib/scoring/synthesis";
import { APP_NAME, ORG_NAME } from "@/lib/site-config";
import { formatDate, ROLE_FIT_LABEL } from "@/lib/format";
import { formatStage } from "@/lib/candidates";

// ─── Display constants ────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<string, string> = {
  conscientiousness: "Rigueur professionnelle",
  honesty_humility: "Honnêteté et humilité",
  composure: "Sang-froid",
  learning: "Orientation apprentissage",
  interpersonal: "Style relationnel",
};

const BAND_LABELS: Record<DimensionBand, string> = {
  unusually_strong: "Signal exceptionnel",
  strong_positive: "Signal fort",
  moderate_positive: "Signal modéré",
  mixed: "Signal contrasté",
  limited_signal: "Signal limité",
  insufficient_signal: "Signal insuffisant",
  concern: "Point de vigilance",
};

const SEVERITY_LABELS: Record<PatternFlag["severity"], string> = {
  high: "Élevé",
  medium: "Moyen",
  operational: "Opérationnel",
};

const ROLE_FIT_COLOR: Record<RoleFitBand, [number, number, number]> = {
  "Strong fit":      [5, 150, 105],
  "Likely fit":      [14, 165, 233],
  "Mixed fit":       [217, 119, 6],
  "Weak fit":        [234, 88, 12],
  "Likely mis-fit":  [225, 29, 72],
};

type PsychoScores = {
  fcTallies?: Record<string, number>;
  t2Scores?: Record<string, number>;
  t1Ranking?: string[];
  ccValues?: Record<string, number>;
} | null;

// ─── PDF helpers ──────────────────────────────────────────────────────────────

// Standard PDFKit fonts (Helvetica) are WinAnsi/CP1252: anything outside it
// renders blank or as mojibake, and our copy carries U+2019 and U+00A0.
const CP1252_FOLD: Record<string, string> = {
  "‘": "'",
  "’": "'",
  " ": " ",
  "…": "...",
  "‑": "-",
};

function pdfSafe(text: string): string {
  return text.replace(/[‘’ …‑]/g, (c) => CP1252_FOLD[c]);
}

function bufferPdf(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.6);
  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor("#64748b")
    .text(title.toUpperCase(), { characterSpacing: 1.2 })
    .moveDown(0.2)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor("#e2e8f0")
    .lineWidth(0.5)
    .stroke()
    .moveDown(0.4);
}

function proseParagraph(doc: PDFKit.PDFDocument, text: string, indent = 0) {
  doc
    .fontSize(10.5)
    .font("Helvetica")
    .fillColor("#1e293b")
    .text(text, { lineGap: 4, indent });
  doc.moveDown(0.3);
}

function bulletItem(doc: PDFKit.PDFDocument, text: string) {
  const x = doc.page.margins.left + 10;
  const textX = x + 12;
  const y = doc.y;
  doc.circle(x + 3, y + 5, 2).fill("#94a3b8");
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#1e293b")
    .text(text, textX, y, { lineGap: 3, width: doc.page.width - doc.page.margins.right - textX });
  doc.moveDown(0.2);
}

function dimRow(doc: PDFKit.PDFDocument, label: string, band: string, summary?: string) {
  doc
    .fontSize(9.5)
    .font("Helvetica-Bold")
    .fillColor("#0f172a")
    .text(label, { continued: true })
    .font("Helvetica")
    .fillColor("#475569")
    .text(`  ${BAND_LABELS[band as DimensionBand] ?? band}`);
  if (summary) {
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(summary, { lineGap: 2, indent: 10 });
  }
  doc.moveDown(0.25);
}

// ─── Route ────────────────────────────────────────────────────────────────────

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

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      job: { include: { roleQuestions: { orderBy: { sortOrder: "asc" } } } },
      submission: {
        include: { itemScores: { orderBy: { itemId: "asc" } } },
      },
    },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidat introuvable" }, { status: 404 });
  }

  const [standardQuestions, psychoItems] = await Promise.all([
    prisma.standardQuestion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.psychometricItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const sub = candidate.submission;
  const scores = sub?.psychoScores as PsychoScores;
  const psychoAnswers = (sub?.psychoAnswers as Record<string, unknown>) ?? {};
  const roleAnswers = (sub?.roleAnswers as Record<string, string>) ?? {};
  const standardAnswers = (sub?.standardAnswers as Record<string, string>) ?? {};
  const synthesis = sub?.synthesisJson as SynthesisResult | null;

  const doc = new PDFDocument({
    margin: 52,
    size: "A4",
    bufferPages: true,
    info: {
      Title: `Rapport candidat - ${candidate.name}`,
      Author: APP_NAME,
    },
  });

  // Single funnel: every doc.text() call, present and future, gets folded.
  const rawText = doc.text.bind(doc) as (
    text: string,
    x?: number,
    y?: number,
    options?: PDFKit.Mixins.TextOptions
  ) => typeof doc;
  doc.text = ((text: string, x?: number, y?: number, options?: PDFKit.Mixins.TextOptions) =>
    rawText(pdfSafe(text), x, y, options)) as typeof doc.text;

  const pdfDone = bufferPdf(doc);

  // ══════════════════════════════════════════════════════════════════════
  // COVER BAND
  // ══════════════════════════════════════════════════════════════════════
  doc.rect(0, 0, doc.page.width, 90).fill("#0f172a");

  doc
    .fontSize(19)
    .font("Helvetica-Bold")
    .fillColor("#ffffff")
    .text("Rapport candidat", 52, 22)
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#94a3b8")
    .text(`${ORG_NAME} - Interne et confidentiel`, 52, 47);

  // Role-fit band badge (top-right if synthesis exists)
  if (synthesis?.roleFitRead?.band) {
    const band = synthesis.roleFitRead.band;
    const [r, g, b] = ROLE_FIT_COLOR[band] ?? [100, 116, 139];
    const badgeX = doc.page.width - 52 - 130;
    doc
      .roundedRect(badgeX, 22, 130, 46, 6)
      .fill(`rgb(${r},${g},${b})`);
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("ADÉQUATION AU POSTE", badgeX + 10, 28, { width: 110, align: "center" });
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text(ROLE_FIT_LABEL[band], badgeX + 10, 42, { width: 110, align: "center" });
  }

  doc.y = 100;

  // Candidate meta strip
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#0f172a")
    .text(candidate.name)
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#64748b")
    .text(`${candidate.email} · ${candidate.job.title}`)
    .moveDown(0.15);

  const stage = formatStage(candidate.stage);
  const submitted = sub?.submittedAt ? formatDate(sub.submittedAt) : "—";
  doc
    .fontSize(9)
    .fillColor("#94a3b8")
    .text(`Étape : ${stage}   ·   Soumise le : ${submitted}`)
    .moveDown(0.6);

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 1 — ASSESSMENT SUMMARY
  // ══════════════════════════════════════════════════════════════════════
  sectionHeader(doc, "Synthèse de l’évaluation");

  if (synthesis?.roleFitRead) {
    // Role-fit read + confidence
    const band = synthesis.roleFitRead.band;
    const [r, g, b] = ROLE_FIT_COLOR[band] ?? [100, 116, 139];
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#64748b")
      .text("ADÉQUATION AU POSTE");
    doc
      .fontSize(15)
      .font("Helvetica-Bold")
      .fillColor(`rgb(${r},${g},${b})`)
      .text(ROLE_FIT_LABEL[band])
      .moveDown(0.15);

    if (synthesis.overallConfidenceDescription || synthesis.overallConfidence) {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#64748b")
        .text(`Confiance : ${synthesis.overallConfidenceDescription ?? synthesis.overallConfidence}`)
        .moveDown(0.3);
    }

    if (synthesis.prose?.roleFitRationale) {
      proseParagraph(doc, synthesis.prose.roleFitRationale);
    }

    if (synthesis.prose?.confidenceRationale) {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#64748b")
        .text(synthesis.prose.confidenceRationale, { lineGap: 2 })
        .moveDown(0.3);
    }

    doc
      .fontSize(8.5)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text("Ceci est une synthèse structurée des signaux observés au regard du référentiel de recrutement. Ce n’est pas une recommandation d’embauche ni de refus : un entretien est nécessaire.")
      .moveDown(0.4);

    // Strengths
    if (synthesis.prose?.strengths && synthesis.prose.strengths.length > 0) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("Points forts")
        .moveDown(0.2);
      for (const s of synthesis.prose.strengths) {
        bulletItem(doc, s);
      }
      doc.moveDown(0.2);
    }

    // Pattern flags
    if (synthesis.flags && synthesis.flags.length > 0) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("Motifs et points de vigilance")
        .moveDown(0.2);
      for (const flag of synthesis.flags) {
        const color = flag.severity === "high" ? "#991b1b" : flag.severity === "medium" ? "#92400e" : "#475569";
        doc
          .fontSize(9.5)
          .font("Helvetica-Bold")
          .fillColor(color)
          .text(`${flag.label} (${SEVERITY_LABELS[flag.severity]})`, { continued: false })
          .font("Helvetica")
          .fillColor("#334155")
          .fontSize(9)
          .text(flag.description, { lineGap: 2, indent: 10 });
        doc.moveDown(0.3);
      }
    }

    // Interview Focus — consolidated (flag probes + signal gap probes)
    const topQ = synthesis.prose?.followUpQuestions?.topThree ?? [];
    const openQ = synthesis.prose?.openQuestions ?? [];
    const hasFlags = synthesis.flags.length > 0;

    if (topQ.length > 0 || openQ.length > 0) {
      sectionHeader(doc, "Points d’entretien prioritaires");
      let qNum = 1;

      if (topQ.length > 0) {
        if (hasFlags) {
          doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b").text("D’après les points de vigilance :").moveDown(0.2);
        }
        for (const q of topQ) {
          doc
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .fillColor("#475569")
            .text(`${qNum++}.`, { continued: true })
            .font("Helvetica")
            .fillColor("#0f172a")
            .text(`  ${q}`, { lineGap: 3 });
          doc.moveDown(0.4);
        }
      }

      if (openQ.length > 0) {
        if (topQ.length > 0) doc.moveDown(0.2);
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b").text("D’après les lacunes de signal :").moveDown(0.2);
        for (const q of openQ) {
          doc
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .fillColor("#475569")
            .text(`${qNum++}.`, { continued: true })
            .font("Helvetica")
            .fillColor("#0f172a")
            .text(`  ${q}`, { lineGap: 3 });
          doc.moveDown(0.4);
        }
      }
    }

    // Dimension estimates with contributing evidence
    sectionHeader(doc, "Estimations par dimension");
    const dimensionOrder = ["conscientiousness", "honesty_humility", "composure", "learning", "interpersonal"];
    for (const dim of dimensionOrder) {
      const result = synthesis.dimensions[dim];
      if (!result) continue;
      const summary = synthesis.prose?.dimensionSummaries?.[dim];
      dimRow(doc, DIMENSION_LABELS[dim] ?? dim, result.band, summary);
      // Evidence sources — always listed; "aucun" when nothing was scored
      const evItems = result.contributingItems ?? [];
      const evText = evItems.length > 0
        ? evItems
            .map((ci) =>
              typeof ci === "string"
                ? ci
                    .replace(/motivation_(\w+)/g, (_, m) => `Motivation : ${MOTIVATOR_LABELS[m] ?? m}`)
                    .replace(/FC \(honesty_humility tally:/, "FC (Honnêteté et humilité, décompte :")
                    .replace(/FC \(conscientiousness tally:/, "FC (Rigueur professionnelle, décompte :")
                    .replace(/FC \(composure tally:/, "FC (Sang-froid, décompte :")
                    .replace(/FC \(learning tally:/, "FC (Orientation apprentissage, décompte :")
                    .replace(/FC \(interpersonal tally:/, "FC (Style relationnel, décompte :")
                : String(ci)
            )
            .join(", ")
        : "aucun";
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#94a3b8")
        .text(`Éléments contributeurs : ${evText}`, { indent: 10, lineGap: 1 })
        .moveDown(0.3);
    }
  } else {
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text("L’analyse n’a pas encore été réalisée pour ce candidat. Ouvrez sa fiche dans l’administration, puis cliquez sur « Réanalyser ».")
      .moveDown(0.5);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 2 — FULL RESPONSES
  // ══════════════════════════════════════════════════════════════════════
  sectionHeader(doc, "Réponses complètes");

  // Role-specific questions
  if (candidate.job.roleQuestions.length > 0) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Questions liées au poste").moveDown(0.3);
    for (const q of candidate.job.roleQuestions) {
      const answer = roleAnswers[q.id] ?? "";
      doc
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .fillColor("#334155")
        .text(q.prompt, { lineGap: 2 })
        .moveDown(0.15)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(answer || "(Aucune réponse fournie)", { lineGap: 3 })
        .moveDown(0.5);
    }
  }

  // Standard questions
  if (standardQuestions.length > 0) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Questions standard").moveDown(0.3);
    for (const q of standardQuestions) {
      const answer = standardAnswers[q.id] ?? "";
      doc
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .fillColor("#334155")
        .text(q.prompt, { lineGap: 2 })
        .moveDown(0.15)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(answer || "(Aucune réponse fournie)", { lineGap: 3 })
        .moveDown(0.5);
    }
  }

  // STAR behavioural items
  const starItems = psychoItems.filter((i) => i.itemType === "star_behavioral");
  if (starItems.length > 0) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Réponses comportementales STAR").moveDown(0.3);
    for (const item of starItems) {
      const answer = psychoAnswers[item.id] as string | undefined;
      const scoredRow = sub?.itemScores?.find((s) => s.itemId === item.itemId);
      const rawBand = scoredRow?.bandEstimate ?? null;
      const status = scoredRow?.status ?? null;
      const bandLabel = rawBand && status === "scored"
        ? ` – ${BAND_LABELS[rawBand as DimensionBand] ?? rawBand}`
        : status === "scoring_failed" ? " – Non évalué"
        : status === "insufficient" ? " – Trop court pour être évalué"
        : "";

      doc
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .fillColor("#334155")
        .text(`${item.itemId}${bandLabel}`, { lineGap: 2 })
        .moveDown(0.15)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(answer ?? "(Aucune réponse)", { lineGap: 3 })
        .moveDown(0.5);
    }
  }

  // Psychometric summary (FC tallies, T1 ranking, CC values)
  if (scores?.fcTallies && Object.keys(scores.fcTallies).length > 0) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Décompte des choix forcés").moveDown(0.2);
    const sorted = Object.entries(scores.fcTallies).sort((a, b) => b[1] - a[1]);
    for (const [dim, count] of sorted) {
      const dimLabel = DIMENSION_LABELS[dim] ?? dim.replace(/motivation_(\w+)/, (_, m) => `Motivation : ${MOTIVATOR_LABELS[m] ?? m}`);
      doc
        .fontSize(9.5)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(`${dimLabel} : ${count}`)
        .moveDown(0.1);
    }
    doc.moveDown(0.4);
  }

  if (scores?.t1Ranking && scores.t1Ranking.length > 0) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Classement des motivations (C-T1)").moveDown(0.2);
    scores.t1Ranking.forEach((id, i) => {
      doc
        .fontSize(9.5)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(`${i + 1}. ${MOTIVATOR_LABELS[id] ?? id}`)
        .moveDown(0.1);
    });
    doc.moveDown(0.4);
  }

  if (scores?.ccValues && Object.keys(scores.ccValues).length > 0) {
    const likertLabels = ["", "Pas du tout d’accord", "Pas d’accord", "Ni l’un ni l’autre", "D’accord", "Tout à fait d’accord"];
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Contrôles de cohérence").moveDown(0.2);
    for (const [itemId, val] of Object.entries(scores.ccValues)) {
      doc
        .fontSize(9.5)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(`${itemId} : ${likertLabels[val] ?? String(val)} (${val}/5)`)
        .moveDown(0.15);
    }
    doc.moveDown(0.3);
  }

  // Reflection
  const reflectionItem = psychoItems.find((i) => i.itemId === "C-R1");
  if (reflectionItem) {
    const reflAnswer = psychoAnswers[reflectionItem.id] as string | undefined;
    if (reflAnswer) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Réflexion (C-R1)").moveDown(0.2);
      doc.fontSize(9.5).font("Helvetica").fillColor("#0f172a").text(reflAnswer, { lineGap: 3 }).moveDown(0.4);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // FOOTER on every page
  // ══════════════════════════════════════════════════════════════════════
  doc.end();
  const nodeBuffer = await pdfDone;

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(7.5)
      .fillColor("#94a3b8")
      .font("Helvetica")
      .text(
        `${APP_NAME} · Confidentiel · ${candidate.name} · Page ${i + 1}/${range.count}`,
        52,
        doc.page.height - 32,
        { align: "center", width: doc.page.width - 104 }
      );
  }

  const safeName = candidate.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return new NextResponse(new Uint8Array(nodeBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="candidate-report-${safeName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
