import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getKnownAdminEmails, requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatStage, stageBadgeClass } from "@/lib/candidates";
import { getCandidateEngagement, formatDurationShort } from "@/lib/events";
import { CandidateStage } from "@prisma/client";
import {
  shortlistCandidateAction,
  rejectCandidateAction,
  restoreToShortlistAction,
  hireCandidateAction,
} from "@/actions/candidates";
import { Download } from "lucide-react";
import { AnalyseButton } from "@/components/admin/analyse-button";
import { TierSection } from "@/components/admin/tier-section";
import { BandIndicator } from "@/components/admin/band-indicator";
import { CopyButton } from "@/components/admin/copy-button";
import { FollowUpQuestion } from "@/components/admin/follow-up-question";
import { EraseButton } from "@/components/admin/erase-button";
import { InterviewFocusPanel } from "@/components/admin/interview-focus-panel";
import { ReviewerPanel } from "@/components/admin/reviewer-panel";
import { Tip } from "@/components/admin/tip";
import {
  computeEngagement,
  computeTimeToFinish,
  ENGAGEMENT_BAND_CLASS,
  ENGAGEMENT_BAND_LABEL,
} from "@/lib/engagement";
import type { SynthesisResult, DimensionBand, RoleFitBand, PatternFlag } from "@/lib/scoring/synthesis";
import { LOCALE, TIME_ZONE } from "@/lib/site-config";
import { formatDateTime, formatNumber, ROLE_FIT_LABEL } from "@/lib/format";

// ─── Display constants ────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<string, string> = {
  conscientiousness: "Rigueur professionnelle",
  honesty_humility: "Honnêteté et humilité",
  composure: "Sang-froid",
  learning: "Orientation apprentissage",
  interpersonal: "Style relationnel",
  motivation_scope: "Motivation : périmètre",
  motivation_autonomy: "Motivation : autonomie",
  motivation_stability: "Motivation : stabilité",
  motivation_mission: "Motivation : mission",
  motivation_recognition: "Motivation : reconnaissance",
};

const DIMENSION_DESCRIPTION: Record<string, string> = {
  conscientiousness: "Fiabilité, autodiscipline et poursuite des objectifs",
  honesty_humility: "Sincérité, équité, modestie et faible propension à l’exploitation d’autrui",
  composure: "Réaction comportementale et rétablissement face au stress ou à l’échec",
  learning: "Ouverture aux informations qui contredisent et mise à jour autonome",
  interpersonal: "Patterns observés dans le désaccord, la remontée d’information, la collaboration et la conduite d’équipe",
};

const ROLE_FIT_COLOR: Record<RoleFitBand, string> = {
  "Strong fit": "text-emerald-700",
  "Likely fit": "text-sky-700",
  "Mixed fit": "text-amber-700",
  "Weak fit": "text-orange-700",
  "Likely mis-fit": "text-rose-700",
};

const ROLE_FIT_BORDER: Record<RoleFitBand, string> = {
  "Strong fit": "border-emerald-300",
  "Likely fit": "border-sky-300",
  "Mixed fit": "border-amber-300",
  "Weak fit": "border-orange-300",
  "Likely mis-fit": "border-rose-300",
};

const FLAG_BORDER: Record<string, string> = {
  high: "border-l-rose-600",
  medium: "border-l-amber-500",
  operational: "border-l-slate-300",
};

const FLAG_LABEL_COLOR: Record<string, string> = {
  high: "text-rose-800",
  medium: "text-amber-800",
  operational: "text-slate-700",
};

