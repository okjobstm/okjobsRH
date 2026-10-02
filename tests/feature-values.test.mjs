// Guard for lib/scoring/feature-values.ts, the safety net under the constrained
// decoding in star-scorer.ts.
//
// The scorer prompt is French, so the model can answer with a French label even
// though `allowedValues` is an ASCII machine contract that band-rules.ts compares
// with `===`. normalizeFeatureValue is what keeps a French answer on the same
// band as its English equivalent instead of failing the whole item.
//
// Run:
//   node --experimental-strip-types --no-warnings tests/feature-values.test.mjs

import assert from "node:assert/strict";
import { normalizeFeatureValue, FRENCH_VALUE_ALIASES } from "../lib/scoring/feature-values.ts";
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

const SCALE = ["high", "medium", "low"];

check("every ASCII token still passes through untouched", () => {
  for (const rubric of Object.values(RUBRICS)) {
    for (const feature of rubric.features) {
      for (const value of feature.allowedValues) {
        const got = normalizeFeatureValue(value, feature.allowedValues);
        assert.equal(got?.value, value);
        assert.equal(got?.aliased, false, `${feature.name}/${value} was treated as an alias`);
      }
    }
  }
});

check("the insufficient sentinel survives normalisation", () => {
  assert.equal(normalizeFeatureValue("insufficient", SCALE)?.value, "insufficient");
});

check("French labels resolve to their ASCII token", () => {
  const cases = [
    ["élevé", "high"],
    ["Faible", "low"],
    ["moyenne", "medium"],
    ["concrète", "concrete"],
    ["Manquant", "missing"],
    ["assumée", "owned"],
    ["passif", "passive"],
    ["interne", "internal"],
    ["sophistiqué", "sophisticated"],
    ["explicite", "explicit"],
    ["superficiel", "surface"],
    ["défensif_initial", "defensive_initial"],
  ];
  for (const [french, token] of cases) {
    const allowed = RUBRICS["C-S1"].features.find((f) =>
      f.allowedValues.includes(token)
    )?.allowedValues ?? [token];
    const got = normalizeFeatureValue(french, allowed);
    assert.equal(got?.value, token, `"${french}" should resolve to "${token}"`);
  }
});

check("the normalisation flag fires on the values that need it", () => {
  // `concrète` folds straight onto `concrete`, but `élevé` can only be resolved
  // through the alias table, and the scorer logs on either path.
  const logged = normalizeFeatureValue("Élevé", SCALE);
  assert.equal(logged?.value, "high");
  assert.equal(logged?.aliased, true);
  assert.equal(logged?.folded, true);

  const foldedOnly = normalizeFeatureValue("concrète", ["concrete", "vague", "missing"]);
  assert.equal(foldedOnly?.value, "concrete");
  assert.equal(foldedOnly?.aliased, false);
  assert.equal(foldedOnly?.folded, true);

  const exact = normalizeFeatureValue("high", SCALE);
  assert.equal(exact?.aliased, false);
  assert.equal(exact?.folded, false);
});

check("hyphens and spacing variants fold to the token", () => {
  const allowed = ["minor_or_reshaped", "genuine", "avoided"];
  assert.equal(normalizeFeatureValue("Minor-Or-Reshaped", allowed)?.value, "minor_or_reshaped");
  assert.equal(normalizeFeatureValue("  genuine  ", allowed)?.value, "genuine");
  assert.equal(normalizeFeatureValue("externalized", ["externalized", "owned"])?.value, "externalized");
});

check("an unknown value returns null instead of a default", () => {
  // A fabricated score is worse than a missing score: null must reach the caller
  // so the item is marked scoring_failed rather than scored on a guess.
  assert.equal(normalizeFeatureValue("excellent", SCALE), null);
  assert.equal(normalizeFeatureValue("plutôt élevé", SCALE), null);
  assert.equal(normalizeFeatureValue("", SCALE), null);
});

check("no alias points at a token that no rubric allows", () => {
  const authorized = new Set();
  for (const rubric of Object.values(RUBRICS)) {
    for (const feature of rubric.features) {
      for (const value of feature.allowedValues) authorized.add(value);
    }
  }
  const orphans = Object.entries(FRENCH_VALUE_ALIASES)
    .filter(([, token]) => !authorized.has(token))
    .map(([alias]) => `${alias} -> ${FRENCH_VALUE_ALIASES[alias]}`);
  assert.equal(
    orphans.length,
    0,
    `these aliases target tokens no allowedValues declares, so they can never apply:\n       ${orphans.join("\n       ")}`
  );
});

