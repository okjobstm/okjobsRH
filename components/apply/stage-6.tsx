"use client";

import { useState } from "react";
import { submitApplicationAction } from "@/actions/apply";
import { WordCountTextarea } from "./word-count";

type StageStatus = { label: string; complete: boolean };

export function Stage6({
  token,
  initialReflection,
  stageStatuses,
}: {
  token: string;
  initialReflection: string | null;
  stageStatuses: StageStatus[];
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <form action={submitApplicationAction} className="space-y-8">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Vérifier et envoyer</h1>
        <p className="text-slate-500 text-sm">
          Vous avez presque terminé. Prenez un instant pour ajouter vos dernières réflexions, puis envoyez votre candidature.
        </p>
      </div>

      {/* Completion checklist */}
      <div className="rounded-lg border border-slate-200 p-4 space-y-2">
        <p className="text-sm font-medium text-slate-900 mb-3">Récapitulatif de la candidature</p>
        {stageStatuses.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {s.complete ? (
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className={s.complete ? "text-slate-700" : "text-slate-400"}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Final reflection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-900">
          Autre chose à nous dire <span className="text-slate-400 font-normal">(facultatif)</span>
        </label>
        <WordCountTextarea
          name="finalReflection"
          defaultValue={initialReflection ?? ""}
          wordLimit={400}
          placeholder="Tout ce qui n’a pas trouvé sa place ailleurs, ou tout contexte qui nous aiderait à comprendre votre candidature."
          rows={5}
        />
      </div>

      {/* Submit confirmation */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
        <p className="text-sm font-medium text-amber-900">Tout est prêt pour l’envoi</p>
        <p className="text-sm text-amber-800">
          Une fois envoyée, vous ne pourrez plus modifier votre candidature.
        </p>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-amber-300 accent-slate-900"
          />
          <span className="text-sm text-amber-900">
            Je confirme que je souhaite envoyer ma candidature.
          </span>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!confirmed}
          className="bg-slate-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Envoyer ma candidature
        </button>
      </div>
    </form>
  );
}
