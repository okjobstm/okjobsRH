import { z } from "zod";

export const telemetrySchema = z.object({
  v: z.literal(1),
  itemMs: z.record(z.string(), z.number().nonnegative()),
  pastedChars: z.record(z.string(), z.number().nonnegative()),
  hiddenMs: z.number().nonnegative(),
  pasteCount: z.number().int().nonnegative(),
  lostFocusCount: z.number().int().nonnegative(),
});

export type Telemetry = z.infer<typeof telemetrySchema>;

export type IntegritySignals = {
  totalDwellMs: number;
  hiddenMs: number;
  hiddenRatio: number;
  pasteCount: number;
  pastedChars: number;
  focusLossCount: number;
  openEndedTooFast: string[];
  overallTooFast: boolean;
  dominantSignal: string | null;
  severity: "high" | "medium" | null;
};

export const EMPTY_SIGNALS: IntegritySignals = {
  totalDwellMs: 0,
  hiddenMs: 0,
  hiddenRatio: 0,
  pasteCount: 0,
  pastedChars: 0,
  focusLossCount: 0,
  openEndedTooFast: [],
  overallTooFast: false,
  dominantSignal: null,
  severity: null,
};

// Stage 5 is announced as "Expected time: 25–30 minutes" (stage-5.tsx). Halving
// that leaves room for a fast-but-human candidate before the outlier trips.
const MIN_OVERALL_MS = 12 * 60 * 1000;

// Only open-ended items are timed. Forced-choice and ranking are click-through by
// nature, so dwell there says nothing about effort.
const OPEN_ENDED: Record<string, number> = {
  "C-S1": 90_000,
  "C-S2": 90_000,
  "C-S3": 75_000,
  "C-S4": 75_000,
  "RF-S1": 90_000,
  "RF-S2": 90_000,
  "RF-S3": 120_000,
  "RF-S4": 75_000,
};

// Tab-hiding is often legitimate (a call, a second monitor) and assistive tech
// fires blur/focusout constantly, so neither can trip a flag on its own.
const HIGH_HIDDEN_RATIO = 0.4;
const MEDIUM_HIDDEN_RATIO = 0.2;
const HIGH_PASTE_CHARS = 400;
const HIGH_PASTE_EVENTS = 3;

/**
 * Turns raw stage-5 client telemetry into reviewer-facing integrity signals.
 * Pure arithmetic, never an LLM call, never blocking: a trip lowers nothing by
 * itself, it only surfaces a flag for a human to weigh against the written answers.
 *
 * Returns EMPTY_SIGNALS when telemetry is missing (assessment finished before this
 * shipped, or JS disabled). Absence of data must never be read as clean.
 */
export function analyzeIntegrity(
  telemetry: Telemetry | null | undefined,
  dbIdByItemId: Record<string, string>
): IntegritySignals {
  if (!telemetry) return EMPTY_SIGNALS;

  const dbIdFor = (itemId: string): string | undefined => {
    for (const [dbId, id] of Object.entries(dbIdByItemId)) {
      if (id === itemId) return dbId;
    }
    return undefined;
  };

  const inViewportMs = Object.values(telemetry.itemMs).reduce((sum, v) => sum + v, 0);
  const totalDwellMs = inViewportMs + telemetry.hiddenMs;
  const hiddenRatio = totalDwellMs > 0 ? telemetry.hiddenMs / totalDwellMs : 0;

  const pastedChars = Object.entries(telemetry.pastedChars).reduce(
    (sum, [dbId, chars]) => (dbIdByItemId[dbId] ? sum + chars : sum),
    0
  );

  const openEndedTooFast = Object.entries(OPEN_ENDED)
    .filter(([itemId, floorMs]) => {
      const dbId = dbIdFor(itemId);
      const ms = dbId ? (telemetry.itemMs[dbId] ?? 0) : 0;
      return ms > 0 && ms < floorMs;
    })
    .map(([itemId]) => itemId);

  const signals: IntegritySignals = {
    totalDwellMs,
    hiddenMs: telemetry.hiddenMs,
    hiddenRatio,
    pasteCount: telemetry.pasteCount,
    pastedChars,
    focusLossCount: telemetry.lostFocusCount,
    openEndedTooFast,
    overallTooFast:
      totalDwellMs > 0 &&
      totalDwellMs < MIN_OVERALL_MS &&
      openEndedTooFast.length >= 3,
    dominantSignal: null,
    severity: null,
  };

  const high: string[] = [];
  const medium: string[] = [];

  if (signals.overallTooFast) high.push("completed-far-faster-than-stated");
  if (hiddenRatio >= HIGH_HIDDEN_RATIO && telemetry.hiddenMs >= 5 * 60_000) {
    high.push("mostly-away-from-tab");
  }
  if (telemetry.pasteCount >= HIGH_PASTE_EVENTS || pastedChars >= HIGH_PASTE_CHARS) {
    high.push("large-amount-pasted");
  } else if (telemetry.pasteCount > 0) {
    medium.push("some-pasted-content");
  }

  if (hiddenRatio >= MEDIUM_HIDDEN_RATIO && telemetry.hiddenMs >= 60_000) {
    medium.push("frequent-tab-switching");
  }
  if (telemetry.lostFocusCount >= 3) medium.push("repeated-focus-loss");

  if (high.length > 0) return { ...signals, dominantSignal: high[0], severity: "high" };
  if (medium.length > 0) return { ...signals, dominantSignal: medium[0], severity: "medium" };
  return signals;
}

/** One-line evidence summary for the reviewer report. */
export function describeIntegrity(signals: IntegritySignals): string {
  if (signals.totalDwellMs === 0) {
    return "No behaviour signals were recorded for this assessment.";
  }
  const mins = (ms: number) => `${Math.round(ms / 60000)} min`;
  const parts = [`${mins(signals.totalDwellMs)} spent on the assessment`];

  if (signals.hiddenMs > 0) {
    parts.push(`${mins(signals.hiddenMs)} of that with the tab in the background`);
  }
  if (signals.pasteCount > 0) {
    const verb = signals.pasteCount === 1 ? "paste" : "pastes";
    parts.push(`${signals.pasteCount} ${verb} (${signals.pastedChars} characters pasted)`);
  }
  if (signals.openEndedTooFast.length > 0) {
    parts.push(`answered faster than the floor on ${signals.openEndedTooFast.join(", ")}`);
  }
  if (signals.focusLossCount > 0) {
    parts.push(`${signals.focusLossCount} window focus losses`);
  }
  return `${parts.join(", ")}.`;
}
