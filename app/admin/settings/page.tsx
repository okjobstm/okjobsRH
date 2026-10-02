import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { updatePromptTemplateAction } from "@/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";

const TEMPLATE_META: Record<string, { title: string; description: string }> = {
  star_scoring: {
    title: "Prompt de scoring de la grille STAR",
    description:
      "Modèle utilisé pour extraire les critères de la grille à partir des réponses STAR des candidats. Variables : {{item_prompt}}, {{response_text}}, {{rubric_features}}.",
  },
  followup_generation: {
    title: "Prompt de génération des questions de relance",
    description:
      "Modèle utilisé pour suggérer des questions de relance en entretien à partir des tendances des candidats. Variables : {{patterns}}, {{excerpts}}. Pas encore relié à la génération en production.",
  },
};

const TEMPLATE_ORDER = ["star_scoring", "followup_generation"];

export default async function SettingsPage() {
  await requireAuth();

  const templates = await prisma.promptTemplate.findMany({ orderBy: { key: "asc" } });
  const byKey = new Map(templates.map((t) => [t.key, t]));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Paramètres</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Modifiez les prompts utilisés par le pipeline de scoring IA.
        </p>
      </div>

      {TEMPLATE_ORDER.map((key) => {
        const template = byKey.get(key);
        const meta = TEMPLATE_META[key];
        return (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{meta.title}</CardTitle>
              <CardDescription>
                {meta.description}
                {template && (
                  <span className="block mt-1 text-xs text-slate-400">
                    Version {template.version} · dernière modification le{" "}
                    {formatDateTime(template.updatedAt)}
                    {template.updatedBy ? ` par ${template.updatedBy}` : ""}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updatePromptTemplateAction} className="space-y-3">
                <input type="hidden" name="key" value={key} />
                <Textarea
                  name="body"
                  defaultValue={template?.body ?? ""}
                  rows={16}
                  className="font-mono text-xs leading-relaxed"
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    Enregistrer le modèle
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
