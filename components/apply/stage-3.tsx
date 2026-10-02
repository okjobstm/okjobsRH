"use client";

import { useRef, useCallback } from "react";
import { saveStage3Action, autosaveStage3Action } from "@/actions/apply";
import { WordCountTextarea } from "./word-count";
import { useAutosave, SavedIndicator } from "./autosave-form";
import { deleteApplicationAction } from "@/actions/apply";

type RoleQuestion = { id: string; prompt: string; wordLimit: number };

export function Stage3({
  token,
  questions,
  initialAnswers,
}: {
  token: string;
  questions: RoleQuestion[];
  initialAnswers: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const getAnswers = useCallback(() => {
    if (!formRef.current) return {};
    const fd = new FormData(formRef.current);
    return Object.fromEntries(
      questions
        .map((q) => [q.id, fd.get(`answer_${q.id}`) as string | null])
        .filter((entry): entry is [string, string] => !!entry[1])
    );
  }, [questions]);

  const saveFn = useCallback(
    async (current: Record<string, string>) => {
      await autosaveStage3Action(token, current);
    },
    [token]
  );

  const { savedAt, saving } = useAutosave(saveFn, getAnswers);

  return (
    <form ref={formRef} action={saveStage3Action} className="space-y-8">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Questions sur le poste</h1>
        <p className="text-slate-500 text-sm">
          Ces questions sont adaptées à ce poste. Prenez votre temps et soyez précis.
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((q, i) => (
          <div key={q.id} className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              {i + 1}. {q.prompt}
            </label>
            <WordCountTextarea
              name={`answer_${q.id}`}
              defaultValue={initialAnswers[q.id] ?? ""}
              wordLimit={q.wordLimit}
              placeholder="Votre réponse..."
              rows={6}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <button
            type="submit"
            formAction={deleteApplicationAction}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            onClick={(e) => {
              if (!confirm("Voulez-vous vraiment supprimer votre candidature ? Cette action est irréversible.")) {
                e.preventDefault();
              }
            }}
          >
            Supprimer ma candidature
          </button>
          <SavedIndicator savedAt={savedAt} saving={saving} />
        </div>

        <button
          type="submit"
          className="bg-slate-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Continuer : Questions générales
        </button>
      </div>
    </form>
  );
}
