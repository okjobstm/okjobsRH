// Guard for the scoring vocabulary contract in lib/scoring/{rubrics,band-rules,star-scorer}.ts.
//
// The scorer LLM returns one token per feature, star-scorer.ts validates it
// against `allowedValues`, and band-rules.ts compares those tokens with `===`.
// The vocabulary is therefore a machine contract, not display copy: it must
// stay English/ASCII even though the UI, the rubrics prose and the candidates'
// answers are now in French. Translating an `allowedValues` entry makes every
// French response score as `insufficient`.
//
// Run:
//   node --experimental-strip-types --no-warnings tests/band-rules.test.mjs

import assert from "node:assert/strict";
import { assignBand } from "../lib/scoring/band-rules.ts";
import { RUBRICS } from "../lib/scoring/rubrics.ts";

let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`  FAIL ${name}`);
    console.log(`       ${err.message}`);
  }
}

check("allowedValues stay unaccented ASCII machine tokens", () => {
  const offenders = [];
  for (const rubric of Object.values(RUBRICS)) {
    for (const feature of rubric.features) {
      for (const value of feature.allowedValues) {
        if (!/^[a-z0-9_]+$/.test(value)) offenders.push(`${rubric.itemId}.${feature.name} = "${value}"`);
      }
    }
  }
  assert.equal(
    offenders.length,
    0,
    `these output tokens are not machine tokens and would break band matching:\n       ${offenders.join("\n       ")}`
  );
});

check("every rubric item has a band assignment", () => {
  for (const itemId of Object.keys(RUBRICS)) {
    const { band } = assignBand(itemId, {});
    assert.notEqual(band, "insufficient_signal", `${itemId} falls through to the unknown-item branch`);
  }
});

check("C-S1: strongest signal scores strong_positive", () => {
  const { band } = assignBand("C-S1", {
    specificity: "high",
    outcome_clarity: "concrete",
    first_person_agency: "high",
    problem_ownership: "owned",
  });
  assert.equal(band, "strong_positive");
});

check("C-S1: partial evidence scores moderate_positive", () => {
  const { band } = assignBand("C-S1", {
    specificity: "high",
    outcome_clarity: "vague",
    first_person_agency: "medium",
    problem_ownership: "shared",
  });
  assert.equal(band, "moderate_positive");
});

check("C-S1: absent evidence falls back to limited_signal", () => {
  const { band } = assignBand("C-S1", {
    specificity: "low",
    outcome_clarity: "missing",
    first_person_agency: "low",
    problem_ownership: "passive",
  });
  assert.equal(band, "limited_signal");
});

check("C-S2: a declined mistake raises concern_flag", () => {
  const { band } = assignBand("C-S2", {
    mistake_genuineness: "avoided",
    ownership: "externalized",
    disclosure_behavior: "reactive",
    correction_action: "nominal",
  });
  assert.equal(band, "concern_flag");
});

check("C-S2: genuine and proactive scores strong_positive", () => {
  const { band } = assignBand("C-S2", {
    mistake_genuineness: "genuine",
    ownership: "owned",
    disclosure_behavior: "proactive",
    correction_action: "substantive",
  });
  assert.equal(band, "strong_positive");
});

check("C-S2: partial ownership scores moderate_positive", () => {
  const { band } = assignBand("C-S2", {
    mistake_genuineness: "genuine",
    ownership: "partial",
    disclosure_behavior: "reactive",
    correction_action: "nominal",
  });
  assert.equal(band, "moderate_positive");
});

check("C-S3: substantive shift scores strong_positive", () => {
  const { band } = assignBand("C-S3", {
    specificity_of_original_view: "high",
    specificity_of_counterargument: "high",
    nature_of_shift: "substantive",
  });
  assert.equal(band, "strong_positive");
});

check("C-S3: performative shift scores mixed", () => {
  const { band } = assignBand("C-S3", {
    specificity_of_original_view: "high",
    specificity_of_counterargument: "high",
    nature_of_shift: "performative",
  });
  assert.equal(band, "mixed");
});

check("C-S4: delivered respectful feedback contributes positively", () => {
  const { band } = assignBand("C-S4", {
    feedback_delivered: "delivered",
    preparation: "high",
    directness: "direct",
    follow_through: "tracked",
    tone_about_other_person: "respectful",
  });
  assert.equal(band, "profile");
});

check("C-S4: a dismissive tone raises concern_flag", () => {
  const { band } = assignBand("C-S4", {
    feedback_delivered: "delivered",
    preparation: "low",
    directness: "hedged",
    follow_through: "absent",
    tone_about_other_person: "dismissive",
  });
  assert.equal(band, "concern_flag");
});

check("RF-S3: a sophisticated workflow scores strong_positive", () => {
  const { band } = assignBand("RF-S3", {
    specificity_of_work: "high",
    depth_of_ai_workflow: "sophisticated",
    limits_awareness: "explicit",
    outcome_specificity: "concrete",
    ownership_and_agency: "high",
  });
  assert.equal(band, "strong_positive");
});

check("RF-S3: AI dependence raises concern_flag", () => {
  const { band } = assignBand("RF-S3", {
    specificity_of_work: "medium",
    depth_of_ai_workflow: "basic",
    limits_awareness: "implicit",
    outcome_specificity: "vague",
    ownership_and_agency: "low",
  });
  assert.equal(band, "concern_flag");
});

check("a French token is not silently accepted as high", () => {
  const english = assignBand("C-S1", {
    specificity: "high",
    outcome_clarity: "concrete",
    first_person_agency: "high",
    problem_ownership: "owned",
  }).band;
  const french = assignBand("C-S1", {
    specificity: "élevé",
    outcome_clarity: "concret",
    first_person_agency: "élevé",
    problem_ownership: "assumé",
  }).band;
  assert.equal(english, "strong_positive");
  assert.notEqual(french, english, "French tokens must not match the English vocabulary");
  assert.equal(french, "limited_signal");
});

if (failures > 0) {
  console.log(`\n  ${failures} test(s) failed`);
  process.exit(1);
}
console.log("\n  all band-rules() vocabulary tests passed");