type PsychoScores = {
  fcTallies?: Record<string, number>;
  t2Scores?: Record<string, number>;
  t1Ranking?: string[];
  ccValues?: Record<string, number>;
} | null;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const session = await requireAuth();
  const { candidateId } = await params;

  const [candidate, standardQuestions, psychoItems, reviews] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        submission: {
          include: { itemScores: { orderBy: { scoredAt: "desc" } } },
        },
        job: {
          include: { roleQuestions: { orderBy: { sortOrder: "asc" } } },
        },
      },
    }),
    prisma.standardQuestion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.psychometricItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.review.findMany({
      where: { candidateId },
      orderBy: { assignedAt: "desc" },
    }),
  ]);

  if (!candidate) notFound();

  const allowedReviewers = await getKnownAdminEmails();

  const engagement = await getCandidateEngagement(candidate.id);
  const recentEvents = await prisma.candidateEvent.findMany({
    where: { candidateId: candidate.id },
    orderBy: { occurredAt: "desc" },
    take: 12,
    select: { id: true, eventType: true, stage: true, occurredAt: true },
  });

  const sub = candidate.submission;
  const scores = sub?.psychoScores as PsychoScores;
  const psychoAnswers = (sub?.psychoAnswers ?? {}) as Record<string, string | string[]>;
  const roleAnswers = (sub?.roleAnswers ?? {}) as Record<string, string>;
  const standardAnswers = (sub?.standardAnswers ?? {}) as Record<string, string>;

  const starItems = psychoItems.filter((p) => p.itemType === "star_behavioral");
  const fcItems = psychoItems.filter((p) => p.itemType === "forced_choice");
  const t1Item = psychoItems.find((p) => p.itemId === "C-T1");
  const t2Item = psychoItems.find((p) => p.itemId === "C-T2");
  const ccItems = psychoItems.filter((p) => p.itemType === "consistency_check");
  const reflectionItem = psychoItems.find((p) => p.itemType === "reflection");

  const t2Answer = t2Item ? (psychoAnswers[t2Item.id] as string | undefined) : undefined;
  const t2Options = (t2Item?.options as Array<{ id: string; text: string; scores?: Record<string, number> }>) ?? [];
  const t2Chosen = t2Options.find((o) => o.id === t2Answer);

  // De-dupe item scores
  type ItemScoreRow = NonNullable<typeof sub>["itemScores"][number];
  const itemScoreMap = new Map<string, ItemScoreRow>();
  for (const s of sub?.itemScores ?? []) {
    const existing = itemScoreMap.get(s.itemId);
    if (!existing || (s.status === "scored" && existing.status !== "scored")) {
      itemScoreMap.set(s.itemId, s);
    }
  }
  const hasScoringFailures = [...itemScoreMap.values()].some((s) => s.status === "scoring_failed");
  const hasAnyScoredOrFailed = itemScoreMap.size > 0;
  const hasStarAnswers = starItems.some((i) => psychoAnswers[i.id]);

  const synthesis = sub?.synthesisJson as SynthesisResult | null;
  const hasSynthesis = !!synthesis?.roleFitRead;

  const fmt = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeZone: TIME_ZONE });
  const fmtLong = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short", timeZone: TIME_ZONE });

  // ── Tier 3 aggregate computations ─────────────────────────────────────────
  const starFeatureAggregates = (() => {
    const specificity: string[] = [];
    const attribution: string[] = [];
    const agency: string[] = [];

    for (const item of starItems) {
      const score = itemScoreMap.get(item.itemId);
      if (score?.status !== "scored" || !score.features) continue;
      const f = score.features as Record<string, { value: string }>;
      if (f.specificity) specificity.push(f.specificity.value);
      if (f.specificity_of_original_view) specificity.push(f.specificity_of_original_view.value);
      if (f.attribution_pattern) attribution.push(f.attribution_pattern.value);
      if (f.ownership) attribution.push(f.ownership.value);
      if (f.first_person_agency) agency.push(f.first_person_agency.value);
    }

    function majority(vals: string[]): string {
      if (!vals.length) return "unknown";
      const counts: Record<string, number> = {};
      for (const v of vals) counts[v] = (counts[v] ?? 0) + 1;
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }

    const starWordCounts = starItems.map((item) => {
      const ans = psychoAnswers[item.id];
      const text = typeof ans === "string" ? ans : "";
      return { label: item.itemId, words: text.trim().split(/\s+/).filter(Boolean).length };
    });

    return {
      specificity: majority(specificity),
      attribution: majority(attribution),
      agency: majority(agency),
      starWordCounts,
    };
  })();

  return (
    <div className="max-w-[840px] space-y-4 pb-20">

      {/* ── Candidate header ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">{candidate.name}</h2>
            <p className="text-xs sm:text-sm text-slate-500 truncate">{candidate.email} · {candidate.job.title}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stageBadgeClass(candidate.stage)}`}>
                {formatStage(candidate.stage)}
              </span>
              {sub?.submittedAt && (
                <span className="text-xs text-slate-400">Candidature envoyée le {fmt.format(sub.submittedAt)}</span>
              )}
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={`/admin/jobs/${candidate.job.id}`}>← <span className="hidden sm:inline">{candidate.job.title}</span><span className="sm:hidden">Retour</span></Link>
          </Button>
        </div>
        {/* Action bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm">
            <Link href={`/api/admin/report/${candidate.id}`} target="_blank">
              <Download className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Rapport PDF</span>
            </Link>
          </Button>
          {([CandidateStage.COMPLETED, CandidateStage.REVIEWING] as CandidateStage[]).includes(candidate.stage) && (
            <form action={shortlistCandidateAction}>
              <input type="hidden" name="candidateId" value={candidate.id} />
              <Button type="submit" size="sm">Présélectionner</Button>
            </form>
          )}
          {candidate.stage === CandidateStage.REJECTED && (
            <form action={restoreToShortlistAction}>
              <input type="hidden" name="candidateId" value={candidate.id} />
              <Button type="submit" size="sm" variant="outline">Repasser en présélection</Button>
            </form>
          )}
          {candidate.stage === CandidateStage.SHORTLISTED && (
            <form action={hireCandidateAction}>
              <input type="hidden" name="candidateId" value={candidate.id} />
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Embaucher</Button>
            </form>
          )}
          {([CandidateStage.COMPLETED, CandidateStage.REVIEWING, CandidateStage.SHORTLISTED] as CandidateStage[]).includes(candidate.stage) && (
            <form action={rejectCandidateAction}>
              <input type="hidden" name="candidateId" value={candidate.id} />
              <Button type="submit" size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">Refuser</Button>
            </form>
          )}
        </div>
      </div>

      <Tip id="candidate-detail">
        Lancez <em>Analyser le candidat</em> ci-dessous pour générer une évaluation structurée, puis affectez un évaluateur dans le panneau juste en dessous.
        Les évaluateurs peuvent lire l’évaluation et rendre une décision (oui franc, oui, non mesuré, non).
      </Tip>

      {/* ── Reviewer panel ──────────────────────────────────────────────────── */}
      <ReviewerPanel
        candidateId={candidate.id}
        currentUserEmail={session.email}
        reviews={reviews}
        allowedReviewers={allowedReviewers}
      />

      {/* ── Engagement panel ────────────────────────────────────────────────── */}
      {engagement.sessionCount > 0 && (() => {
        const engagementSummary = computeEngagement({
          stage: candidate.stage,
          completionPercent: candidate.completionPercent,
          sessionCount: engagement.sessionCount,
          totalTimeSeconds: engagement.totalTimeSeconds,
          lastActiveAt: engagement.lastActiveAt,
          // eslint-disable-next-line react-hooks/purity -- Server Component, runs once per request
          now: Date.now(),
        });
        const timing = computeTimeToFinish({
          firstOpenedAt: engagement.firstOpenedAt,
          submittedAt: sub?.submittedAt ?? null,
          totalActiveSeconds: engagement.totalTimeSeconds,
        });
        return (
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Engagement</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ENGAGEMENT_BAND_CLASS[engagementSummary.band]}`}
                title={`Score ${engagementSummary.score}/100`}
              >
                {ENGAGEMENT_BAND_LABEL[engagementSummary.band]} · {engagementSummary.score}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">{engagement.eventCount} événements</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <EngagementStat label="Sessions" value={String(engagement.sessionCount)} />
            <EngagementStat label="Temps actif" value={timing.activeLabel} />
            <EngagementStat
              label={timing.spanLabel ? "Durée totale" : "Première ouverture"}
              value={
                timing.spanLabel ??
                (engagement.firstOpenedAt ? fmt.format(engagement.firstOpenedAt) : "—")
              }
            />
            <EngagementStat
              label="Dernière activité"
              value={engagement.lastActiveAt ? fmtLong.format(engagement.lastActiveAt) : "—"}
            />
          </div>
          {recentEvents.length > 0 && (
            <details className="mt-4 group">
              <summary className="text-xs text-slate-500 cursor-pointer select-none hover:text-slate-700">
                Historique d’activité ({recentEvents.length} derniers événements)
              </summary>
              <ul className="mt-2 space-y-1 text-xs">
                {recentEvents.map((e) => (
                  <li key={e.id} className="flex items-baseline justify-between gap-3 py-0.5">
                    <span className="text-slate-700">
                      {formatEventType(e.eventType)}
                      {e.stage ? ` · étape ${e.stage}` : ""}
                    </span>
                    <span className="text-slate-400 shrink-0 tabular-nums">{fmtLong.format(e.occurredAt)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
        );
      })()}

      {!sub ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-400 text-sm">
          Aucune donnée de candidature pour l’instant.
        </div>
      ) : (
        <div className="space-y-3">

          {/* ════════════════════════════════════════════════════════════════════
              TIER 1 — 60-SECOND PANEL (always expanded)
          ════════════════════════════════════════════════════════════════════ */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Synthèse de l’évaluation</span>
              {hasStarAnswers && (
                <AnalyseButton candidateId={candidate.id} hasExisting={hasSynthesis} />
              )}
            </div>

            <div className="px-5 py-6 space-y-7">
              {hasScoringFailures && (
                <div className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 flex items-start gap-2.5 text-sm text-rose-800">
                  <span className="shrink-0 font-bold">!</span>
                  <span>Certains éléments n’ont pas pu être évalués. Cliquez sur <strong>Réanalyser</strong> ci-dessus pour réessayer.</span>
                </div>
              )}
              {hasSynthesis && synthesis ? (
                <>
                  {/* Role-fit read + confidence */}
                  <div className={`rounded-lg border-l-4 pl-5 pr-4 py-4 border-slate-200 bg-slate-50 ${ROLE_FIT_BORDER[synthesis.roleFitRead.band] ?? "border-l-slate-300"}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Lecture d’adéquation</p>
                        <p className={`text-2xl font-semibold tracking-tight ${ROLE_FIT_COLOR[synthesis.roleFitRead.band] ?? "text-slate-800"}`}>
                          {ROLE_FIT_LABEL[synthesis.roleFitRead.band]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Confiance</p>
                        <p className="text-xs text-slate-600 font-medium">
                          {(synthesis as { overallConfidenceDescription?: string }).overallConfidenceDescription ?? synthesis.overallConfidence}
                        </p>
                      </div>
                    </div>

                    {synthesis.prose?.roleFitRationale && (
                      <p className="text-base text-slate-800 leading-relaxed mb-2" style={{ fontFamily: "var(--font-serif)" }}>
                        {synthesis.prose.roleFitRationale}
                      </p>
                    )}
                    {synthesis.prose?.confidenceRationale && (
                      <p className="text-xs text-slate-500 italic leading-relaxed mb-3">
                        {synthesis.prose.confidenceRationale}
                      </p>
                    )}

                    <p className="text-xs text-slate-400 italic">
                      Ceci est une synthèse des signaux observés au regard du référentiel de recrutement. Ce n’est pas une recommandation d’embauche ni de refus : un entretien est nécessaire.
                    </p>
                  </div>

                  {/* Pattern flags */}
                  {synthesis.flags.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Motifs et points de vigilance</p>
                      {synthesis.flags
                        .sort((a, b) => {
                          const sev = { high: 0, medium: 1, operational: 2 };
                          return (sev[a.severity] ?? 9) - (sev[b.severity] ?? 9);
                        })
                        .map((flag: PatternFlag) => (
                          <div
                            key={flag.id}
                            className={`border-l-4 pl-4 pr-4 py-4 rounded-r-lg bg-white border border-l-0 border-slate-100 ${FLAG_BORDER[flag.severity] ?? "border-l-slate-300"}`}
                          >
                            <p className={`text-sm font-semibold mb-1.5 ${FLAG_LABEL_COLOR[flag.severity] ?? "text-slate-700"}`}>
                              {flag.label}
                            </p>
                            <p className="text-sm text-slate-700 leading-relaxed mb-2" style={{ fontFamily: "var(--font-serif)" }}>
                              {flag.description}
                            </p>
                            {flag.contributingItems.length > 0 && (
                              <p className="text-xs text-slate-400">
                                Références :{" "}
                                {flag.contributingItems.map((ci, i) => (
                                  <span key={i}>
                                    {i > 0 && ", "}
                                    <a href={`#item-${ci.itemId}`} className="hover:text-slate-600 underline decoration-dotted">{ci.sectionLabel}</a>
                                  </span>
                                ))}
                              </p>
                            )}
                            {synthesis.prose?.followUpQuestions?.byFlag?.[flag.id] ? (
                              <FollowUpQuestion
                                candidateId={candidate.id}
                                targetId={flag.id}
                                surface="flag"
                                initialQuestion={synthesis.prose.followUpQuestions.byFlag[flag.id]}
                              />
                            ) : (
                              <div className="mt-3 pt-2.5 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400 italic">Réanalysez le candidat pour générer une relance suggérée.</p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Strengths */}
                  {synthesis.prose?.strengths && synthesis.prose.strengths.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2.5">Forces</p>
                      <ul className="space-y-2">
                        {synthesis.prose.strengths.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-sm">
                            <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                            <span className="text-slate-700 leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interview focus — includes flag probes + signal gap probes (consolidated) */}
                  <div className="border-t border-slate-100 pt-5">
                    <InterviewFocusPanel
                      candidateId={candidate.id}
                      initialTopThree={synthesis.prose?.followUpQuestions?.topThree ?? []}
                      gapQuestions={synthesis.prose?.openQuestions ?? []}
                      hasNoFlags={synthesis.flags.length === 0}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
                  <p className="text-sm text-slate-500 mb-1">Analyse pas encore générée.</p>
                  <p className="text-xs text-slate-400">
                    {hasStarAnswers
                      ? "Lancez d’abord l’évaluation STAR, puis cliquez sur Analyser pour générer les niveaux par dimension, les points de vigilance et la lecture d’adéquation."
                      : "Données psychométriques enregistrées. L’évaluation et la synthèse seront disponibles dès que les réponses STAR seront présentes."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              TIER 2 — DIMENSION CARDS
          ════════════════════════════════════════════════════════════════════ */}
          {hasSynthesis && synthesis && (
            <>
            <p className="text-xs text-amber-700">
              Scores non calibrés : les seuils et les libellés ont été traduits en français,
              mais ils ne sont pas recalibrés sur des normes francophones. À lire comme un
              repère comparatif entre candidats, pas comme une mesure absolue.
            </p>
            <TierSection storageKey="tier-2" title="Estimations par dimension" badge={`${Object.keys(synthesis.dimensions).length} dimensions`}>
              <div className="space-y-2">
                {Object.entries(synthesis.dimensions).map(([dim, result]) => (
                  <details key={dim} className="group rounded-lg border border-slate-200 overflow-hidden bg-white">
                    <summary className="px-4 py-3.5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-slate-800">{DIMENSION_LABELS[dim] ?? dim}</span>
                          <span className="ml-2 text-xs text-slate-400">{DIMENSION_DESCRIPTION[dim]}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <BandIndicator band={result.band as DimensionBand} />
                          <span className="text-[10px] text-slate-400">confiance : {result.confidence.replace("_signal", "").replace("_", " ")}</span>
                          <span className="text-slate-300 group-open:rotate-180 transition-transform select-none text-xs">▾</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        {result.contributingItems.length > 0
                          ? result.contributingItems
                              .map((ci) =>
                                typeof ci === "string"
                                  ? ci
                                      .replace(/motivation_(\w+)/g, (_, m) => DIMENSION_LABELS[`motivation_${m}`] ?? m)
                                      .replace(/FC \(honesty_humility tally:/, "FC (décompte honnêteté et humilité :")
                                      .replace(/FC \(conscientiousness tally:/, "FC (décompte rigueur professionnelle :")
                                      .replace(/FC \(composure tally:/, "FC (décompte sang-froid :")
                                      .replace(/FC \(learning tally:/, "FC (décompte orientation apprentissage :")
                                      .replace(/FC \(interpersonal tally:/, "FC (décompte style relationnel :")
                                  : String(ci)
                              )
                              .join(" · ")
                          : "Éléments de preuve : aucun"}
                      </p>
                    </summary>
                    <div className="border-t border-slate-100 px-4 py-4 space-y-3 bg-slate-50/50">
                      {synthesis.prose?.dimensionSummaries?.[dim] && (
                        <p className="text-sm text-slate-700 leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
                          {synthesis.prose.dimensionSummaries[dim]}
                        </p>
                      )}
                      {result.conflictNote && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-2 leading-relaxed">
                          {result.conflictNote}
                        </p>
                      )}
                      {synthesis.prose?.followUpQuestions?.byDimension?.[dim] && (
                        <FollowUpQuestion
                          candidateId={candidate.id}
                          targetId={dim}
                          surface="dimension"
                          initialQuestion={synthesis.prose.followUpQuestions.byDimension[dim]}
                        />
                      )}
                    </div>
                  </details>
                ))}

                {/* Interpersonal profile */}
                {synthesis.interpersonalProfile && (
                  <details className="group rounded-lg border border-slate-200 overflow-hidden bg-white">
                    <summary className="px-4 py-3.5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-800">Style relationnel</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-500 bg-slate-100 rounded px-2 py-0.5">profil</span>
                          <span className="text-slate-300 group-open:rotate-180 transition-transform select-none text-xs">▾</span>
                        </div>
                      </div>
                    </summary>
                    <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          ["Directesse", synthesis.interpersonalProfile.directness],
                          ["Approche du conflit", synthesis.interpersonalProfile.conflictApproach],
                          ["Considération des autres", synthesis.interpersonalProfile.regardForOthers],
                          ["Tenue dans l’exécution", synthesis.interpersonalProfile.followThrough],
                        ] as const).map(([label, value]) => (
                          <div key={label}>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                            <p className="text-sm text-slate-700 capitalize">{value}</p>
                          </div>
                        ))}
                      </div>
                      {synthesis.prose?.dimensionSummaries?.["interpersonal"] && (
                        <p className="text-sm text-slate-700 leading-relaxed pt-1" style={{ fontFamily: "var(--font-serif)" }}>
                          {synthesis.prose.dimensionSummaries["interpersonal"]}
                        </p>
                      )}
                    </div>
                  </details>
                )}

                {/* Motivation profile */}
                {synthesis.motivationProfile.t1Ranking.length > 0 && (
                  <details className="group rounded-lg border border-slate-200 overflow-hidden bg-white">
                    <summary className="px-4 py-3.5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-800">Facteurs de motivation</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-500 bg-slate-100 rounded px-2 py-0.5">profil</span>
                          <span className="text-slate-300 group-open:rotate-180 transition-transform select-none text-xs">▾</span>
                        </div>
                      </div>
                    </summary>
                    <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/50 space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Priorité classée</p>
                        <p className="text-sm text-slate-700">
                          {synthesis.motivationProfile.t1Ranking.map((m, i) => (
                            <span key={m}>
                              {i > 0 && <span className="text-slate-300 mx-1.5">›</span>}
                              <span className={i === 0 ? "font-medium text-slate-900" : i === synthesis.motivationProfile.t1Ranking.length - 1 ? "text-slate-400" : "text-slate-600"}>
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                              </span>
                            </span>
                          ))}
                        </p>
                      </div>
                      {synthesis.motivationProfile.roleAlignmentNote && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-2 italic">
                          {synthesis.motivationProfile.roleAlignmentNote}
                        </p>
                      )}
                      {t2Chosen && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Scénario d’intégrité (C-T2)</p>
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">Option {t2Chosen.id} :</span> {t2Chosen.text}
                          </p>
                          {scores?.t2Scores && Object.keys(scores.t2Scores).length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-1.5">
                              {Object.entries(scores.t2Scores).map(([d, val]) => (
                                <span key={d} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(val as number) > 0 ? "bg-emerald-100 text-emerald-700" : (val as number) < 0 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"}`}>
                                  {DIMENSION_LABELS[d] ?? d}: {(val as number) > 0 ? `+${val}` : String(val)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {synthesis.fcRankOrderProse && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Profil de choix forcé</p>
                          <p className="text-sm text-slate-600">{synthesis.fcRankOrderProse}</p>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </TierSection>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TIER 3 — PATTERNS AND RESPONSE STYLE
          ════════════════════════════════════════════════════════════════════ */}
          {hasSynthesis && synthesis && (
            <TierSection storageKey="tier-3" title="Motifs et style de réponse">
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Spécificité des réponses",
                      value: starFeatureAggregates.specificity,
                      note: `Sur l’ensemble des éléments STAR évalués`,
                    },
                    {
                      label: "Implication à la première personne",
                      value: starFeatureAggregates.agency,
                      note: "La régularité avec laquelle le candidat a employé le « je »",
                    },
                    {
                      label: "Schéma d’attribution",
                      value: starFeatureAggregates.attribution,
                      note: "Attribution interne ou externe des événements",
                    },
                  ].map(({ label, value, note }) => (
                    <div key={label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-slate-800 capitalize">{value !== "unknown" ? value.replace(/_/g, " ") : "—"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{note}</p>
                    </div>
                  ))}
                </div>

                {starFeatureAggregates.starWordCounts.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Longueur des réponses par élément</p>
                    <div className="space-y-1">
                      {starFeatureAggregates.starWordCounts.map(({ label, words }) => (
                        <div key={label} className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="w-10 text-slate-400 font-mono">{label}</span>
                          <span className={words < 100 ? "text-amber-600 font-medium" : "text-slate-700"}>{words} mots</span>
                          {words < 100 && <span className="text-amber-500 text-[10px]">en dessous du attendu</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scores?.ccValues && Object.keys(scores.ccValues).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Réponses aux contrôles de cohérence</p>
                    {ccItems.map((item) => {
                      const val = scores?.ccValues?.[item.itemId];
                      if (val === undefined) return null;
                      return (
                        <div key={item.id} className="mb-2">
                          <p className="text-xs text-slate-500 italic mb-0.5">
                            &ldquo;{item.body}&rdquo;
                          </p>
                          <p className="text-xs text-slate-700">
                            Réponse : <span className="font-semibold">{val}/5</span>
                            {val >= 4 && <span className="text-amber-600 ml-1.5">· accord notable</span>}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Conflict notes from dimensions that weren’t flagged */}
                {(() => {
                  const conflicts = Object.entries(synthesis.dimensions)
                    .filter(([, r]) => r.conflictNote)
                    .map(([dim, r]) => ({ dim, note: r.conflictNote! }));
                  if (!conflicts.length) return null;
                  return (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Divergences de signal</p>
                      <div className="space-y-1.5">
                        {conflicts.map(({ dim, note }) => (
                          <div key={dim} className="text-xs text-slate-600 bg-amber-50/60 rounded px-3 py-2">
                            <span className="font-medium text-slate-700">{DIMENSION_LABELS[dim] ?? dim} :</span>{" "}
                            {note}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </TierSection>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TIER 4 — FULL RESPONSES
          ════════════════════════════════════════════════════════════════════ */}
          <TierSection storageKey="tier-4" title="Réponses complètes">
            <div className="space-y-7">

              {/* Role-specific questions */}
              {candidate.job.roleQuestions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                    Questions spécifiques au poste : {candidate.job.title}
                  </p>
                  <div className="space-y-5">
                    {candidate.job.roleQuestions.map((q, i) => (
                      <div key={q.id} id={`role-q-${q.id}`}>
                        <p className="text-xs font-medium text-slate-500 mb-1">Question {i + 1}</p>
                        <p className="text-sm font-medium text-slate-800 mb-2">{q.prompt}</p>
                        {roleAnswers[q.id] ? (
                          <div className="relative group">
                            <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
                              {roleAnswers[q.id]}
                            </p>
                            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <CopyButton text={roleAnswers[q.id]} />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Aucune réponse fournie.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Standard questions */}
              {standardQuestions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Questions standard</p>
                  <div className="space-y-5">
                    {standardQuestions.map((q, i) => (
                      <div key={q.id}>
                        <p className="text-xs font-medium text-slate-500 mb-1">Q{i + 1}</p>
                        <p className="text-sm font-medium text-slate-800 mb-2">{q.prompt}</p>
                        {standardAnswers[q.id] ? (
                          <div className="relative group">
                            <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
                              {standardAnswers[q.id]}
                            </p>
                            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <CopyButton text={standardAnswers[q.id]} />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Aucune réponse fournie.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAR behavioural items */}
              {starItems.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Évaluation comportementale</p>
                  {!hasAnyScoredOrFailed && (
                    <p className="text-xs text-amber-600 mb-3">Évaluation par grille en attente : les réponses sont enregistrées, mais l’évaluation par IA n’a pas encore été lancée.</p>
                  )}
                  <div className="space-y-2">
                    {starItems.map((item) => {
                      const answer = psychoAnswers[item.id] as string | undefined;
                      const score = itemScoreMap.get(item.itemId);
                      const features = score?.features as
                        | Record<string, { value: string; justification?: string; supporting_excerpt?: string }>
                        | undefined;
                      return (
                        <details key={item.id} id={`item-${item.itemId}`} className="group rounded-lg border border-slate-200 overflow-hidden">
                          <summary className="flex items-center justify-between bg-white px-4 py-3.5 cursor-pointer list-none hover:bg-slate-50 transition-colors gap-3">
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-mono font-medium text-slate-400 mr-2">{item.itemId}</span>
                              <span className="text-sm text-slate-700">
                                {item.body.length > 90 ? item.body.slice(0, 90) + "…" : item.body}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {!score && answer && (
                                <span className="text-[11px] text-amber-600 font-medium">En attente</span>
                              )}
                              {score?.status === "scored" && (
                                <BandIndicator band={score.bandEstimate} showLabel={true} />
                              )}
                              {score?.status === "scoring_failed" && (
                                <span className="text-[11px] text-slate-400">Non évalué</span>
                              )}
                              {score?.status === "insufficient" && (
                                <span className="text-[11px] text-slate-400">Trop courte</span>
                              )}
                              <span className="text-slate-300 group-open:rotate-180 transition-transform select-none text-xs">▾</span>
                            </div>
                          </summary>
                          <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/30 space-y-3">
                            <p className="text-xs text-slate-500 italic leading-relaxed">{item.body}</p>
                            {answer ? (
                              <div className="relative group/text">
                                <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
                                  {answer}
                                </p>
                                <div className="absolute top-0 right-0 opacity-0 group-hover/text:opacity-100 transition-opacity">
                                  <CopyButton text={answer} />
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400 italic">Aucune réponse enregistrée.</p>
                            )}
                            {score?.status === "scored" && features && Object.keys(features).length > 0 && (
                              <details className="mt-1">
                                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                                  Critères de grille ▾
                                </summary>
                                <div className="mt-2 rounded border border-slate-200 bg-white p-3">
                                  <ul className="space-y-1">
                                    {Object.entries(features).map(([name, data]) => (
                                      <li key={name} className="text-xs text-slate-600">
                                        <span className="font-semibold text-slate-700">{name}:</span>{" "}
                                        <span className="font-mono text-slate-600">{data.value}</span>
                                        {data.justification && <span className="text-slate-400">· {data.justification}</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </details>
                            )}
                            {score?.status === "scoring_failed" && (
                              <p className="text-xs text-slate-400 italic">
                                Cette réponse n’a pas été évaluée. Utilisez Réanalyser pour réessayer.
                              </p>
                            )}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FC pairs */}
              {fcItems.length > 0 && scores?.fcTallies && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Paires de choix forcé</p>
                  <div className="space-y-2">
                    {fcItems.map((item) => {
                      const answer = psychoAnswers[item.id] as string | undefined;
                      const options = (item.options as Array<{ id: string; text: string; dimension?: string }>) ?? [];
                      const chosen = options.find((o) => o.id === answer);
                      return (
                        <div key={item.id} className="rounded-lg border border-slate-100 px-4 py-3">
                          <p className="text-[10px] font-mono text-slate-400 mb-1">{item.itemId}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`rounded px-3 py-2 text-xs ${
                                  opt.id === answer
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-50 text-slate-500"
                                }`}
                              >
                                <span className="font-semibold mr-1.5">{opt.id}.</span>
                                {opt.text}
                                {opt.dimension && (
                                  <span className={`ml-1 text-[10px] ${opt.id === answer ? "text-slate-300" : "text-slate-400"}`}>
                                    [{opt.dimension}]
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          {chosen && <p className="text-[10px] text-slate-400 mt-1">Sélection : {chosen.id}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* T1 ranking + T2 + CC + reflection */}
              {t1Item && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">{t1Item.itemId} · Classement des motivations</p>
                  <p className="text-xs text-slate-500 italic mb-2">{t1Item.body}</p>
                  {scores?.t1Ranking && scores.t1Ranking.length > 0 ? (
                    <ol className="space-y-1">
                      {scores.t1Ranking.map((m, i) => (
                        <li key={m} className="text-sm text-slate-700 flex gap-2">
                          <span className="text-slate-400 font-medium w-4">{i + 1}.</span>
                          <span className="capitalize">{m}</span>
                        </li>
                      ))}
                    </ol>
                  ) : <p className="text-sm text-slate-400 italic">Sans réponse.</p>}
                </div>
              )}

              {t2Item && t2Chosen && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">{t2Item.itemId} · Scénario d’intégrité</p>
                  <p className="text-xs text-slate-500 italic mb-2">{t2Item.body}</p>
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">Option {t2Chosen.id} :</span> {t2Chosen.text}
                    </p>
                  </div>
                </div>
              )}

              {ccItems.map((item) => {
                const answer = psychoAnswers[item.id];
                if (!answer) return null;
                const labels = ["Pas du tout d’accord", "Plutôt pas d’accord", "Ni l’un ni l’autre", "Plutôt d’accord", "Tout à fait d’accord"];
                const val = typeof answer === "string" ? parseInt(answer, 10) : 0;
                return (
                  <div key={item.id}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">{item.itemId} · Contrôle de cohérence</p>
                    <p className="text-xs text-slate-500 italic mb-2">{item.body}</p>
                    <p className="text-sm text-slate-700">
                      {val}/5 · <span className="font-medium">{labels[val - 1] ?? "—"}</span>
                    </p>
                  </div>
                );
              })}

              {reflectionItem && psychoAnswers[reflectionItem.id] && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">C-R1 · Réflexion</p>
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1 mb-2 inline-block">Déclaratif, non évalué. Description du candidat lui-même : traitez-la comme une donnée de gestion des impressions, pas comme un signal observé.</p>
                  <p className="text-xs text-slate-500 italic mb-2">{reflectionItem.body}</p>
                  <blockquote className="border-l-2 border-slate-200 pl-3">
                    <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
                      {psychoAnswers[reflectionItem.id] as string}
                    </p>
                  </blockquote>
                </div>
              )}

              {sub.finalReflection && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Réflexion finale</p>
                  <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
                    {sub.finalReflection}
                  </p>
                </div>
              )}

              {/* Background */}
              {(sub.cvPath || sub.coverLetter || (Array.isArray(sub.projects) && (sub.projects as unknown[]).length > 0)) && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Parcours</p>
                  {sub.cvPath && (
                    <div className="mb-3 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <a
                          href={`/api/admin/cv/${candidate.id}`}
                          className="inline-flex items-center gap-1.5 text-sm text-sky-700 hover:text-sky-900 underline"
                          download
                        >
                          <Download className="h-3.5 w-3.5" /> Télécharger le CV
                        </a>
                        {sub.cvText && (
                          <span className="text-xs text-slate-400">
                            {formatNumber(sub.cvText.length)} caractères extraits
                            {sub.cvExtractedAt && ` · ${fmt.format(sub.cvExtractedAt)}`}
                          </span>
                        )}
                        {sub.cvExtractError && !sub.cvText && (
                          <span className="text-xs text-amber-700">
                            Échec de l’extraction : {sub.cvExtractError}
                          </span>
                        )}
                      </div>
                      {sub.cvText && (
                        <details className="group">
                          <summary className="text-xs text-slate-500 cursor-pointer select-none hover:text-slate-700">
                            Afficher le texte extrait du CV
                          </summary>
                          <pre className="mt-2 whitespace-pre-wrap break-words text-[13px] text-slate-700 leading-relaxed bg-slate-50 rounded border border-slate-200 px-4 py-3 max-h-96 overflow-y-auto" style={{ fontFamily: "var(--font-serif)" }}>
                            {sub.cvText}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                  {sub.coverLetter && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-slate-500 mb-1.5">Lettre de motivation</p>
                      <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed bg-slate-50 rounded border border-slate-200 px-4 py-3" style={{ fontFamily: "var(--font-serif)" }}>
                        {sub.coverLetter}
                      </p>
                    </div>
                  )}
                  {Array.isArray(sub.projects) && (sub.projects as unknown[]).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">Projets</p>
                      <div className="space-y-2">
                        {(sub.projects as Array<{ title: string; url: string; description: string }>).map((p, i) => (
                          <div key={i} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                            <p className="font-medium text-slate-800 text-sm">{p.title}</p>
                            {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 underline break-all">{p.url}</a>}
                            {p.description && <p className="text-sm text-slate-600 mt-1">{p.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {sub.submittedAt && (
                <p className="text-xs text-slate-400 text-right">{fmtLong.format(sub.submittedAt)}</p>
              )}
            </div>
          </TierSection>

          {/* ════════════════════════════════════════════════════════════════════
              TIER 5 — SCORING DETAIL / AUDIT
          ════════════════════════════════════════════════════════════════════ */}
          {hasAnyScoredOrFailed && (
            <TierSection storageKey="tier-5" title="Détail de l’évaluation (audit)">
              <div className="space-y-4">
                <p className="text-xs text-slate-400 italic">Sortie brute du pipeline, pour le diagnostic et la transparence. Ce n’est pas la surface de consultation principale.</p>
                {starItems.map((item) => {
                  const score = itemScoreMap.get(item.itemId);
                  if (!score) return null;
                  const features = score.features as Record<string, { value: string; justification?: string }> | null;
                  return (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-mono font-semibold text-slate-700">{item.itemId}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          {score.modelUsed && <span>modèle : {score.modelUsed}</span>}
                          {score.rubricVersion && <span>grille : {score.rubricVersion}</span>}
                          {score.scoredAt && <span>{formatDateTime(score.scoredAt)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          score.status === "scored" ? "bg-emerald-100 text-emerald-700" :
                          score.status === "scoring_failed" ? "bg-slate-100 text-slate-500" :
                          "bg-amber-100 text-amber-700"
                        }`}>{score.status}</span>
                        {score.status === "scored" && (
                          <span className="text-xs text-slate-600">{score.bandEstimate.replace(/_/g, " ")}</span>
                        )}
                      </div>
                      {features && Object.keys(features).length > 0 ? (
                        <div className="rounded border border-slate-100 bg-slate-50 p-3">
                          <ul className="space-y-1">
                            {Object.entries(features).map(([name, data]) => (
                              <li key={name} className="text-xs font-mono text-slate-600">
                                <span className="text-slate-500">{name}:</span>{" "}
                                <span className="text-slate-800">{data.value}</span>
                                {data.justification && (
                                  <span className="text-slate-400 font-sans">· {data.justification}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Aucun critère extrait.</p>
                      )}
                    </div>
                  );
                })}

                {synthesis?.computedAt && (
                  <p className="text-xs text-slate-400">
                    Synthèse calculée le {formatDateTime(synthesis.computedAt)}
                  </p>
                )}
              </div>
            </TierSection>
          )}

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STANDING FOOTER — always visible at bottom of viewport
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-72 right-0 z-10 bg-white/90 backdrop-blur-sm border-t border-slate-100 px-6 py-2">
        <div className="flex items-center justify-between gap-4 max-w-[840px] mx-auto">
          <p className="text-[11px] text-slate-400 italic">
            Ce rapport est une synthèse structurée d’une évaluation courte. Il ne s’agit pas d’un bilan psychologique. À utiliser en complément des entretiens et des échantillons de travail, jamais à leur place.
          </p>
          <div className="flex items-center gap-2">
            {candidate.name !== "[Erased]" && (
              <a
                href={`/api/admin/candidates/${candidate.id}/export`}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 hover:border-slate-300 transition-colors"
                download
              >
                <Download className="h-3 w-3" />
                Exporter les données
              </a>
            )}
            {candidate.name !== "[Erased]" && (
              <EraseButton candidateId={candidate.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EngagementStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

const EVENT_LABELS: Record<string, string> = {
  link_clicked: "Lien cliqué",
  session_started: "Session démarrée",
  stage_viewed: "Étape consultée",
  stage_completed: "Étape terminée",
  application_submitted: "Candidature envoyée",
  save_and_exit: "Enregistrer et quitter",
  cv_uploaded: "CV déposé",
};

function formatEventType(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType;
}
