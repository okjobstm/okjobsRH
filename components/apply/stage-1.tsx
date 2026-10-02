"use client";

import { useState } from "react";
import { saveStage1Action } from "@/actions/apply";
import { ORG_NAME } from "@/lib/site-config";

export function Stage1({
  token,
  candidateName,
  jobTitle,
  consentGiven,
}: {
  token: string;
  candidateName: string;
  jobTitle: string;
  consentGiven: boolean;
}) {
  const [checked, setChecked] = useState(consentGiven);

  return (
    <form action={saveStage1Action} className="space-y-8">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="consentGiven" value={String(checked)} />

      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          Bienvenue, {candidateName}
        </h1>
        <p className="text-slate-500">
          Vous avez été invité à candidater au poste de{" "}
          <span className="font-medium text-slate-700">{jobTitle}</span> chez {ORG_NAME}.
        </p>
        <p className="text-slate-500">
          Cette candidature comporte six courtes sections et devrait prendre entre 45 et 60 minutes. Vous pouvez enregistrer votre progression et y revenir à tout moment grâce à ce lien.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">Mention relative à la confidentialité</h2>
        <p className="text-xs text-amber-700">
          Texte à faire valider par un juriste avant diffusion. La durée de
          conservation annoncée ici (24 mois) doit correspondre à celle de la
          politique de confidentialité.
        </p>
        <p>
          {ORG_NAME} utilisera les informations que vous fournissez dans cette candidature uniquement afin d’évaluer votre adéquation au poste décrit. Vos données seront stockées en toute sécurité et ne seront pas communiquées à des tiers en dehors de l’équipe de recrutement.
        </p>
        <p>
          Nous conservons les données de candidature pendant 24 mois au maximum. Vous pouvez à tout moment demander la suppression de vos données en nous contactant. L’envoi de ce formulaire vaut consentement de votre part au traitement de vos données personnelles à des fins de recrutement.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
        />
        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
          Je comprends et je consens à ce que {ORG_NAME} traite mes données de candidature comme décrit ci-dessus.
        </span>
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!checked}
          className="bg-slate-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continuer : Parcours
        </button>
      </div>
    </form>
  );
}
