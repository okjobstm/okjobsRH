/**
 * Phase 1 prose generation — LLM calls for dimension summaries, role-fit
 * rationale, strengths, and open questions.
 *
 * Uses Anthropic Sonnet (primary). Results are stored in synthesisJson.prose
 * and are content-addressed so they only regenerate when the underlying data changes.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  SynthesisResult,
  DimensionResult,
  DimensionBand,
  RoleFitRead,
  PatternFlag,
  ItemScoreData,
  FollowUpQuestions,
  CEO_TITLE_RE,
  MARKETING_ENGINEER_TITLE_RE,
} from "./synthesis";

const MODEL_ID = "claude-sonnet-4-6";
const TIMEOUT_MS = 30_000;
const MAX_TOKENS = 512;

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: TIMEOUT_MS });
  }
  return _client;
}

// ─── Band display strings ─────────────────────────────────────────────────────

const BAND_DISPLAY: Record<DimensionBand, string> = {
  unusually_strong: "signal positif exceptionnellement fort",
  strong_positive: "signal positif fort",
  moderate_positive: "signal positif modéré",
  mixed: "signal contrasté",
  limited_signal: "signal limité",
  insufficient_signal: "signal insuffisant",
  concern: "point de vigilance",
};

const CONFIDENCE_DISPLAY: Record<string, string> = {
  rich_signal: "riche : trois sources ou plus qui convergent",
  moderate_signal: "modéré : deux sources ou convergence partielle",
  limited_signal: "limité : une source ou corroboration faible",
};

const DIMENSION_DISPLAY: Record<string, string> = {
  conscientiousness: "Conscienciosité : fiabilité, autodiscipline et suivi des objectifs",
  honesty_humility: "Honnêteté et humilité : sincérité, équité, modestie et faible propension à exploiter autrui",
  composure: "Aplomb (composure) : réaction comportementale observable et capacité à se rétablir face au stress ou aux revers",
  learning: "Orientation vers l’apprentissage : ouverture aux informations qui contredisent les convictions et traces d’une mise à jour par le candidat lui-même",
  interpersonal: "Posture relationnelle : gestion du désaccord, du feedback, de la collaboration et de la manière de donner le cap",
  motivation: "Leviers de motivation : ce que le candidat recherche avant tout dans son environnement de travail",
};

// ─── LLM call helper ─────────────────────────────────────────────────────────

async function callLLM(prompt: string, maxWords: number): Promise<string> {
  try {
    const message = await getClient().messages.create({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS,
      system: `Vous rédigez en français des synthèses précises et fondées sur des éléments factuels, à destination de responsables de recrutement.
Prose uniquement. Pas de listes à puces, pas de titres, pas de préambule.
Pas de vocabulaire clinique ou psychologique. N’écrivez pas "démontre", "met en valeur" ou "fait preuve de".
Pas de formulation du type "élevé en X" ou "faible en X". Pas de formules RH génériques.
${maxWords} mots maximum. Ne renvoyez que le texte demandé.`,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
    return text;
  } catch {
    return "";
  }
}

// ─── Dimension prose (2-3 sentences) ─────────────────────────────────────────

type EvidenceExcerpt = {
  sectionLabel: string;
  responseExcerpt: string;
  rubricFeatures?: string;
};

export async function generateDimensionProse(
  dimension: string,
  result: DimensionResult,
  evidence: EvidenceExcerpt[]
): Promise<string> {
  const evidenceText = evidence
    .map((e) => `- ${e.sectionLabel}: "${e.responseExcerpt}"${e.rubricFeatures ? ` [${e.rubricFeatures}]` : ""}`)
    .join("\n");

  const prompt = `Rédigez un résumé de 2 à 3 phrases sur les signaux de ce candidat concernant ${DIMENSION_DISPLAY[dimension] ?? dimension}.

BANDE : ${BAND_DISPLAY[result.band] ?? result.band}
CONFIANCE : ${CONFIDENCE_DISPLAY[result.confidence] ?? result.confidence}
${result.conflictNote ? `NOTE DE CONFLIT : ${result.conflictNote}` : ""}

ÉLÉMENTS DE PREUVE :
${evidenceText || "Aucun extrait de preuve disponible."}

Référez-vous aux preuves par leur libellé de section (par exemple "dans l’item sur une réalisation récente..."), jamais par identifiant interne (pas "C-S1").
Reprenez entre guillemets les formulations exactes de la réponse du candidat lorsqu’elles sont disponibles.
Si la bande est contrastée ou insuffisante, expliquez ce qui manque ou ce qui se contredit.
2 à 3 phrases. Pas de listes à puces. Pas de préambule.`;

  return callLLM(prompt, 80);
}

// ─── Role-fit rationale (1-2 sentences) ──────────────────────────────────────

export async function generateRoleFitRationale(
  roleTitle: string,
  roleFitRead: RoleFitRead,
  flags: PatternFlag[]
): Promise<string> {
  const dimLines = roleFitRead.priorityDimensionScores
    .map((d) => `- ${d.dimension}: ${BAND_DISPLAY[d.band] ?? d.band}`)
    .join("\n");
  const flagLines = flags.length > 0
    ? flags.map((f) => `- [${f.severity.toUpperCase()}] ${f.label}`).join("\n")
    : "Aucun";

  const prompt = `Rédigez 1 à 2 phrases d’interprétation expliquant ce que les signaux de ce candidat signifient pour ce poste précis.

POSTE : ${roleTitle}
LECTURE D’ADÉQUATION AU POSTE : ${roleFitRead.band}

SIGNAUX SUR LES DIMENSIONS PRIORITAIRES :
${dimLines}

SIGNAUX D’ALERTE :
${flagLines}

C’est la phrase INTERPRÉTATIVE : expliquez ce que ce schéma signifie pour l’adéquation à ce poste.
Ne décrivez PAS le candidat en tant que personne. Ne recommandez NI le recrutement NI le refus.
Ne listez PAS les dimensions ni les signaux d’alerte par leur nom : synthétisez-les en une seule lecture interprétative.
Si le signal est positif, nommez ce qui rend ce candidat adapté. S’il est négatif, nommez la préoccupation précise qui porte la lecture.
1 à 2 phrases seulement. Pas de préambule.`;

  return callLLM(prompt, 60);
}

// ─── Overall confidence rationale (factual, not interpretive) ─────────────────

export async function generateConfidenceRationale(
  overallConfidence: string,
  overallConfidenceDescription: string,
  scoredItemCount: number,
  failedItemCount: number,
  dimensionBands: Record<string, { band: string; confidence: string }>
): Promise<string> {
  const contributingDims = Object.entries(dimensionBands)
    .filter(([, d]) => d.band !== "insufficient_signal")
    .map(([dim, d]) => `${dim}: ${d.confidence.replace("_", " ")}`)
    .join(", ");

  const failedNote = failedItemCount > 0
    ? `\nREMARQUE : ${failedItemCount} item(s) comportemental/aux n’ont pas pu être noté(s) automatiquement : signalez ce point comme une lacune de couverture.`
    : "";

  const prompt = `Rédigez exactement 1 phrase répondant à la question : "De combien de signaux disposons-nous, et sont-ils convergents ?"

CONFIANCE GLOBALE : ${overallConfidenceDescription}
ITEMS COMPORTEMENTAUX NOTÉS : ${scoredItemCount}${failedItemCount > 0 ? ` (${failedItemCount} item(s) non noté(s))` : ""}
NIVEAUX DE CONFIANCE PAR DIMENSION : ${contributingDims || "aucun"}${failedNote}

Cette phrase est strictement factuelle : elle décrit la quantité et la convergence des éléments de preuve, PAS ce que ces éléments disent du candidat.
Indiquez combien d’items comportementaux ont été notés et si les signaux par dimension convergent ou sont contrastés.
Exemples du registre attendu :
  "Signal riche : quatre items comportementaux notés avec des preuves convergentes ; les signaux par dimension sont alignés sur les décomptes à choix forcé."
  "Signal riche : quatre items comportementaux notés, dont plusieurs convergent vers un schéma préoccupant autour de la transparence et de la responsabilité."
  "Signal modéré : deux items comportementaux notés avec convergence partielle ; une dimension manque de données."
Ne décrivez PAS le candidat. N’interprétez PAS ce que les signaux signifient.
Une seule phrase. Pas de préambule.`;

  return callLLM(prompt, 50);
}

// ─── Strength statements (1 sentence per dimension) ──────────────────────────

export async function generateStrength(
  dimension: string,
  band: DimensionBand,
  evidence: EvidenceExcerpt[]
): Promise<string> {
  const evidenceText = evidence
    .map((e) => `- ${e.sectionLabel}: "${e.responseExcerpt}"`)
    .join("\n");

  const prompt = `Rédigez exactement une phrase décrivant une force du candidat sur ${DIMENSION_DISPLAY[dimension] ?? dimension}.

BANDE : ${BAND_DISPLAY[band] ?? band}
PRINCIPAUX ÉLÉMENTS DE PREUVE :
${evidenceText || "Les données à choix forcé montrent une préférence nette."}

Référez-vous à l’item par son libellé de section. Reprenez une formulation précise de la réponse si elle est disponible.
Ne dites PAS que le candidat est "élevé en X". Décrivez ce qu’il a dit ou fait.
Une seule phrase. Pas de préambule.`;

  return callLLM(prompt, 35);
}

// ─── Open questions (1 sentence per insufficient-signal priority dimension) ────

export async function generateOpenQuestion(
  dimension: string,
  whyInsufficient: string
): Promise<string> {
  const prompt = `Rédigez une question ouverte pour un responsable de recrutement, sur une dimension dont le signal est insuffisant.

DIMENSION : ${DIMENSION_DISPLAY[dimension] ?? dimension}
POURQUOI LE SIGNAL EST INSUFFISANT : ${whyInsufficient}

Formulez-la comme une question ouverte à poser en entretien.
Soyez précis sur la nature des éléments de preuve complémentaires qui seraient utiles.
Une seule phrase. Pas de préambule.`;

  return callLLM(prompt, 40);
}

// ─── Follow-up question generation ───────────────────────────────────────────

const BANNED_STEMS = [
  "racontez-moi une fois",
  "retracez avec moi votre",
  "décrivez votre méthode pour",
  "comment géreriez-vous",
];

const FLAG_EXAMPLES: Record<string, string> = {
  SELF_REPORT_DIVERGENCE_COMMITMENT:
    `Exemple de relance : "Vous avez indiqué qu’il vous arrive parfois de laisser des tâches inachevées quand l’intérêt retombe, mais sur l’item portant sur une réalisation récente vous décrivez un projet mené jusqu’à son terme malgré les obstacles. Pouvez-vous me raconter une tâche récente que vous n’avez pas terminée, et ce qu’il s’est passé ?"`,
  INTEGRITY_PATTERN_CONCERN:
    `Exemple de relance : "Dans le scénario d’analyse, vous avez indiqué que vous partageriez le travail puis corrigeriez le défaut discrètement ensuite. Pouvez-vous me raconter une situation réelle où vous avez réalisé qu’une partie de votre travail comportait un défaut après sa diffusion, et ce que vous avez fait ?"`,
  EXTERNAL_ATTRIBUTION_PATTERN:
    `Exemple de relance : "Sur la question du projet qui dérape, vous avez avancé que l’exécution par votre équipe constituait le problème principal. Quelle a été votre propre contribution à la façon dont la situation s’est développée, y compris les décisions que vous prendriez différemment aujourd’hui ?"`,
  ROLE_MISALIGNED_MOTIVATION_CEO:
    `Exemple de relance : "Vous avez classé la mission en dernier parmi quatre motivations dans la question sur les arbitrages. Cette organisation est portée par sa mission. Qu’est-ce qui vous attire concrètement dans ce poste, et comment voyez-vous la dimension mission du travail ?"`,
  SPECIFICITY_DEFICIT:
    `Exemple de relance : "Dans plusieurs de vos réponses écrites, les situations sont décrites de façon assez générale. Reprenez le projet ou l’erreur que vous avez décrit et redétailléez-la davantage : dates, noms, chiffres exacts, ce que vous avez dit mot pour mot."`,
  ROLE_FIT_MISMATCH_MARKETING_ENG:
    `Exemple de relance : "Vos réponses ont mis en avant une approche du marketing fondée sur la relation et traditionnelle, plutôt que sur l’IA et l’automatisation. Ce poste est explicitement centré sur l’ingénierie. Qu’est-ce qui vous attire dans un poste structuré de cette façon plutôt que dans un poste de marketing traditionnel ?"`,
  ROLE_DIRECTION_MISMATCH_TRADITIONAL_MARKETER_ME:
    `Exemple de relance : "Vous avez indiqué privilégier une connexion humaine authentique plutôt que des méthodes très technologiques. Ce poste repose sur l’IA et l’automatisation. Qu’est-ce qui vous attire dans un poste centré sur l’IA, compte tenu de cette préférence ?"`,
};

function buildCandidateTokens(texts: string[]): Set<string> {
  const tokens = new Set<string>();
  for (const t of texts) {
    for (const word of t.toLowerCase().split(/\W+/)) {
      if (word.length >= 4) tokens.add(word);
    }
  }
  return tokens;
}

// A 60-word English ceiling rejects questions that are genuinely concise in
// French, which runs 15 to 20 percent longer for the same content. One shared
// constant keeps the validator and both prompts in agreement.
const MAX_QUESTION_WORDS = 75;

function validateQuestion(question: string, candidateTokens: Set<string>): { ok: boolean; reason?: string } {
  const wordCount = question.trim().split(/\s+/).length;
  if (wordCount > MAX_QUESTION_WORDS) return { ok: false, reason: "too_long" };

  const questionMarks = (question.match(/\?/g) ?? []).length;
  if (questionMarks > 1) return { ok: false, reason: "multi_part" };

  const lower = question.toLowerCase();
  for (const stem of BANNED_STEMS) {
    if (lower.includes(stem)) return { ok: false, reason: `banned_stem:${stem}` };
  }

  // Genericness check: at least one 4+ char token from candidate's response must appear
  const questionWords = new Set(lower.split(/\W+/).filter((w) => w.length >= 4));
  const overlap = [...questionWords].some((w) => candidateTokens.has(w));
  if (!overlap) return { ok: false, reason: "generic" };

  return { ok: true };
}

type FollowUpContext = {
  surface: "flag" | "dimension";
  targetId: string;
  label: string;
  whyItMatters: string;
  relevantResponses: Array<{ sectionLabel: string; excerpt: string; rubricFeatures?: string }>;
  roleTitle: string;
  candidateTokens: Set<string>;
};

export async function generateOneFollowUp(ctx: FollowUpContext, avoidAnchors?: string[]): Promise<string> {
  const responsesText = ctx.relevantResponses
    .map((r) => `- ${r.sectionLabel}:\n  Response: "${r.excerpt}"\n${r.rubricFeatures ? `  Rubric: ${r.rubricFeatures}` : ""}`)
    .join("\n");

  const example = ctx.surface === "flag" ? (FLAG_EXAMPLES[ctx.targetId] ?? "") : "";
  const exampleBlock = example ? `\nEXEMPLE EN CONTEXTE (pour le calibrage uniquement, ne pas copier) :\n${example}\n` : "";
  const avoidBlock = avoidAnchors && avoidAnchors.length > 0
    ? `\nIMPORTANT : ne référencez ni ne reformulez aucune des phrases suivantes (déjà utilisées dans une autre question) :\n${avoidAnchors.map((a) => `- "${a}"`).join("\n")}\nAppuyez-vous plutôt sur un autre élément de preuve.\n`
    : "";

  const prompt = `Vous aidez un responsable de recrutement à préparer un entretien. Rédigez une question de relance qui creuse un élément précis que le candidat a dit ou fait dans son évaluation écrite.

CONTEXTE :
- Poste : ${ctx.roleTitle}
- Cette question porte sur : ${ctx.label}
- Enjeu : ${ctx.whyItMatters}

RÉPONSES DU CANDIDAT PERTINENTES POUR CETTE QUESTION :
${responsesText || "Aucun extrait disponible : appuyez-vous sur la description du signal d’alerte pour relancer."}
${exampleBlock}${avoidBlock}
RÈGLES :
- Renvoyez exactement une question, en texte brut, sans guillemets.
- Référencez un élément précis dit par le candidat, en le reformulant ou en citant une courte formulation.
- Ne générez PAS de relances génériques du type "racontez-moi une fois où vous avez fait preuve de résilience" ou "retracez avec moi votre style de leadership".
- Creusez, ne confirmez pas. Si la réponse était vague, demandez le détail précis qui manquait. En cas d’incohérence, abordez-la directement mais de manière constructive.
- Une seule relance : pas de question à plusieurs volets.
- Pas de vocabulaire psychologique.
- La question doit pouvoir être posée telle quelle par un responsable de recrutement attentif.
- ${MAX_QUESTION_WORDS} mots maximum.

Renvoyez une seule question. Pas de préambule, pas de numérotation.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await callLLM(prompt, 70);
    if (!raw) continue;
    const question = raw.replace(/^["']|["']$/g, "").trim();
    const validation = validateQuestion(question, ctx.candidateTokens);
    if (validation.ok) return question;
  }
  return "";
}

// ─── Anchor deduplication helpers ────────────────────────────────────────────

function extractQuotedPhrases(text: string): string[] {
  const matches = text.match(/\u201c([^\u201d]+)\u201d|"([^"]+)"/g) ?? [];
  return matches.map((m) => m.replace(/^[\u201c"]|[\u201d"]$/g, "").toLowerCase());
}

function sharedAnchorPhrase(q1: string, q2: string): string | null {
  const phrases1 = extractQuotedPhrases(q1);
  const phrases2 = extractQuotedPhrases(q2);
  for (const p1 of phrases1) {
    const words1 = p1.split(/\s+/);
    for (const p2 of phrases2) {
      for (let i = 0; i <= words1.length - 4; i++) {
        const ngram = words1.slice(i, i + 4).join(" ");
        if (p2.includes(ngram)) return ngram;
      }
    }
  }
  return null;
}

// ─── Gap probe for zero-flag candidates ──────────────────────────────────────

async function generateGapProbe(
  dimension: string,
  result: DimensionResult,
  evidence: EvidenceExcerpt[],
  roleTitle: string
): Promise<string> {
  const evidenceText = evidence
    .map((e) => `- ${e.sectionLabel}: "${e.responseExcerpt}"`)
    .join("\n");

  const prompt = `Rédigez une question d’entretien pour recueillir des éléments de preuve manquants sur une dimension dont le dernier relevé de signal est "${BAND_DISPLAY[result.band] ?? result.band}".

POSTE : ${roleTitle}
DIMENSION : ${DIMENSION_DISPLAY[dimension] ?? dimension}
ÉLÉMENTS DE PREUVE DISPONIBLES :
${evidenceText || "Aucun élément de preuve spécifique disponible."}

Cette question est une VÉRIFICATION, pas une mise en défaut. Elle sert à combler un manque dans les données.
Formulez-la comme une invitation à partager une expérience qui n’est pas ressortie de l’évaluation écrite.
Soyez précis sur le type de situation ou d’exemple qui serait utile.
${MAX_QUESTION_WORDS} mots maximum. Une seule question. Pas de préambule.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await callLLM(prompt, 70);
    if (!raw) continue;
    const question = raw.replace(/^["']|["']$/g, "").trim();
    const wordCount = question.trim().split(/\s+/).length;
    const qMarks = (question.match(/\?/g) ?? []).length;
    if (wordCount <= 65 && qMarks >= 1) return question;
  }
  return "";
}

// Priority ranking (lower number = higher priority):
// 1: high-severity flag
// 2: priority dimension that was downgraded (band ≤ mixed, and it's a priority dim)
// 3: insufficient-signal priority dimension
// 4: medium-severity flag
// 5: moderate-positive band on a priority dimension

type RankedQuestion = { id: string; surface: "flag" | "dimension"; question: string; priority: number; ctx?: FollowUpContext };

export async function generateAllFollowUpQuestions(
  synthesis: Omit<SynthesisResult, "prose" | "computedAt">,
  itemScores: ItemScoreForProse[],
  psychoAnswers: PsychoAnswerMap,
  psychoItems: PsychoItemForProse[],
  roleAnswers: Record<string, string>,
  jobTitle: string
): Promise<FollowUpQuestions> {
  const { flags, dimensions } = synthesis;

  const priorityDims = CEO_TITLE_RE.test(jobTitle)
    ? ["honesty_humility", "conscientiousness", "composure"]
    : MARKETING_ENGINEER_TITLE_RE.test(jobTitle)
    ? ["learning", "conscientiousness", "honesty_humility"]
    : ["conscientiousness", "honesty_humility", "composure", "learning"];

  // Build candidate token set from all response text (for genericness check)
  const allResponseTexts = [
    ...Object.values(roleAnswers),
    ...psychoItems
      .filter((p) => p.itemType === "star_behavioral")
      .map((p) => {
        const ans = psychoAnswers[p.id];
        return typeof ans === "string" ? ans : "";
      }),
  ];
  const candidateTokens = buildCandidateTokens(allResponseTexts);

  // ── Per-flag questions ─────────────────────────────────────────────────────
  const byFlag: Record<string, string> = {};
  const flagWork: Array<Promise<void>> = [];

  for (const flag of flags) {
    if (flag.severity === "operational") continue;

    flagWork.push((async () => {
      // Build relevant responses from contributing items
      const relevantResponses: FollowUpContext["relevantResponses"] = [];
      for (const ci of flag.contributingItems) {
        const psychoItem = psychoItems.find((p) => p.itemId === ci.itemId);
        if (psychoItem) {
          const ans = psychoAnswers[psychoItem.id];
          const ansText = typeof ans === "string" ? ans : "";
          const score = itemScores.find((s) => s.itemId === ci.itemId && s.status === "scored");
          const rubricFeatures = score?.features
            ? Object.entries(score.features)
                .slice(0, 3)
                .map(([k, v]) => `${k}: ${v.value}`)
                .join(", ")
            : undefined;
          relevantResponses.push({
            sectionLabel: ci.sectionLabel,
            excerpt: excerptText(ansText, 120),
            rubricFeatures,
          });
        } else if (ci.itemId === "ROLE_Q") {
          // Role-specific answers
          const combined = Object.values(roleAnswers).join(" ");
          relevantResponses.push({
            sectionLabel: ci.sectionLabel,
            excerpt: excerptText(combined, 120),
          });
        } else if (ci.itemId === "C-T1" || ci.itemId === "C-T2" || ci.itemId.startsWith("C-CC")) {
          relevantResponses.push({
            sectionLabel: ci.sectionLabel,
            excerpt: ci.excerpt,
          });
        }
      }

      const question = await generateOneFollowUp({
        surface: "flag",
        targetId: flag.id,
        label: flag.label,
        whyItMatters: flag.description.split(".")[0] ?? flag.description,
        relevantResponses,
        roleTitle: jobTitle,
        candidateTokens,
      });
      if (question) byFlag[flag.id] = question;
    })());
  }

  await Promise.all(flagWork);

  // ── Per-dimension questions (priority dims with < strong_positive band) ──────
  const byDimension: Record<string, string> = {};
  const dimWork: Array<Promise<void>> = [];
  const dimContexts: Record<string, FollowUpContext> = {};

  for (const dim of priorityDims) {
    const dimResult = dimensions[dim];
    if (!dimResult) continue;

    const { band } = dimResult;
    // Only generate a dimension probe if there's something to probe
    // Skip unusually_strong and strong_positive (no probe needed)
    if (band === "unusually_strong" || band === "strong_positive" || band === "insufficient_signal") continue;

    dimWork.push((async () => {
      const evidence = buildDimensionEvidence(dim, itemScores, psychoAnswers, psychoItems, dimResult.fcTally, dimResult.fcMax, undefined);

      const whyItMatters =
        band === "concern"
          ? `Plusieurs signaux convergent sur un point de vigilance : relancez pour comprendre le schéma.`
          : band === "mixed"
          ? `Les éléments de preuve sont contrastés : les signaux comportementaux et à choix forcé pointent dans des directions différentes.`
          : band === "moderate_positive"
          ? `Signal positif mais de profondeur limitée : relancez pour confirmer la régularité du schéma.`
          : `Signal limité : pas assez d’éléments de preuve pour lire cette dimension avec confiance.`;

      const ctx: FollowUpContext = {
        surface: "dimension",
        targetId: dim,
        label: DIMENSION_DISPLAY[dim] ?? dim,
        whyItMatters,
        relevantResponses: evidence.map((e) => ({ sectionLabel: e.sectionLabel, excerpt: e.responseExcerpt, rubricFeatures: e.rubricFeatures })),
        roleTitle: jobTitle,
        candidateTokens,
      };
      dimContexts[dim] = ctx;
      const question = await generateOneFollowUp(ctx);
      if (question) byDimension[dim] = question;
    })());
  }

  await Promise.all(dimWork);

  // ── Rank all questions for top-3 ─────────────────────────────────────────
  const ranked: RankedQuestion[] = [];
  const flagContexts: Record<string, FollowUpContext> = {};

  for (const flag of flags) {
    const q = byFlag[flag.id];
    if (!q) continue;
    const priority = flag.severity === "high" ? 1 : 4;
    // Rebuild flag context for potential regeneration
    const relevantResponses: FollowUpContext["relevantResponses"] = [];
    for (const ci of flag.contributingItems) {
      const psychoItem = psychoItems.find((p) => p.itemId === ci.itemId);
      if (psychoItem) {
        const ans = psychoAnswers[psychoItem.id];
        const ansText = typeof ans === "string" ? ans : "";
        relevantResponses.push({ sectionLabel: ci.sectionLabel, excerpt: excerptText(ansText, 120) });
      } else if (ci.itemId === "C-T1" || ci.itemId === "C-T2" || ci.itemId.startsWith("C-CC")) {
        relevantResponses.push({ sectionLabel: ci.sectionLabel, excerpt: ci.excerpt });
      }
    }
    const ctx: FollowUpContext = {
      surface: "flag",
      targetId: flag.id,
      label: flag.label,
      whyItMatters: flag.description.split(".")[0] ?? flag.description,
      relevantResponses,
      roleTitle: jobTitle,
      candidateTokens,
    };
    flagContexts[flag.id] = ctx;
    ranked.push({ id: flag.id, surface: "flag", question: q, priority, ctx });
  }

  for (const dim of priorityDims) {
    const q = byDimension[dim];
    if (!q) continue;
    const band = dimensions[dim]?.band;
    const priority =
      band === "concern" || band === "mixed" ? 2 :
      band === "limited_signal" || band === "insufficient_signal" ? 3 : 5;
    ranked.push({ id: dim, surface: "dimension", question: q, priority, ctx: dimContexts[dim] });
  }

  ranked.sort((a, b) => a.priority - b.priority);

  // Build topThree with anchor deduplication (item 3):
  // If two selected questions share the same quoted evidence anchor, regenerate
  // the lower-priority one with an instruction to avoid the shared phrase.
  const topThree: string[] = [];
  for (let i = 0; i < Math.min(ranked.length, 3); i++) {
    const entry = ranked[i];
    let question = entry.question;

    // Check against already-accepted questions for shared anchor
    const usedAnchors: string[] = [];
    for (const accepted of topThree) {
      const shared = sharedAnchorPhrase(accepted, question);
      if (shared) usedAnchors.push(shared);
    }

    if (usedAnchors.length > 0 && entry.ctx) {
      const regenerated = await generateOneFollowUp(entry.ctx, usedAnchors);
      if (regenerated) question = regenerated;
    }

    topThree.push(question);
  }

  // Item 6: for clean candidates with no pattern flags, generate a gap probe
  // targeting the lowest-confidence priority dimension
  if (topThree.length === 0 && flags.length === 0) {
    const BAND_SIGNAL_ORDER: Record<string, number> = {
      insufficient_signal: 0, limited_signal: 1, mixed: 2,
      moderate_positive: 3, strong_positive: 4, unusually_strong: 5, concern: 2,
    };
    const gapDim = [...priorityDims]
      .filter((d) => dimensions[d])
      .sort((a, b) => (BAND_SIGNAL_ORDER[dimensions[a].band] ?? 3) - (BAND_SIGNAL_ORDER[dimensions[b].band] ?? 3))[0];

    if (gapDim && dimensions[gapDim]) {
      const gapResult = dimensions[gapDim];
      const evidence = buildDimensionEvidence(gapDim, itemScores, psychoAnswers, psychoItems, gapResult.fcTally, gapResult.fcMax, undefined);
      const probe = await generateGapProbe(gapDim, gapResult, evidence, jobTitle);
      if (probe) topThree.push(probe);
    }
  }

  return { byFlag, byDimension, topThree };
}

// ─── Full prose generation orchestrator ──────────────────────────────────────

type ItemScoreForProse = {
  itemId: string;
  status: string;
  bandEstimate: string;
  features: Record<string, { value: string; justification?: string; supporting_excerpt?: string }> | null;
};

type PsychoItemForProse = {
  id: string;
  itemId: string;
  itemType: string;
  body: string;
};

type PsychoAnswerMap = Record<string, string | string[]>;

const STAR_SECTION_LABELS: Record<string, string> = {
  "C-S1": "Part 1 — A recent piece of work",
  "C-S2": "Part 3 — A mistake you made",
  "C-S3": "Part 5 — Changing your mind",
  "C-S4": "Part 8 — Hard feedback",
};

const STAR_PRIMARY_DIMENSION: Record<string, string> = {
  "C-S1": "conscientiousness",
  "C-S2": "honesty_humility",
  "C-S3": "learning",
  "C-S4": "interpersonal",
};

const PRIORITY_DIMS_CEO = ["honesty_humility", "conscientiousness", "composure"];
const PRIORITY_DIMS_ME = ["learning", "conscientiousness", "honesty_humility"];

function excerptText(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ") + "…";
}

function buildDimensionEvidence(
  dimension: string,
  itemScores: ItemScoreForProse[],
  psychoAnswers: PsychoAnswerMap,
  psychoItems: PsychoItemForProse[],
  fcTally: number,
  fcMax: number,
  ccValue: number | undefined
): EvidenceExcerpt[] {
  const evidence: EvidenceExcerpt[] = [];

  // Find the primary STAR item for this dimension
  for (const [starItemId, dim] of Object.entries(STAR_PRIMARY_DIMENSION)) {
    if (dim !== dimension) continue;
    const score = itemScores.find((s) => s.itemId === starItemId && s.status === "scored");
    if (!score) continue;

    // Find the psychoItem to get the answer
    const psychoItem = psychoItems.find((p) => p.itemId === starItemId);
    if (!psychoItem) continue;
    const answer = psychoAnswers[psychoItem.id];
    const answerText = typeof answer === "string" ? answer : "";

    // Key rubric features for this dimension
    const relevantFeatures: string[] = [];
    if (score.features) {
      const featureNames = Object.keys(score.features).slice(0, 3);
      for (const fn of featureNames) {
        const f = score.features[fn];
        relevantFeatures.push(`${fn}: ${f.value}`);
      }
    }

    evidence.push({
      sectionLabel: STAR_SECTION_LABELS[starItemId] ?? starItemId,
      responseExcerpt: excerptText(answerText, 60),
      rubricFeatures: relevantFeatures.join(", "),
    });
  }

  // Add FC signal as evidence
  if (fcTally > 0) {
    evidence.push({
      sectionLabel: "Forced-choice pairs",
      responseExcerpt: `Le candidat a privilégié cette dimension dans ${fcTally} paires sur ${fcMax} paires concernées.`,
    });
  }

  // Add CC if relevant
  if (ccValue !== undefined) {
    const ccItemId = dimension === "conscientiousness" ? "C-CC1" : "C-CC2";
    evidence.push({
      sectionLabel: `Consistency check (${ccItemId})`,
      responseExcerpt: `Note auto-évaluée : ${ccValue}/5 sur l’affirmation de contrôle.`,
    });
  }

  return evidence;
}

export async function generateAllProse(
  synthesis: Omit<SynthesisResult, "prose" | "computedAt">,
  itemScores: ItemScoreForProse[],
  psychoAnswers: PsychoAnswerMap,
  psychoItems: PsychoItemForProse[],
  jobTitle: string,
  allItemScores?: ItemScoreData[],
  roleAnswers?: Record<string, string>
): Promise<SynthesisResult["prose"]> {
  const { dimensions, flags, roleFitRead, overallConfidence, overallConfidenceDescription } = synthesis;

  // Identify priority dimensions for this role
  const priorityDims = CEO_TITLE_RE.test(jobTitle)
    ? PRIORITY_DIMS_CEO
    : MARKETING_ENGINEER_TITLE_RE.test(jobTitle)
    ? PRIORITY_DIMS_ME
    : PRIORITY_DIMS_CEO;

  // ── Generate dimension summaries (all 5 scored dimensions) ────────────────
  const dimensionSummaries: Record<string, string> = {};
  const allScoredDims = ["conscientiousness", "honesty_humility", "composure", "learning", "interpersonal"];

  await Promise.all(
    allScoredDims.map(async (dim) => {
      const result = dimensions[dim];
      if (!result) return;

      const evidence = buildDimensionEvidence(
        dim,
        itemScores,
        psychoAnswers,
        psychoItems,
        result.fcTally,
        result.fcMax,
        undefined
      );
      dimensionSummaries[dim] = await generateDimensionProse(dim, result, evidence);
    })
  );

  // ── Role-fit rationale (interpretive) ─────────────────────────────────────
  const roleFitRationale = await generateRoleFitRationale(jobTitle, roleFitRead, flags);

  // ── Confidence rationale (factual) ────────────────────────────────────────
  const scoredStarCount = itemScores.filter((s) => s.status === "scored" && s.itemId.startsWith("C-S")).length;
  const failedStarCount = itemScores.filter((s) => s.status === "scoring_failed" && s.itemId.startsWith("C-S")).length;
  const confidenceRationale = await generateConfidenceRationale(
    overallConfidence,
    overallConfidenceDescription ?? "Signal modéré",
    scoredStarCount,
    failedStarCount,
    dimensions
  );

  // ── Strength statements: only from dims with genuinely positive bands ──────
  // Do NOT generate strengths for concern, mixed, or limited_signal dimensions.
  const strengthCandidates = allScoredDims.filter((dim) => {
    const band = dimensions[dim]?.band;
    return band === "strong_positive" || band === "unusually_strong" || band === "moderate_positive";
  });

  const strengths: string[] = [];
  await Promise.all(
    strengthCandidates.slice(0, 4).map(async (dim) => {
      const result = dimensions[dim];
      if (!result) return;
      const evidence = buildDimensionEvidence(dim, itemScores, psychoAnswers, psychoItems, result.fcTally, result.fcMax, undefined);
      const strength = await generateStrength(dim, result.band, evidence);
      if (strength) strengths.push(strength);
    })
  );

  // ── Open questions (insufficient-signal priority dimensions) ──────────────
  const openQuestionDims = priorityDims.filter((dim) => {
    const band = dimensions[dim]?.band;
    return band === "insufficient_signal" || band === "limited_signal";
  });

  const openQuestions: string[] = [];
  await Promise.all(
    openQuestionDims.slice(0, 3).map(async (dim) => {
      const result = dimensions[dim];
      const whyInsufficient =
        result?.band === "insufficient_signal"
          ? "Aucun élément comportemental noté et signal à choix forcé insuffisant."
          : "Éléments de preuve limités : une seule source a contribué.";
      const q = await generateOpenQuestion(dim, whyInsufficient);
      if (q) openQuestions.push(q);
    })
  );

  // ── Follow-up interview questions (Phase 2) ──────────────────────────────
  let followUpQuestions: FollowUpQuestions | undefined;
  try {
    followUpQuestions = await generateAllFollowUpQuestions(
      synthesis,
      itemScores,
      psychoAnswers,
      psychoItems,
      roleAnswers ?? {},
      jobTitle
    );
  } catch {
    // Non-fatal: questions omitted if generation fails
  }

  return {
    dimensionSummaries,
    roleFitRationale,
    confidenceRationale,
    strengths: strengths.filter(Boolean),
    openQuestions: openQuestions.filter(Boolean),
    followUpQuestions,
  };
}
