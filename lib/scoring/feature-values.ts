/**
 * Normalisation des valeurs de features renvoyées par le modèle.
 *
 * Les prompts sont en français mais les valeurs autorisées sont un contrat
 * machine ASCII : elles sont persistées dans `ItemScore.features` et comparées
 * caractère par caractère par `assignBand`. Le décodage contraint
 * (`output_config.format` dans star-scorer) est le garde-fou principal, ce module
 * est le filet pour ce qu'il laisse passer, typiquement le modèle qui renvoie le
 * libellé français lu dans le prompt au lieu du token.
 *
 * Le test croise FRENCH_VALUE_ALIASES avec les `allowedValues` de rubrics.ts pour
 * détecter les aliases devenus orphelins.
 */

const INSUFFICIENT = "insufficient";

// Clés déjà « pliées » (minuscules, sans accent, séparateurs en tiret bas).
// Ajouter une entrée ici sans ajouter le token correspondant dans un
// `allowedValues` de rubrics.ts est inutile : la valeur est validée contre les
// `allowedValues` de la feature, jamais contre cette table.
export const FRENCH_VALUE_ALIASES: Record<string, string> = {
  eleve: "high",
  fort: "high",
  forte: "high",
  moyen: "medium",
  moyenne: "medium",
  modere: "medium",
  faible: "low",
  bas: "low",
  basse: "low",
  assume: "owned",
  assumee: "owned",
  partage: "shared",
  partagee: "shared",
  passif: "passive",
  passive: "passive",
  concret: "concrete",
  concrete: "concrete",
  precis: "concrete",
  specifique: "concrete",
  flou: "vague",
  floue: "vague",
  manquant: "missing",
  interne: "internal",
  mixte: "mixed",
  melange: "mixed",
  externe: "external",
  authentique: "genuine",
  sincere: "genuine",
  mineur_ou_reformule: "minor_or_reshaped",
  legerement_reformule: "minor_or_reshaped",
  evite: "avoided",
  evitee: "avoided",
  esquive: "avoided",
  esquivee: "avoided",
  partiel: "partial",
  partielle: "partial",
  externalise: "externalized",
  externalisee: "externalized",
  proactif: "proactive",
  proactive: "proactive",
  reactif: "reactive",
  reactive: "reactive",
  masque_ou_incertain: "concealed_or_unclear",
  dissimule_ou_incertain: "concealed_or_unclear",
  substantiel: "substantive",
  substantielle: "substantive",
  nominal: "nominal",
  nominale: "nominal",
  generique: "generic",
  tactique: "tactical",
  demonstratif: "performative",
  performatif: "performative",
  constructif: "constructive",
  constructive: "constructive",
  neutre: "neutral",
  defensif_initial: "defensive_initial",
  defense_initial: "defensive_initial",
  livre: "delivered",
  livree: "delivered",
  delivre: "delivered",
  delivree: "delivered",
  adouci: "softened",
  adoucie: "softened",
  delibere: "deliberate",
  deliberee: "deliberate",
  intentionnel: "deliberate",
  intentionnelle: "deliberate",
  minimal: "minimal",
  minimale: "minimal",
  incertain: "unclear",
  incertain_ou_vague: "unclear",
  direct: "direct",
  directe: "direct",
  hediste: "hedged",
  nuance: "hedged",
  nuancee: "hedged",
  suivi: "tracked",
  suivie: "tracked",
  respectueux: "respectful",
  respectueuse: "respectful",
  meprisant: "dismissive",
  meprisante: "dismissive",
  mepris: "dismissive",
  defensif_vis_a_vis_de_soi: "defensive_about_self",
  sophistique: "sophisticated",
  sophistiquee: "sophisticated",
  basique: "basic",
  simple: "basic",
  superficiel: "surface",
  superficielle: "surface",
  explicite: "explicit",
  implicite: "implicit",
};

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[\s '’-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export type NormalizedFeatureValue = {
  value: string;
  /** Le modèle a renvoyé autre chose que le token ASCII attendu. */
  aliased: boolean;
  folded: boolean;
};

/**
 * Retourne la valeur ASCII attendue, ou null si aucune forme connue ne
 * correspond. `null` doit être traité comme un échec de scoring, jamais comme
 * une valeur par défaut : un score inventé est pire qu'une absence de score.
 */
export function normalizeFeatureValue(
  raw: string,
  allowedValues: string[]
): NormalizedFeatureValue | null {
  const trimmed = raw.trim();
  if (trimmed === INSUFFICIENT) return { value: INSUFFICIENT, aliased: false, folded: false };

  const lowered = trimmed.toLowerCase();
  if (allowedValues.includes(lowered)) return { value: lowered, aliased: false, folded: false };

  const folded = fold(lowered);
  if (allowedValues.includes(folded)) return { value: folded, aliased: false, folded: true };

  const alias = FRENCH_VALUE_ALIASES[folded];
  if (alias && allowedValues.includes(alias)) return { value: alias, aliased: true, folded: true };

  return null;
}