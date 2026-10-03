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
          Texte à faire valider par un juriste avant diffusion.
        </p>
        <p>
          {ORG_NAME} utilisera les informations que vous fournissez dans cette candidature uniquement afin d’évaluer votre adéquation au poste décrit. Vos données seront stockées en toute sécurité et ne seront pas communiquées à des tiers en dehors de l’équipe de recrutement.
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
          J’accepte que mes réponses et mon CV soient analysés avec l’aide d’un
          outil d’intelligence artificielle et transmis à l’entreprise qui recrute.
          Un recruteur examine les résultats et prend la décision. Mes données sont
          conservées 24 mois à compter de ma candidature, afin que l’entreprise
          puisse me recontacter pour des postes similaires, puis supprimées
          automatiquement. Je peux demander leur effacement à tout moment.
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