check("every alias applies inside each feature that allows its token", () => {
  // Walks the production table the way the model would hit it: French surface
  // form in, ASCII token out, for the exact allowedValues of that feature.
  const surfaceForms = {
    high: "élevé",
    medium: "moyen",
    low: "faible",
    owned: "assumée",
    shared: "partagée",
    passive: "passif",
    concrete: "concrète",
    vague: "floue",
    missing: "manquant",
    internal: "interne",
    mixed: "mixte",
    external: "externe",
    avoided: "évitée",
    partial: "partiel",
    externalized: "externalisé",
    proactive: "proactif",
    reactive: "réactif",
    substantive: "substantiel",
    nominal: "nominale",
    generic: "générique",
    tactical: "tactique",
    performative: "démonstratif",
    constructive: "constructif",
    neutral: "neutre",
    defensive_initial: "défensif_initial",
    delivered: "livrée",
    softened: "adoucie",
    deliberate: "délibérée",
    minimal: "minimale",
    unclear: "incertain",
    direct: "directe",
    hedged: "nuancée",
    tracked: "suivie",
    respectful: "respectueuse",
    dismissive: "méprisante",
    sophisticated: "sophistiqué",
    basic: "basique",
    surface: "superficiel",
    explicit: "explicite",
    implicit: "implicite",
    genuine: "authentique",
    minor_or_reshaped: "légèrement reformulé",
    concealed_or_unclear: "masqué_ou_incertain",
    defensive_about_self: "défensif_vis_à_vis_de_soi",
  };

  let checked = 0;
  const broken = [];
  for (const rubric of Object.values(RUBRICS)) {
    for (const feature of rubric.features) {
      for (const value of feature.allowedValues) {
        const french = surfaceForms[value];
        if (!french) continue;
        const got = normalizeFeatureValue(french, feature.allowedValues);
        if (got?.value !== value) {
          broken.push(`${rubric.itemId}.${feature.name}: "${french}" -> ${got?.value ?? "null"} (expected ${value})`);
        }
        checked += 1;
      }
    }
  }
  assert.equal(
    broken.length,
    0,
    `${broken.length} French surface forms did not resolve:\n       ${broken.join("\n       ")}`
  );
  assert.ok(checked >= 40, `only ${checked} surface forms exercised, expected the full vocabulary`);
});

check("A/B: a French feature set lands on the same band as its English twin", () => {
  const pairs = [
    {
      itemId: "C-S1",
      english: {
        specificity: "high",
        first_person_agency: "high",
        problem_ownership: "owned",
        outcome_clarity: "concrete",
        attribution_pattern: "internal",
      },
      french: {
        specificity: "élevé",
        first_person_agency: "Élevé",
        problem_ownership: "assumée",
        outcome_clarity: "concrète",
        attribution_pattern: "interne",
      },
    },
    {
      itemId: "C-S1",
      english: {
        specificity: "low",
        first_person_agency: "low",
        problem_ownership: "passive",
        outcome_clarity: "missing",
        attribution_pattern: "external",
      },
      french: {
        specificity: "faible",
        first_person_agency: "Faible",
        problem_ownership: "passif",
        outcome_clarity: "manquant",
        attribution_pattern: "externe",
      },
    },
    {
      itemId: "RF-S3",
      english: {
        specificity_of_work: "high",
        depth_of_ai_workflow: "sophisticated",
        limits_awareness: "explicit",
        outcome_specificity: "concrete",
        ownership_and_agency: "high",
      },
      french: {
        specificity_of_work: "élevé",
        depth_of_ai_workflow: "sophistiqué",
        limits_awareness: "explicite",
        outcome_specificity: "concret",
        ownership_and_agency: "élevé",
      },
    },
    {
      itemId: "RF-S3",
      english: {
        specificity_of_work: "low",
        depth_of_ai_workflow: "surface",
        limits_awareness: "absent",
        outcome_specificity: "missing",
        ownership_and_agency: "low",
      },
      french: {
        specificity_of_work: "faible",
        depth_of_ai_workflow: "superficiel",
        limits_awareness: "absent",
        outcome_specificity: "manquant",
        ownership_and_agency: "faible",
      },
    },
  ];

  for (const pair of pairs) {
    const features = RUBRICS[pair.itemId].features;
    const normalised = {};
    for (const f of features) {
      const got = normalizeFeatureValue(pair.french[f.name], f.allowedValues);
      assert.ok(got, `${pair.itemId}.${f.name}: "${pair.french[f.name]}" did not normalise`);
      normalised[f.name] = got.value;
    }
    const english = assignBand(pair.itemId, pair.english);
    const french = assignBand(pair.itemId, normalised);
    assert.equal(
      french.band,
      english.band,
      `${pair.itemId}: French set scored "${french.band}" but its English twin scored "${english.band}"`
    );
    assert.deepEqual(french.rulesFired, english.rulesFired);
  }
});

console.log(failures === 0 ? "\nfeature-values: all checks passed" : `\nfeature-values: ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);