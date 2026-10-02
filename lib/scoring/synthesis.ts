/**
 * Phase 1 synthesis layer — deterministic computation only.
 *
 * Takes per-item scoring data + psychometric scores and produces:
 *   - Dimension-level bands (6 core dimensions)
 *   - Pattern flags (convergence, contradiction, role-fit concerns)
 *   - Role-fit read (scored from priority dimensions + flag downgrades)
 *   - FC rank-order prose
 *   - Motivation profile
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type DimensionBand =
  | "unusually_strong"
  | "strong_positive"
  | "moderate_positive"
  | "mixed"
  | "limited_signal"
  | "insufficient_signal"
  | "concern";

export type ConfidenceLevel = "rich_signal" | "moderate_signal" | "limited_signal";

// Job titles are typed by hand in the admin form, in whatever language the
// recruiter writes them in, so role detection matches both spellings. Accented
// and unaccented French are both accepted because recruiters paste from anywhere.
export const CEO_TITLE_RE =
  /\b(ceo|pdg|d[qg]|chief executive|directeur général|directrice générale|directeur general|directrice generale)\b/i;

export const MARKETING_ENGINEER_TITLE_RE =
  /\b(marketing engineer|ingénieur marketing|ingenieur marketing)\b/i;

export type RoleFitBand =
  | "Strong fit"
  | "Likely fit"
  | "Mixed fit"
  | "Weak fit"
  | "Likely mis-fit";

export type DimensionResult = {
  band: DimensionBand;
  confidence: ConfidenceLevel;
  contributingItems: string[];
  conflictNote: string | null;
  starBand: DimensionBand | null;
  fcTally: number;
  fcMax: number;
};

export type PatternFlag = {
  id: string;
  ruleName: string;
  severity: "high" | "medium" | "operational";
  label: string;
  description: string;
  contributingItems: Array<{ itemId: string; sectionLabel: string; excerpt: string }>;
};

export type RoleFitRead = {
  band: RoleFitBand;
  score: number;
  priorityDimensionScores: Array<{ dimension: string; band: DimensionBand; score: number }>;
  flagDowngrades: number;
};

export type MotivationProfile = {
  topMotivators: string[];
  bottomMotivator: string;
  t1Ranking: string[];
  roleAlignmentNote: string | null;
  fcContributions: Record<string, number>;
};

export type InterpersonalProfile = {
  directness: "direct" | "hedged" | "unclear";
  conflictApproach: "engages" | "avoids" | "mixed";
  regardForOthers: "respectful" | "dismissive" | "defensive";
  followThrough: "tracked" | "absent";
};

export type FollowUpQuestions = {
  byFlag: Record<string, string>;       // flag.id → question
  byDimension: Record<string, string>;  // dimension key → question
  topThree: string[];                   // ranked top 3 for interview focus panel
};

export type SynthesisResult = {
  dimensions: Record<string, DimensionResult>;
  flags: PatternFlag[];
  roleFitRead: RoleFitRead;
  fcRankOrderProse: string;
  motivationProfile: MotivationProfile;
  interpersonalProfile: InterpersonalProfile | null;
  overallConfidence: "rich_signal" | "moderate_signal" | "limited_signal";
  overallConfidenceDescription: string;
  computedAt: string;
  prose?: {
    dimensionSummaries: Record<string, string>;
    roleFitRationale: string;
    confidenceRationale: string;
    strengths: string[];
    openQuestions: string[];
    followUpQuestions?: FollowUpQuestions;
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

// Max possible FC tallies per dimension (how many FC items load on that dimension)
const FC_MAX: Record<string, number> = {
  conscientiousness: 6,   // C-F1, C-F4, C-F5, C-F8, C-F10, C-F11
  honesty_humility: 4,    // C-F2, C-F5, C-F9, C-F12
  composure: 2,           // C-F3, C-F10
  learning: 4,            // C-F1, C-F3, C-F6, C-F11
  interpersonal: 5,       // C-F2, C-F6, C-F8, C-F9, C-F12
  motivation: 4,          // C-F4, C-F7, C-F9, C-F13
};

const STAR_PRIMARY: Record<string, string> = {
  conscientiousness: "C-S1",
  honesty_humility: "C-S2",
  learning: "C-S3",
  interpersonal: "C-S4",
};

const CC_FOR_DIMENSION: Record<string, string> = {
  conscientiousness: "C-CC1",
  honesty_humility: "C-CC2",
};

const T2_DIMENSION_CONTRIBUTIONS: string[] = ["honesty_humility", "conscientiousness"];

const HIGH_AMBIGUITY_ROLES = ["Marketing Engineer", "CEO"];

// ─── Band scoring ─────────────────────────────────────────────────────────────

const STAR_BAND_RANK: Record<string, number> = {
  unusually_strong: 5,
  strong_positive: 4,
  moderate_positive: 3,
  mixed: 2,
  limited_signal: 1,
  insufficient_signal: 0,
  scoring_failed: 0,
  profile: 0,        // C-S4's special band — excluded from numeric comparisons
  concern_flag: 0,
  concern: 0,
};

function fcSignalLevel(tally: number, max: number): "strong" | "moderate" | "weak" {
  if (max === 0) return "weak";
  const ratio = tally / max;
  if (ratio >= 0.60) return "strong";
  if (ratio >= 0.35) return "moderate";
  return "weak";
}

// ─── Dimension band aggregation ───────────────────────────────────────────────
//
// Aggregation table (base, before rubric overrides):
//   STAR ≥ strong_positive (rank 4-5):
//     + FC strong → same as STAR band, rich_signal
//     + FC moderate → strong_positive, rich_signal
//     + FC weak → strong_positive, moderate_signal
//
//   STAR = moderate_positive (rank 3):
//     + FC strong → strong_positive, moderate_signal
//     + FC moderate → moderate_positive, moderate_signal
//     + FC weak → limited_signal, limited_signal
//
//   STAR = mixed (rank 2):
//     + FC strong → moderate_positive, moderate_signal (conflict note added)
//     + FC moderate → moderate_positive, limited_signal
//     + FC weak → mixed, moderate_signal
//
//   STAR = limited_signal (rank 1):
//     + FC strong → moderate_positive, moderate_signal
//     + FC moderate → moderate_positive, limited_signal
//     + FC weak → limited_signal, limited_signal
//
//   STAR = missing/failed (rank 0):
//     + FC strong → limited_signal, limited_signal
//     + FC moderate/weak → insufficient_signal, limited_signal
//
// Rubric feature overrides (applied after base aggregation):
//   H-H: If STAR rubric shows reshaped/avoided mistake AND T2 is negative AND CC2≥4 AND FC=weak → concern, rich_signal
//   Conscientiousness: If STAR rubric shows external attribution AND CC1≥4 → cap band at mixed
//   Learning: If STAR rubric shows performative shift → cap band at limited_signal

type StarFeatures = Record<string, { value: string }> | null | undefined;

function aggregateDimension(
  dimension: string,
  starBandRaw: string | null,
  fcTally: number,
  fcMax: number,
  ccValue: number | undefined,
  t2Contribution: number | undefined,
  starFeatures?: StarFeatures
): Omit<DimensionResult, "contributingItems"> {
  const fcLevel = fcSignalLevel(fcTally, fcMax);
  const starRank = starBandRaw ? (STAR_BAND_RANK[starBandRaw] ?? 0) : 0;
  const starBand = (starBandRaw && starBandRaw !== "profile" && starBandRaw !== "concern_flag" && starBandRaw !== "concern")
    ? starBandRaw as DimensionBand
    : null;

  let band: DimensionBand = "insufficient_signal";
  let confidence: ConfidenceLevel = "limited_signal";
  let conflictNote: string | null = null;

  if (starRank >= 4) {
    if (fcLevel === "strong") {
      band = starRank === 5 ? "unusually_strong" : "strong_positive";
      confidence = "rich_signal";
    } else if (fcLevel === "moderate") {
      band = "strong_positive";
      confidence = "rich_signal";
    } else {
      band = "strong_positive";
      confidence = "moderate_signal";
    }
  } else if (starRank === 3) {
    if (fcLevel === "strong") {
      band = "strong_positive";
      confidence = "moderate_signal";
    } else if (fcLevel === "moderate") {
      band = "moderate_positive";
      confidence = "moderate_signal";
    } else {
      band = "limited_signal";
      confidence = "limited_signal";
    }
  } else if (starRank === 2) {
    if (fcLevel === "strong") {
      band = "moderate_positive";
      confidence = "moderate_signal";
      conflictNote = "La préférence en choix forcé est forte, la réponse comportementale est mitigée : divergence à explorer.";
    } else if (fcLevel === "moderate") {
      band = "moderate_positive";
      confidence = "limited_signal";
    } else {
      band = "mixed";
      confidence = "moderate_signal";
    }
  } else if (starRank === 1) {
    if (fcLevel === "strong") {
      band = "moderate_positive";
      confidence = "moderate_signal";
    } else if (fcLevel === "moderate") {
      band = "moderate_positive";
      confidence = "limited_signal";
    } else {
      band = "limited_signal";
      confidence = "limited_signal";
    }
  } else {
    // No STAR data (missing, failed, or "profile")
    if (fcLevel === "strong") {
      band = "limited_signal";
      confidence = "limited_signal";
    } else {
      band = "insufficient_signal";
      confidence = "limited_signal";
    }
  }

  // T2 contribution: a strongly negative T2 choice can nudge a strong band down one step
  if (t2Contribution !== undefined && t2Contribution < 0 && (band === "strong_positive" || band === "unusually_strong")) {
    band = "moderate_positive";
    conflictNote = (conflictNote ?? "") + " La réponse au scénario va à l’encontre des éléments positifs.";
  }

  // CC annotations (note added; band change only via rubric overrides below)
  if (dimension === "conscientiousness" && ccValue !== undefined && ccValue >= 4) {
    conflictNote = `Déclaration de tâches laissées inachevées (C-CC1 = ${ccValue}/5) : voir le panneau des motifs pour l’analyse de cohérence.`;
  }
  if (dimension === "honesty_humility" && ccValue !== undefined && ccValue >= 4) {
    if (STAR_BAND_RANK[band] >= 3) {
      conflictNote = `C-CC2 = ${ccValue}/5 associé à des signaux positifs : signal prévu pour recueillir un aveu honnête de contradiction. À recouper avec le panneau des motifs.`;
    } else {
      conflictNote = `La déclaration d’un travail surestimé (C-CC2 = ${ccValue}/5) converge avec d’autres signaux : voir le panneau des motifs.`;
    }
  }

  // ── Rubric-feature concern overrides ─────────────────────────────────────────
  // These fire when underlying rubric features contradict or override the base band.
  if (starFeatures) {
    // H-H: concern when all signals converge negatively
    if (dimension === "honesty_humility") {
      const genuineness = starFeatures["mistake_genuineness"]?.value;
      const allNegative =
        (genuineness === "minor_or_reshaped" || genuineness === "avoided") &&
        (t2Contribution === undefined || t2Contribution <= -1) &&
        (ccValue === undefined || ccValue >= 4) &&
        fcLevel === "weak";
      if (allNegative) {
        band = "concern";
        confidence = "rich_signal";
        conflictNote =
          "Tous les signaux contributeurs convergent dans le même sens négatif : l’erreur a été reformulée ou évitée dans la réponse comportementale, " +
          "le scénario a retenu une divulgation non transparente et le contrôle de cohérence indique un schéma récurrent de travail surestimé.";
      }
    }

    // Conscientiousness: cap at mixed when STAR rubric and CC both contradict positive FC
    if (dimension === "conscientiousness") {
      const attribution = starFeatures["attribution_pattern"]?.value;
      const ownership = starFeatures["problem_ownership"]?.value;
      if (
        attribution === "external" &&
        (ownership === "shared" || ownership === "externalized") &&
        ccValue !== undefined &&
        ccValue >= 4 &&
        (band === "moderate_positive" || band === "strong_positive" || band === "unusually_strong")
      ) {
        band = "mixed";
        conflictNote =
          `Le schéma en choix forcé est positif (FC : ${fcTally}/${fcMax}), mais l’item comportemental a montré une attribution externe ` +
          `et une responsabilité partagée ou externalisée, et C-CC1=${ccValue}/5 suggère que ce schéma ne tiendrait pas sous pression. ` +
          `Les signaux se contredisent : le choix forcé et la grille STAR pointent en sens opposés.`;
      }
    }

    // Learning: cap at limited_signal when the belief-update was identified as performative
    if (dimension === "learning") {
      const natureOfShift = starFeatures["nature_of_shift"]?.value;
      if (natureOfShift === "performative" && STAR_BAND_RANK[band] > 1) {
        band = "limited_signal";
        confidence = "limited_signal";
        conflictNote =
          "La mise à jour de croyance déclarée a été qualifiée de performative plutôt que sincère : la bande affichée est probablement un artefact de cadrage.";
      }
    }
  }

  return { band, confidence, conflictNote, starBand: starBand as DimensionBand | null, fcTally, fcMax };
}

// ─── Main dimension computation ────────────────────────────────────────────────

export type ItemScoreData = {
  itemId: string;
  bandEstimate: string;
  status: string;
  features: Record<string, { value: string; justification?: string; supporting_excerpt?: string }> | null;
};

export type PsychoScoresData = {
  fcTallies?: Record<string, number>;
  t2Scores?: Record<string, number>;
  t1Ranking?: string[];
  ccValues?: Record<string, number>;
};

export function computeDimensionBands(
  itemScores: ItemScoreData[],
  psychoScores: PsychoScoresData
): Record<string, DimensionResult> {
  const fcTallies = psychoScores.fcTallies ?? {};
  const ccValues = psychoScores.ccValues ?? {};
  const t2Scores = psychoScores.t2Scores ?? {};

  const starByItemId = new Map<string, ItemScoreData>();
  for (const s of itemScores) {
    if (!starByItemId.has(s.itemId)) starByItemId.set(s.itemId, s);
  }

  const result: Record<string, DimensionResult> = {};

  const scoredDimensions = ["conscientiousness", "honesty_humility", "composure", "learning", "interpersonal"] as const;

  for (const dim of scoredDimensions) {
    const primaryStarItemId = STAR_PRIMARY[dim];
    const starScore = primaryStarItemId ? starByItemId.get(primaryStarItemId) : undefined;
    // Only use the STAR band if successfully scored; skip if "profile", "concern_flag", or failed
    const starBand =
      starScore?.status === "scored" &&
      starScore.bandEstimate !== "profile" &&
      starScore.bandEstimate !== "concern_flag"
        ? starScore.bandEstimate
        : null;

    // Pass rubric features to aggregateDimension for concern overrides
    const starFeatures = (starScore?.status === "scored" && starScore.features) ? starScore.features : null;

    const fc = fcTallies[dim] ?? 0;
    const fcMax = FC_MAX[dim] ?? 0;
    const cc = ccValues[CC_FOR_DIMENSION[dim] ?? ""];
    const t2 = T2_DIMENSION_CONTRIBUTIONS.includes(dim) ? t2Scores[dim] : undefined;

    const agg = aggregateDimension(dim, starBand, fc, fcMax, cc, t2, starFeatures);

    const contributing: string[] = [];
    if (primaryStarItemId && starScore?.status === "scored" && starBand) {
      contributing.push(primaryStarItemId);
    }
    if (fc > 0) contributing.push(`FC (${dim} tally: ${fc}/${fcMax})`);
    if (cc !== undefined) contributing.push(CC_FOR_DIMENSION[dim]!);
    if (t2 !== undefined) contributing.push("C-T2");

    // ── Composure special case: secondary contributions from C-S1, C-S2, C-S4 ──
    if (dim === "composure") {
      const s1 = starByItemId.get("C-S1");
      const s2 = starByItemId.get("C-S2");
      const s4 = starByItemId.get("C-S4");

      // Only use secondary items that are properly scored with standard bands
      const secondaryScores = [s1, s2, s4].filter(
        (s) =>
          s?.status === "scored" &&
          s.bandEstimate !== "profile" &&
          s.bandEstimate !== "concern_flag" &&
          s.bandEstimate !== "scoring_failed"
      );

      if (secondaryScores.length > 0) {
        contributing.push(...secondaryScores.map((s) => `${s!.itemId} (secondaire)`));
      }

      // If no primary STAR for composure, synthesise from secondaries
      if (!starBand && secondaryScores.length > 0) {
        const avgRank =
          secondaryScores.reduce((sum, s) => sum + (STAR_BAND_RANK[s!.bandEstimate] ?? 0), 0) /
          secondaryScores.length;
        const fcLevel = fcSignalLevel(fc, fcMax);
        if (avgRank >= 3.5 && fcLevel !== "weak") {
          agg.band = "moderate_positive";
          agg.confidence = "moderate_signal";
        } else if (avgRank >= 3.0) {
          agg.band = "limited_signal";
          agg.confidence = "limited_signal";
        }
        // else keep insufficient_signal
      }
    }

    result[dim] = { ...agg, contributingItems: contributing };
  }

  return result;
}

// ─── Pattern flag detection ────────────────────────────────────────────────────

function getStarFeature(itemScores: ItemScoreData[], itemId: string, featureName: string): string | null {
  const score = itemScores.find((s) => s.itemId === itemId && s.status === "scored");
  return score?.features?.[featureName]?.value ?? null;
}

export function detectPatterns(
  itemScores: ItemScoreData[],
  psychoScores: PsychoScoresData,
  jobTitle: string,
  dimensionBands: Record<string, DimensionResult>,
  roleAnswers: Record<string, string>
): PatternFlag[] {
  const flags: PatternFlag[] = [];
  const fcTallies = psychoScores.fcTallies ?? {};
  const ccValues = psychoScores.ccValues ?? {};
  const t1Ranking = psychoScores.t1Ranking ?? [];
  const t2Choice = (psychoScores as Record<string, unknown>)._t2Choice as string | undefined;

  const cc1 = ccValues["C-CC1"];
  const cc2 = ccValues["C-CC2"];
  const consFC = fcTallies.conscientiousness ?? 0;

  // ── Flag 1: SELF_REPORT_DIVERGENCE_COMMITMENT ─────────────────────────────
  {
    const s1Band = dimensionBands.conscientiousness?.starBand;
    const s1Positive = s1Band && ["strong_positive", "unusually_strong", "moderate_positive"].includes(s1Band);
    const s1Ownership = getStarFeature(itemScores, "C-S1", "problem_ownership");

    if (
      cc1 !== undefined &&
      cc1 >= 4 &&
      (consFC >= 2 || s1Positive || s1Ownership === "owned")
    ) {
      flags.push({
        id: "SELF_REPORT_DIVERGENCE_COMMITMENT",
        ruleName: "SELF_REPORT_DIVERGENCE_COMMITMENT",
        severity: "high",
        label: "La déclaration diverge sur l’engagement et la tenue dans l’exécution",
        description:
          `Le candidat reconnaît « laisser parfois des tâches inachevées lorsqu’il perd intérêt » (C-CC1 = ${cc1}/5), ` +
          `mais ses réponses en choix forcé${s1Positive || s1Ownership === "owned" ? " et les éléments comportementaux" : ""} suggèrent l’inverse. ` +
          `À creuser avec un exemple précis d’un projet qu’il n’a pas mené à terme.`,
        contributingItems: [
          { itemId: "C-CC1", sectionLabel: "Contrôle de cohérence : engagement", excerpt: `Auto-évaluation : ${cc1}/5` },
          ...(s1Positive || s1Ownership === "owned"
            ? [{ itemId: "C-S1", sectionLabel: "Partie 1 : une réalisation récente", excerpt: `Responsabilité : ${s1Ownership ?? s1Band}` }]
            : []),
        ],
      });
    }
  }

  // ── Flag 2: INTEGRITY_PATTERN_CONCERN ─────────────────────────────────────
  {
    const s2Ownership = getStarFeature(itemScores, "C-S2", "ownership");
    const s2Genuineness = getStarFeature(itemScores, "C-S2", "mistake_genuineness");
    const s2Disclosure = getStarFeature(itemScores, "C-S2", "disclosure_behavior");

    const lowTransparencyT2 = t2Choice === "C" || t2Choice === "D";
    const s2Concern =
      s2Ownership === "externalized" ||
      s2Ownership === "partial" ||
      s2Genuineness === "minor_or_reshaped" ||
      s2Genuineness === "avoided" ||
      s2Disclosure === "concealed_or_unclear";

    if (cc2 !== undefined && cc2 >= 4 && lowTransparencyT2 && s2Concern) {
      flags.push({
        id: "INTEGRITY_PATTERN_CONCERN",
        ruleName: "INTEGRITY_PATTERN_CONCERN",
        severity: "high",
        label: "Schéma convergent sur la transparence et la responsabilité",
        description:
          `Plusieurs items vont dans le même sens : déclaration d’un travail surestimé (C-CC2 = ${cc2}/5), ` +
          `réponse non transparente au scénario (C-T2, option ${t2Choice ?? "?"}) et ` +
          (s2Ownership === "externalized"
            ? "attribution externalisée de l’erreur dans la réponse comportementale."
            : s2Genuineness === "minor_or_reshaped" || s2Genuineness === "avoided"
            ? "reformulation ou évitement de l’erreur dans la réponse comportementale."
            : "comportement de divulgation flou dans la réponse comportementale.") +
          " Il s’agit d’un schéma d’alerte majeur pour tout poste exigeant une restitution honnête. À creuser explicitement en entretien.",
        contributingItems: [
          { itemId: "C-CC2", sectionLabel: "Contrôle de cohérence : transparence", excerpt: `Auto-évaluation : ${cc2}/5` },
          { itemId: "C-T2", sectionLabel: "Scénario d’intégrité", excerpt: `Option retenue : ${t2Choice ?? "?"}` },
          { itemId: "C-S2", sectionLabel: "Partie 3 : une erreur commise", excerpt: `Responsabilité : ${s2Ownership ?? "?"}, divulgation : ${s2Disclosure ?? "?"}` },
        ],
      });
    }
  }

  // ── Flag 3: EXTERNAL_ATTRIBUTION_PATTERN ─────────────────────────────────
  {
    const s1Attribution = getStarFeature(itemScores, "C-S1", "attribution_pattern");
    const s2Ownership = getStarFeature(itemScores, "C-S2", "ownership");
    const s2Genuineness = getStarFeature(itemScores, "C-S2", "mistake_genuineness");
    const s4Tone = getStarFeature(itemScores, "C-S4", "tone_about_other_person");

    const externalItems: Array<{ itemId: string; sectionLabel: string; excerpt: string }> = [];

    if (s1Attribution === "external") {
      externalItems.push({
        itemId: "C-S1",
        sectionLabel: "Partie 1 : une réalisation récente",
        excerpt: "Attribution externe relevée dans l’évaluation par grille.",
      });
    }
    if (s2Ownership === "externalized") {
      externalItems.push({
        itemId: "C-S2",
        sectionLabel: "Partie 3 : une erreur commise",
        excerpt: "Responsabilité externalisée dans l’évaluation par grille.",
      });
    }
    if (s4Tone === "dismissive") {
      externalItems.push({
        itemId: "C-S4",
        sectionLabel: "Partie 8 : un retour difficile",
        excerpt: "Ton dévalorisant envers l’autre personne dans l’évaluation par grille.",
      });
    }

    // Extended trigger: C-S1=external + C-S2 reframed + CC2≥4 (converging honesty-transparency concern)
    // The CC2 threshold ties this to the broader transparency pattern, not just a single reframed answer.
    const s1External = s1Attribution === "external";
    const s2Reshaped = s2Genuineness === "minor_or_reshaped" || s2Genuineness === "avoided";
    const alreadyHasS2 = externalItems.some((e) => e.itemId === "C-S2");
    if (s1External && s2Reshaped && (cc2 !== undefined && cc2 >= 4) && !alreadyHasS2 && externalItems.length < 2) {
      externalItems.push({
        itemId: "C-S2",
        sectionLabel: "Partie 3 : une erreur commise",
        excerpt: "Erreur reformulée ou minimisée : cohérent avec le schéma d’externalisation observé en partie 1.",
      });
    }

    if (externalItems.length >= 2) {
      flags.push({
        id: "EXTERNAL_ATTRIBUTION_PATTERN",
        ruleName: "EXTERNAL_ATTRIBUTION_PATTERN",
        severity: "high",
        label: "Attribution externe constante sur les items comportementaux",
        description:
          `Sur ${externalItems.length} items comportementaux, le candidat attribue les problèmes principalement aux autres ` +
          `ou aux circonstances plutôt qu’à ses propres décisions. ` +
          `À examiner de près et à confronter au contexte du poste : ce schéma y serait-il tenable ?`,
        contributingItems: externalItems,
      });
    }
  }

  // ── Flag 4: SPECIFICITY_DEFICIT ────────────────────────────────────────────
  {
    const lowSpecItems: Array<{ itemId: string; sectionLabel: string; reason: string }> = [];

    // C-S1: check specificity == "low" OR first_person_agency == "low"
    const s1Spec = getStarFeature(itemScores, "C-S1", "specificity");
    const s1Agency = getStarFeature(itemScores, "C-S1", "first_person_agency");
    if (s1Spec === "low") {
      lowSpecItems.push({ itemId: "C-S1", sectionLabel: "Partie 1 : une réalisation récente", reason: "specificity=low" });
    } else if (s1Agency === "low") {
      lowSpecItems.push({ itemId: "C-S1", sectionLabel: "Partie 1 : une réalisation récente", reason: "first_person_agency=low" });
    }

    // C-S2: check for specificity proxies — externalized/partial ownership or generic reflection
    // "partial" ownership (shared blame, "we underestimated...") often signals vague, non-specific responses
    const s2OwnershipSpec = getStarFeature(itemScores, "C-S2", "ownership");
    const s2Reflection = getStarFeature(itemScores, "C-S2", "reflection_quality");
    if (s2OwnershipSpec === "externalized" || s2OwnershipSpec === "partial" || s2Reflection === "generic") {
      const s2Reason = s2Reflection === "generic" ? "reflection_quality=generic" : `ownership=${s2OwnershipSpec}`;
      lowSpecItems.push({ itemId: "C-S2", sectionLabel: "Partie 3 : une erreur commise", reason: s2Reason });
    }

    // C-S3: check specificity_of_original_view == "low"
    const s3SpecView = getStarFeature(itemScores, "C-S3", "specificity_of_original_view");
    if (s3SpecView === "low") {
      lowSpecItems.push({ itemId: "C-S3", sectionLabel: "Partie 5 : un changement d’avis", reason: "specificity_of_original_view=low" });
    }

    if (lowSpecItems.length >= 2) {
      flags.push({
        id: "SPECIFICITY_DEFICIT",
        ruleName: "SPECIFICITY_DEFICIT",
        severity: "medium",
        label: "Les réponses comportementales manquent systématiquement de précision",
        description:
          `Sur ${lowSpecItems.length} items comportementaux, le candidat a donné des descriptions abstraites ou génériques ` +
          `plutôt que des récits concrets et précis. ` +
          `Cela peut traduire une introspection faible, une faible prise d’impact dans les situations décrites ou un défaut de préparation. ` +
          `À relancer avec des questions ciblées du type « dites-moi exactement ce que vous avez fait ensuite ».`,
        contributingItems: lowSpecItems.map((e) => ({
          itemId: e.itemId,
          sectionLabel: e.sectionLabel,
          excerpt: `Signal de grille : ${e.reason}`,
        })),
      });
    }
  }

  // Track whether mission-last fired (used to suppress stability flag for CEO)
  let missionFired = false;

  // ── Flag 5: ROLE_MISALIGNED_MOTIVATION_CEO ────────────────────────────────
  {
    const isCEORole = CEO_TITLE_RE.test(jobTitle);
    if (isCEORole && t1Ranking.length >= 3) {
      const missionPos = t1Ranking.indexOf("mission");
      if (missionPos >= 2) {
        missionFired = true;
        flags.push({
          id: "ROLE_MISALIGNED_MOTIVATION_CEO",
          ruleName: "ROLE_MISALIGNED_MOTIVATION_CEO",
          severity: "medium",
          label: "Mission classée bas pour un rôle de direction porté par la mission",
          description:
            `Le candidat a classé la mission ${missionPos + 1} sur 4 dans l’arbitrage de motivation. ` +
            `Pour un rôle de direction (CEO) dans une organisation portée par sa mission, ce point mérite d’être creusé : ` +
            `ce n’est pas éliminatoire, mais l’entretien doit vérifier que la motivation réelle s’aligne sur le poste.`,
          contributingItems: [
            { itemId: "C-T1", sectionLabel: "Classement des arbitrages de motivation", excerpt: `T1: ${t1Ranking.join(" > ")}` },
          ],
        });
      }
    }
  }

  // ── Flag 6: ROLE_MISALIGNED_MOTIVATION_STABILITY ─────────────────────────
  {
    const isHighAmbiguityRole = HIGH_AMBIGUITY_ROLES.some((r) =>
      jobTitle.toLowerCase().includes(r.toLowerCase())
    );
    const isCEO = CEO_TITLE_RE.test(jobTitle);

    // For CEO: suppress stability flag when mission-last already fired
    if (isHighAmbiguityRole && !(isCEO && missionFired) && t1Ranking.length >= 2) {
      const stabilityPos = t1Ranking.indexOf("stability");
      if (stabilityPos <= 1) {
        flags.push({
          id: "ROLE_MISALIGNED_MOTIVATION_STABILITY",
          ruleName: "ROLE_MISALIGNED_MOTIVATION_STABILITY",
          severity: "medium",
          label: "Stabilité classée haut pour un rôle à forte ambiguïté",
          description:
            `Le candidat classe la stabilité parmi ses ${stabilityPos + 1} premiers moteurs de motivation. ` +
            `Ce poste implique une forte ambiguïté et une grande autonomie. ` +
            `À vérifier en entretien : le candidat a-t-il connu des réussites dans des environnements moins structurés ?`,
          contributingItems: [
            { itemId: "C-T1", sectionLabel: "Classement des arbitrages de motivation", excerpt: `T1: ${t1Ranking.join(" > ")}` },
          ],
        });
      }
    }
  }

  // ── Flag 7: ROLE_FIT_MISMATCH_MARKETING_ENG ──────────────────────────────
  {
    const isMarketingEng = MARKETING_ENGINEER_TITLE_RE.test(jobTitle);
    if (isMarketingEng) {
      const allRoleText = Object.values(roleAnswers).join(" ").toLowerCase();
      const noAISignals =
        !allRoleText.includes("ai ") &&
        !allRoleText.includes("a.i.") &&
        !allRoleText.includes("automation") &&
        !allRoleText.includes("chatgpt") &&
        !allRoleText.includes("claude") &&
        !allRoleText.includes("workflow") &&
        !allRoleText.includes("script") &&
        !allRoleText.includes("python") &&
        !allRoleText.includes("zapier") &&
        !allRoleText.includes("openai") &&
        !allRoleText.includes("make.com") &&
        !allRoleText.includes("n8n") &&
        !allRoleText.includes("llm") &&
        !allRoleText.includes("machine learning");

      const traditionalSignal =
        allRoleText.includes("authentic") ||
        allRoleText.includes("human connection") ||
        allRoleText.includes("local event") ||
        allRoleText.includes("personal relationship") ||
        allRoleText.includes("relying on technology") ||
        allRoleText.includes("technical knowledge") ||
        allRoleText.includes("genuine messages") ||
        allRoleText.includes("without relying on");

      if (noAISignals && traditionalSignal) {
        flags.push({
          id: "ROLE_FIT_MISMATCH_MARKETING_ENG",
          ruleName: "ROLE_FIT_MISMATCH_MARKETING_ENG",
          severity: "high",
          label: "Le profil du candidat ne correspond pas à la posture d’ingénieur attendue sur ce poste",
          description:
            `Le poste de Marketing Engineer exige une aisance avec l’IA et un instinct de construction. ` +
            `Les réponses du candidat montrent une orientation marketing traditionnelle, sans le cadre technique ni la priorité donnée à l’IA. ` +
            `Il s’agit d’un décalage avec le poste, pas nécessairement d’une faiblesse.`,
          contributingItems: [
            { itemId: "ROLE_Q", sectionLabel: "Questions propres au poste", excerpt: "Aucun élément lié à l’IA ou à l’automatisation dans les réponses." },
          ],
        });
      }
    }
  }

  // ── Flag 8: TECHNICAL_WITHOUT_DOMAIN_MARKETING_ENG ────────────────────────
  {
    const isMarketingEng = MARKETING_ENGINEER_TITLE_RE.test(jobTitle);
    const alreadyHasMismatch = flags.some((f) => f.id === "ROLE_FIT_MISMATCH_MARKETING_ENG");
    if (isMarketingEng && !alreadyHasMismatch) {
      const allRoleText = Object.values(roleAnswers).join(" ").toLowerCase();
      const hasTechnicalFocus =
        allRoleText.includes("infrastructure") ||
        allRoleText.includes("tracking infra") ||
        allRoleText.includes("a/b test") ||
        allRoleText.includes("measurement system") ||
        allRoleText.includes("analytics tool") ||
        allRoleText.includes("database") ||
        allRoleText.includes("transformer architecture") ||
        allRoleText.includes("fine-tun") ||
        allRoleText.includes("retrieval augmented");

      const lacksCreativeSignal =
        !allRoleText.includes("target audience") &&
        !allRoleText.includes("audience segment") &&
        !allRoleText.includes("brand voice") &&
        !allRoleText.includes("brand narrative") &&
        !allRoleText.includes("creative brief") &&
        !allRoleText.includes("creative direction") &&
        !allRoleText.includes("storytell") &&
        !allRoleText.includes("tone of voice") &&
        !allRoleText.includes("headline") &&
        !allRoleText.includes("copywriting") &&
        !allRoleText.includes("user persona") &&
        !allRoleText.includes("customer journey") &&
        !allRoleText.includes("campaign concept") &&
        !allRoleText.includes("campaign idea");

      if (hasTechnicalFocus && lacksCreativeSignal) {
        flags.push({
          id: "TECHNICAL_WITHOUT_DOMAIN_MARKETING_ENG",
          ruleName: "TECHNICAL_WITHOUT_DOMAIN_MARKETING_ENG",
          severity: "high",
          label: "Force technique sans instinct marketing ni créatif",
          description:
            `Le candidat démontre une capacité technique, mais ses réponses aux questions propres au poste portent sur l’infrastructure, ` +
            `la mesure et les outils plutôt que sur l’audience, le message ou la direction créative. ` +
            `Profil solide pour un poste d’ingénierie, décalage probable pour le poste de Marketing Engineer.`,
          contributingItems: [
            { itemId: "ROLE_Q", sectionLabel: "Questions propres au poste", excerpt: "Cadrage technique sans raisonnement sur l’audience ou le créatif." },
          ],
        });
      }
    }
  }

  // ── Flag 9: ROLE_DIRECTION_MISMATCH_TRADITIONAL_MARKETER_ME ──────────────
  {
    const isMarketingEngNew = MARKETING_ENGINEER_TITLE_RE.test(jobTitle);
    const alreadyHasDirectionFlag = flags.some((f) =>
      f.id === "ROLE_FIT_MISMATCH_MARKETING_ENG" || f.id === "TECHNICAL_WITHOUT_DOMAIN_MARKETING_ENG"
    );

    if (isMarketingEngNew && !alreadyHasDirectionFlag) {
      const allRoleTextNew = Object.values(roleAnswers).join(" ").toLowerCase();

      // Explicit rejection of tech-first or AI-first approach
      const techAversionSignal =
        allRoleTextNew.includes("relying on technology") ||
        allRoleTextNew.includes("without relying on") ||
        allRoleTextNew.includes("authentic human connection") ||
        allRoleTextNew.includes("human connection will always") ||
        allRoleTextNew.includes("don't require too much technical") ||
        allRoleTextNew.includes("prefer to focus on understanding") ||
        (allRoleTextNew.includes("genuine") && allRoleTextNew.includes("rather than")) ||
        allRoleTextNew.includes("intuitive and don");

      // No evidence of technical tooling or active AI use
      // Intentionally broad "i built"/"i wrote" are excluded — a traditional marketer may say
      // "I built a content calendar" or "I wrote copy", which are not technical tooling signals.
      // We target specific technical indicators: automation platforms, AI tools, scripting languages.
      const noBuiltToolingNew =
        !allRoleTextNew.includes("automation") &&
        !allRoleTextNew.includes(" script") &&        // " script" avoids "description" substring
        !allRoleTextNew.includes("python") &&
        !allRoleTextNew.includes("api ") &&
        !allRoleTextNew.includes("zapier") &&
        !allRoleTextNew.includes("n8n") &&
        !allRoleTextNew.includes("make.com") &&
        !allRoleTextNew.includes("using ai") &&
        !allRoleTextNew.includes("ai to ") &&
        !allRoleTextNew.includes("llm") &&
        !allRoleTextNew.includes("chatgpt") &&
        !allRoleTextNew.includes("claude") &&
        !allRoleTextNew.includes("openai") &&
        !allRoleTextNew.includes("workflow") &&
        !allRoleTextNew.includes("no-code tool") &&
        !allRoleTextNew.includes("airtable automation");

      if (techAversionSignal && noBuiltToolingNew) {
        flags.push({
          id: "ROLE_DIRECTION_MISMATCH_TRADITIONAL_MARKETER_ME",
          ruleName: "ROLE_DIRECTION_MISMATCH_TRADITIONAL_MARKETER_ME",
          severity: "high",
          label: "Décalage de direction : cadre marketing traditionnel, sans instinct IA ni automatisation",
          description:
            `Les réponses du candidat reflètent une orientation marketing traditionnelle : priorité à une relation authentique ` +
            `et à l’humain, avec une préférence assumée pour les méthodes peu technologiques. ` +
            `Le poste de Marketing Engineer suppose une priorité donnée à l’IA et une posture de construction. Il s’agit d’un décalage de direction, pas d’un manque de compétence.`,
          contributingItems: [
            {
              itemId: "ROLE_Q",
              sectionLabel: "Questions propres au poste",
              excerpt: "Préférence explicite pour une approche non technique : aucun outil construit ni usage de l’IA détecté.",
            },
          ],
        });
      }
    }
  }

  return flags;
}

// ─── Role-fit read ────────────────────────────────────────────────────────────

const DIMENSION_SCORE: Record<DimensionBand, number> = {
  unusually_strong: 2,
  strong_positive: 2,
  moderate_positive: 1,
  mixed: 0,
  limited_signal: -1,
  concern: -2,
  insufficient_signal: 0,
};

export function computeRoleFitRead(
  dimensionBands: Record<string, DimensionResult>,
  flags: PatternFlag[],
  jobTitle: string
): RoleFitRead {
  let priorityDimensions: string[];

  if (CEO_TITLE_RE.test(jobTitle)) {
    priorityDimensions = ["honesty_humility", "composure", "conscientiousness"];
  } else if (MARKETING_ENGINEER_TITLE_RE.test(jobTitle)) {
    priorityDimensions = ["learning", "conscientiousness"];
  } else {
    priorityDimensions = ["conscientiousness", "honesty_humility", "composure", "learning"];
  }

  const priorityDimensionScores = priorityDimensions.map((dim) => {
    const d = dimensionBands[dim];
    const band = d?.band ?? "insufficient_signal";
    const score = DIMENSION_SCORE[band];
    return { dimension: dim, band, score };
  });

  const baseScore = priorityDimensionScores.reduce((sum, d) => sum + d.score, 0);

  const flagDowngrades = flags.reduce((sum, f) => {
    if (f.severity === "high") return sum - 2;
    if (f.severity === "medium") return sum - 1;
    return sum;
  }, 0);

  const finalScore = baseScore + flagDowngrades;

  let band: RoleFitBand;
  if (finalScore >= 4) band = "Strong fit";
  else if (finalScore >= 2) band = "Likely fit";
  else if (finalScore >= 0) band = "Mixed fit";
  else if (finalScore >= -3) band = "Weak fit";
  else band = "Likely mis-fit";

  return { band, score: finalScore, priorityDimensionScores, flagDowngrades };
}

// ─── FC rank-order prose ─────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<string, string> = {
  conscientiousness: "Rigueur professionnelle",
  honesty_humility: "Honnêteté et humilité",
  composure: "Sang-froid",
  learning: "Orientation apprentissage",
  interpersonal: "Style relationnel",
  motivation: "Motivation",
};

export function computeFCRankOrderProse(fcTallies: Record<string, number>): string {
  const scoredDims = ["conscientiousness", "honesty_humility", "composure", "learning", "interpersonal"];
  const ranked = scoredDims
    .map((d) => ({ dim: d, tally: fcTallies[d] ?? 0, max: FC_MAX[d] ?? 0 }))
    .sort((a, b) => b.tally - a.tally || b.max - a.max);

  if (ranked.every((r) => r.tally === 0)) return "Aucune donnée de choix forcé disponible.";

  const strongest = ranked.filter((r) => r.tally > 0).slice(0, 2);
  const secondary = ranked.slice(2, 3);
  const weaker = ranked.filter((r) => r.tally === 0);

  const parts: string[] = [];
  if (strongest.length > 0) {
    parts.push(`Préférence la plus forte pour ${strongest.map((r) => DIMENSION_LABELS[r.dim]).join(" et ")}`);
  }
  if (secondary.length > 0 && secondary[0].tally > 0) {
    parts.push(`Avec ${DIMENSION_LABELS[secondary[0].dim]} en signal secondaire`);
  }
  if (weaker.length > 0) {
    parts.push(`Signal faible ou absent sur ${weaker.map((r) => DIMENSION_LABELS[r.dim]).join(", ")}`);
  }

  return parts.join(". ") + ".";
}

// ─── Motivation profile ───────────────────────────────────────────────────────

// Exported because the PDF report renders the same motivation ranking and a
// second copy of this map is how the two drift apart.
export const MOTIVATOR_LABELS: Record<string, string> = {
  autonomy: "Autonomie",
  mission: "Mission",
  scope: "Périmètre",
  stability: "Stabilité",
  recognition: "Reconnaissance",
};

export function computeMotivationProfile(
  psychoScores: PsychoScoresData,
  jobTitle: string
): MotivationProfile {
  const t1Ranking = psychoScores.t1Ranking ?? [];
  const fcTallies = psychoScores.fcTallies ?? {};

  const topMotivators = t1Ranking.slice(0, 2).map((m) => MOTIVATOR_LABELS[m] ?? m);
  const bottomMotivator =
    MOTIVATOR_LABELS[t1Ranking[t1Ranking.length - 1] ?? ""] ??
    t1Ranking[t1Ranking.length - 1] ??
    "unknown";

  let roleAlignmentNote: string | null = null;
  const isCEO = CEO_TITLE_RE.test(jobTitle);
  const isME = MARKETING_ENGINEER_TITLE_RE.test(jobTitle);
  const missionPos = t1Ranking.indexOf("mission");
  const stabilityPos = t1Ranking.indexOf("stability");

  if (isCEO && missionPos >= 2) {
    roleAlignmentNote = `Pour un rôle de direction porté par la mission, un classement de la mission à la position ${missionPos + 1} sur 4 mérite d’être approfondi en entretien.`;
  } else if (isME && stabilityPos <= 1) {
    roleAlignmentNote = `Pour un rôle à forte ambiguïté et très autonome, un classement de la stabilité à la position ${stabilityPos + 1} sur 4 mérite d’être vérifié en entretien.`;
  }

  return {
    topMotivators,
    bottomMotivator,
    t1Ranking,
    roleAlignmentNote,
    fcContributions: { motivation: fcTallies.motivation ?? 0 },
  };
}

// ─── Interpersonal profile (from C-S4 features) ───────────────────────────────

export function computeInterpersonalProfile(itemScores: ItemScoreData[]): InterpersonalProfile | null {
  const s4 = itemScores.find((s) => s.itemId === "C-S4" && s.status === "scored");
  if (!s4?.features) return null;

  const directnessRaw = s4.features["directness"]?.value ?? "unclear";
  const followThrough = s4.features["follow_through"]?.value ?? "absent";
  const toneRaw = s4.features["tone_about_other_person"]?.value ?? "respectful";
  const feedbackDelivered = s4.features["feedback_delivered"]?.value ?? "delivered";

  let conflictApproach: "engages" | "avoids" | "mixed" = "mixed";
  if (feedbackDelivered === "delivered") conflictApproach = "engages";
  else if (feedbackDelivered === "avoided") conflictApproach = "avoids";

  let regardForOthers: "respectful" | "dismissive" | "defensive" = "respectful";
  if (toneRaw === "dismissive") regardForOthers = "dismissive";
  else if (toneRaw === "defensive_about_self") regardForOthers = "defensive";

  return {
    directness: directnessRaw as "direct" | "hedged" | "unclear",
    conflictApproach,
    regardForOthers,
    followThrough: followThrough as "tracked" | "absent",
  };
}

// ─── Overall confidence ───────────────────────────────────────────────────────
//
// Confidence is a measure of evidence quantity and convergence direction —
// NOT of evidence sentiment. A converging concerning pattern is rich signal.
//
// Algorithm:
//   Rich signal:
//     - 2+ rich_signal dims + 1+ moderate_signal dim + all contributing dims converge (positive or negative)
//     - OR 1+ rich_signal dim + 2+ high-severity flags + contributing dims converge (negative)
//   Moderate signal:
//     - 1+ rich_signal dim or 2+ moderate_signal dims
//   Limited signal:
//     - Otherwise

export function computeOverallConfidence(
  dimensionBands: Record<string, DimensionResult>,
  flags: PatternFlag[]
): { level: "rich_signal" | "moderate_signal" | "limited_signal"; description: string } {
  // Only count dimensions that produced actual signal (not insufficient_signal)
  const contributing = Object.values(dimensionBands).filter((d) => d.band !== "insufficient_signal");
  const richCount = contributing.filter((d) => d.confidence === "rich_signal").length;
  const moderateCount = contributing.filter((d) => d.confidence === "moderate_signal").length;
  const highFlags = flags.filter((f) => f.severity === "high").length;

  // Direction convergence
  const positiveBands = new Set<DimensionBand>(["unusually_strong", "strong_positive", "moderate_positive"]);
  const negativeBands = new Set<DimensionBand>(["concern", "limited_signal", "mixed"]);

  const positiveCount = contributing.filter((d) => positiveBands.has(d.band)).length;
  const negativeCount = contributing.filter((d) => negativeBands.has(d.band)).length;

  // Converges positively: most contributing dims are positive, none concerning
  const convergesPositive =
    contributing.length >= 2 &&
    positiveCount >= Math.ceil(contributing.length * 0.6) &&
    contributing.filter((d) => d.band === "concern").length === 0;

  // Converges negatively: most contributing dims are negative/concerning, none strongly positive
  const convergesNegative =
    contributing.length >= 2 &&
    negativeCount >= Math.ceil(contributing.length * 0.6) &&
    contributing.filter((d) => positiveBands.has(d.band) && d.band !== "moderate_positive").length === 0;

  let level: "rich_signal" | "moderate_signal" | "limited_signal";
  let description: string;

  const richWithPositiveConvergence = richCount >= 2 && moderateCount >= 1 && convergesPositive;
  const richWithStrictPositive = richCount >= 3 && convergesPositive;
  const richWithNegativeConvergence =
    (richCount >= 1 && highFlags >= 2 && convergesNegative) ||
    (richCount >= 1 && moderateCount >= 1 && convergesNegative);

  if (richWithPositiveConvergence || richWithStrictPositive) {
    level = "rich_signal";
    description = "Signal riche : convergence fortement positive";
  } else if (richWithNegativeConvergence) {
    level = "rich_signal";
    description = "Signal riche : schéma préoccupant convergent";
  } else if (richCount >= 1 || moderateCount >= 1) {
    level = "moderate_signal";
    description = "Signal modéré : convergence partielle";
  } else {
    level = "limited_signal";
    description = "Signal limité : une ou deux sources";
  }

  return { level, description };
}

// ─── Top-level orchestrator ───────────────────────────────────────────────────

export function runDeterministicSynthesis(
  itemScores: ItemScoreData[],
  psychoScores: PsychoScoresData,
  jobTitle: string,
  roleAnswers: Record<string, string>,
  t2RawChoice: string | null
): Omit<SynthesisResult, "prose" | "computedAt"> {
  const augmentedScores = { ...psychoScores, _t2Choice: t2RawChoice ?? undefined };

  const dimensionBands = computeDimensionBands(itemScores, augmentedScores);
  const flags = detectPatterns(itemScores, augmentedScores, jobTitle, dimensionBands, roleAnswers);
  const roleFitRead = computeRoleFitRead(dimensionBands, flags, jobTitle);
  const fcRankOrderProse = computeFCRankOrderProse(psychoScores.fcTallies ?? {});
  const motivationProfile = computeMotivationProfile(augmentedScores, jobTitle);
  const interpersonalProfile = computeInterpersonalProfile(itemScores);
  const { level: overallConfidence, description: overallConfidenceDescription } = computeOverallConfidence(dimensionBands, flags);

  return {
    dimensions: dimensionBands,
    flags,
    roleFitRead,
    fcRankOrderProse,
    motivationProfile,
    interpersonalProfile,
    overallConfidence,
    overallConfidenceDescription,
  };
}
