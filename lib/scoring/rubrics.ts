/**
 * STAR behavioral item rubric definitions.
 *
 * Each rubric defines:
 *  - the set of features a scorer LLM must extract from a candidate's response
 *  - the allowed categorical values for each feature
 *  - a minimum response length below which scoring is skipped as `insufficient`
 *
 * These definitions are consumed by `star-scorer.ts` at prompt-build time and by
 * `band-rules.ts` when mapping extracted features to a band estimate.
 */

export type FeatureDef = {
  name: string;
  allowedValues: string[];
  extractionPrompt: string;
};

export type ItemRubric = {
  itemId: string;
  rubricVersion: string;
  minLength: number;
  features: FeatureDef[];
};

export const RUBRICS: Record<string, ItemRubric> = {
  "C-S1": {
    itemId: "C-S1",
    rubricVersion: "v1",
    minLength: 150,
    features: [
      {
        name: "specificity",
        allowedValues: ["high", "medium", "low"],
        extractionPrompt: `Évaluez la spécificité de cette réponse sur une échelle à 3 points.
HIGH : nomme un projet ou une tâche précise, une période, des personnes et/ou des livrables ou des métriques concrets.
MEDIUM : contient quelques détails concrets mais reste en partie abstraite.
LOW : reste largement abstraite ou générique, sans repère précis.
Retourne exactement un mot parmi : high, medium, low.`,
      },
      {
        name: "first_person_agency",
        allowedValues: ["high", "medium", "low"],
        extractionPrompt: `Évaluez à quel point cette réponse exprime une action portée par la première personne.
HIGH : le candidat décrit clairement des actions précises qu’il a lui-même menées.
MEDIUM : quelques actions personnelles, mêlées à une description au niveau de l’équipe.
LOW : décrit principalement ce que l’équipe ou l’organisation a fait ; le rôle précis du candidat reste flou.
Retourne exactement un mot parmi : high, medium, low.`,
      },
      {
        name: "problem_ownership",
        allowedValues: ["owned", "shared", "passive"],
        extractionPrompt: `Lorsque la situation a dévié, le candidat a-t-il porté la résolution ?
OWNED : le candidat a activement porté la résolution.
SHARED : le candidat a participé à une résolution collective.
PASSIVE : le problème a été traité par d’autres ou par les circonstances ; le candidat décrit avoir subi la résolution plutôt que l’avoir provoquée.
Retourne exactement un mot parmi : owned, shared, passive.`,
      },
      {
        name: "outcome_clarity",
        allowedValues: ["concrete", "vague", "missing"],
        extractionPrompt: `Un résultat clair et précis est-il décrit ?
CONCRETE : résultat précis et détaillé (ce qui a été livré, ce qui a changé, quel effet mesurable a été obtenu).
VAGUE : résultat évoqué sans aucune précision.
MISSING : aucun résultat clair n’est décrit.
Retourne exactement un mot parmi : concrete, vague, missing.`,
      },
      {
        name: "attribution_pattern",
        allowedValues: ["internal", "mixed", "external"],
        extractionPrompt: `Comment le candidat attribue-t-il la cause du problème ?
INTERNAL : il attribue des facteurs contributifs importants à ses propres décisions ou à ses propres actions.
MIXED : attribution équilibrée entre lui-même et des facteurs externes.
EXTERNAL : il attribue la cause principalement à autrui ou aux circonstances.
Retourne exactement un mot parmi : internal, mixed, external.`,
      },
    ],
  },
  "C-S2": {
    itemId: "C-S2",
    rubricVersion: "v1",
    minLength: 150,
    features: [
      {
        name: "mistake_genuineness",
        allowedValues: ["genuine", "minor_or_reshaped", "avoided"],
        extractionPrompt: `Évaluez si la réponse décrit une erreur authentique et substantielle.
GENUINE : une erreur réelle et non triviale, avec des conséquences négatives claires pour autrui, et reconnue par le candidat.
MINOR_OR_RESHAPED : une petite erreur, ou un événement reformulé en erreur sans que cela en soit vraiment une (par exemple « j’ai trop travaillé »).
AVOIDED : la réponse ne décrit aucune erreur réelle ; elle se replie sur un récit neutre ou positif.
Retourne exactement un mot parmi : genuine, minor_or_reshaped, avoided.`,
      },
      {
        name: "ownership",
        allowedValues: ["owned", "partial", "externalized"],
        extractionPrompt: `Comment le candidat attribue-t-il la responsabilité de l’erreur ?
OWNED : reconnaissance explicite à la première personne, sans externalisation significative.
PARTIAL : responsabilité partagée, avec une externalisation significative de la faute.
EXTERNALIZED : la faute principale est placée sur autrui, sur les circonstances ou sur les systèmes.
Retourne exactement un mot parmi : owned, partial, externalized.`,
      },
      {
        name: "disclosure_behavior",
        allowedValues: ["proactive", "reactive", "concealed_or_unclear"],
        extractionPrompt: `Le candidat a-t-il signalé de lui-même l’erreur aux personnes concernées ?
PROACTIVE : le candidat a soulevé la question avant qu’elle ne soit découverte par d’autres.
REACTIVE : le candidat l’a reconnue lorsqu’on l’a interpelé ou lorsque le problème a été mis au jour.
CONCEALED_OR_UNCLEAR : le candidat n’a rien signalé, ou son comportement de signalement reste indéterminé d’après la réponse.
Retourne exactement un mot parmi : proactive, reactive, concealed_or_unclear.`,
      },
      {
        name: "correction_action",
        allowedValues: ["substantive", "nominal", "absent"],
        extractionPrompt: `Qu’a fait le candidat pour corriger l’erreur ?
SUBSTANTIVE : des actions précises pour corriger, limiter le préjudice ou éviter la récidive.
NOMINAL : reconnaissance ou excuses, sans action corrective significative décrite.
ABSENT : aucune correction n’est décrite.
Retourne exactement un mot parmi : substantive, nominal, absent.`,
      },
      {
        name: "reflection_quality",
        allowedValues: ["genuine", "generic", "absent"],
        extractionPrompt: `Le candidat décrit-il un apprentissage authentique ou un comportement révisé ?
GENUINE : un changement précis de méthode, de conviction ou de comportement, lié à l’erreur.
GENERIC : une leçon générique (« j’ai appris à mieux communiquer ») sans changement de comportement identifiable.
ABSENT : aucune réflexion sur ce qui a été appris.
Retourne exactement un mot parmi : genuine, generic, absent.`,
      },
    ],
  },
  "C-S3": {
    itemId: "C-S3",
    rubricVersion: "v1",
    minLength: 120,
    features: [
      {
        name: "specificity_of_original_view",
        allowedValues: ["high", "medium", "low"],
        extractionPrompt: `Évaluez le degré de précision de la description de la conviction initiale.
HIGH : la conviction initiale est décrite précisément (ce que le candidat pensait et pourquoi).
MEDIUM : la conviction est évoquée mais de manière abstraite.
LOW : la conviction initiale n’est pas décrite de manière significative.
Retourne exactement un mot parmi : high, medium, low.`,
      },
      {
        name: "specificity_of_counterargument",
        allowedValues: ["high", "medium", "low"],
        extractionPrompt: `Évaluez le degré de précision de la description de la contre-argumentation.
HIGH : ce que l’autre personne a dit est décrit précisément.
MEDIUM : évoquée de manière abstraite.
LOW : pas décrite de manière significative.
Retourne exactement un mot parmi : high, medium, low.`,
      },
      {
        name: "nature_of_shift",
        allowedValues: ["substantive", "tactical", "performative"],
        extractionPrompt: `Évaluez la nature de l’évolution des convictions du candidat.
SUBSTANTIVE : un changement authentique de conviction ou de modèle mental, et pas seulement de comportement.
TACTICAL : un changement de méthode, sans évolution de la conviction sous-jacente.
PERFORMATIVE : la réponse décrit avoir « appris quelque chose », sans aucun indice de mise à jour réelle.
Retourne exactement un mot parmi : substantive, tactical, performative.`,
      },
      {
        name: "interpersonal_handling",
        allowedValues: ["constructive", "neutral", "defensive_initial"],
        extractionPrompt: `Comment le candidat a-t-il géré l’aspect relationnel de la contradiction ?
CONSTRUCTIVE : le candidat décrit un échange ouvert sur la contradiction, sans défensive.
NEUTRAL : la gestion n’est pas clairement décrite.
DEFENSIVE_INITIAL : le candidat décrit une défensive initiale suivie d’une mise à jour (ce qui est normal et honnête ; cela ne doit pas être pénalisé).
Retourne exactement un mot parmi : constructive, neutral, defensive_initial.`,
      },
    ],
  },
  "C-S4": {
    itemId: "C-S4",
    rubricVersion: "v1",
    minLength: 150,
    features: [
      {
        name: "feedback_delivered",
        allowedValues: ["delivered", "softened", "avoided"],
        extractionPrompt: `Le retour difficile a-t-il réellement été transmis ?
DELIVERED : le candidat a clairement transmis le message difficile.
SOFTENED : le candidat décrit une version édulcorée du message.
AVOIDED : le candidat n’a finalement pas transmis le retour.
Retourne exactement un mot parmi : delivered, softened, avoided.`,
      },
      {
        name: "preparation",
        allowedValues: ["deliberate", "minimal", "unclear"],
        extractionPrompt: `À quel point le candidat était-il préparé ?
DELIBERATE : le candidat décrit une préparation précise (réflexion sur la façon de cadrer le message, choix du moment et du lieu).
MINIMAL : retour donné sans aucune préparation décrite.
UNCLEAR : préparation non décrite.
Retourne exactement un mot parmi : deliberate, minimal, unclear.`,
      },
      {
        name: "directness",
        allowedValues: ["direct", "hedged", "unclear"],
        extractionPrompt: `Le langage a-t-il été décrit comme direct ?
DIRECT : le candidat décrit un langage précis et direct.
HEDGED : décrit un langage indirect ou fortement atténué.
UNCLEAR : le degré de directeté du langage n’est pas décrit.
Retourne exactement un mot parmi : direct, hedged, unclear.`,
      },
      {
        name: "follow_through",
        allowedValues: ["tracked", "absent"],
        extractionPrompt: `Le candidat a-t-il assuré le suivi de l’impact du retour ?
TRACKED : le candidat décrit avoir assuré le suivi de l’impact du retour.
ABSENT : aucun suivi n’est décrit.
Retourne exactement un mot parmi : tracked, absent.`,
      },
      {
        name: "tone_about_other_person",
        allowedValues: ["respectful", "dismissive", "defensive_about_self"],
        extractionPrompt: `Comment le candidat décrit-il le destinataire du retour ?
RESPECTFUL : le candidat décrit le destinataire sans le dénigrer.
DISMISSIVE : le candidat décrit le destinataire sur un ton dédaignant ou méprisant.
DEFENSIVE_ABOUT_SELF : le cadrage du candidat est surtout défensif au sujet de sa propre réputation.
Retourne exactement un mot parmi : respectful, dismissive, defensive_about_self.`,
      },
    ],
  },
  "RF-S3": {
    itemId: "RF-S3",
    rubricVersion: "v1",
    minLength: 200,
    features: [
      {
        name: "specificity_of_work",
        allowedValues: ["high", "medium", "low"],
        extractionPrompt: `Évaluez la spécificité du travail décrit.
HIGH : un projet précis, des outils nommés, des livrables concrets décrits.
MEDIUM : quelques éléments précis, mêlés à de l’abstraction.
LOW : description générique de « l’usage de l’IA » sans aucun détail de projet réel.
Retourne exactement un mot parmi : high, medium, low.`,
      },
      {
        name: "depth_of_ai_workflow",
        allowedValues: ["sophisticated", "basic", "surface"],
        extractionPrompt: `Évaluez la profondeur du workflow d’IA décrit.
SOPHISTICATED : décrit des itérations, la structuration des prompts, l’enchaînement d’outils, la construction d’un workflow ou d’une chaîne de traitement, ou l’intégration de l’IA à un processus plus large.
BASIC : décrit un usage direct de l’IA (demander → recevoir → utiliser) sans itération ni structure.
SURFACE : décrit un usage de l’IA sous forme de requêtes ponctuelles, sans réflexion sur le workflow.
Retourne exactement un mot parmi : sophisticated, basic, surface.`,
      },
      {
        name: "limits_awareness",
        allowedValues: ["explicit", "implicit", "absent"],
        extractionPrompt: `Le candidat décrit-il les limites de l’IA qu’il a rencontrées ?
EXPLICIT : le candidat décrit des modes de défaillance précis de l’IA qu’il a rencontrés, ainsi que la façon dont il les a gérés.
IMPLICIT : le candidat montre qu’il a conscience des limites de l’IA, sans exemple précis de défaillance.
ABSENT : le candidat présente l’IA comme uniformément utile, sans aucune reconnaissance de ses limites.
Retourne exactement un mot parmi : explicit, implicit, absent.`,
      },
      {
        name: "outcome_specificity",
        allowedValues: ["concrete", "vague", "missing"],
        extractionPrompt: `Un résultat précis est-il décrit ?
CONCRETE : un livrable ou un résultat précis est décrit.
VAGUE : le résultat est évoqué sans aucune précision.
MISSING : aucun résultat n’est décrit.
Retourne exactement un mot parmi : concrete, vague, missing.`,
      },
      {
        name: "ownership_and_agency",
        allowedValues: ["high", "medium", "low"],
        extractionPrompt: `Évaluez le degré d’autonomie du candidat dans la conduite du travail avec l’IA.
HIGH : le candidat a clairement piloté le travail ; l’IA était un outil qu’il pilotait.
MEDIUM : le candidat a travaillé avec l’IA ; responsabilité partagée.
LOW : le candidat décrit l’IA comme ayant fait le travail, son rôle restant flou.
Retourne exactement un mot parmi : high, medium, low.`,
      },
    ],
  },
};
