import { createJobAction } from "@/actions/jobs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Files, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JobStatus } from "@prisma/client";
import Link from "next/link";

export default function NewJobPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Créer un poste</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Collez la description du poste, renseignez les informations clés et générez un
            jeu de questions modifiable.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">← Retour</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createJobAction} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Intitulé du poste</Label>
                <Input id="title" name="title" placeholder="Responsable de programme fondateur" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yfs-accent"
                  defaultValue={JobStatus.DRAFT}
                >
                  <option value={JobStatus.DRAFT}>Brouillon</option>
                  <option value={JobStatus.OPEN}>Ouvert</option>
                  <option value={JobStatus.CLOSED}>Clôturé</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Département</Label>
                <Input id="department" name="department" placeholder="Programmes" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <Input id="location" name="location" placeholder="Singapour / Télétravail" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentType">Type de contrat</Label>
                <Input id="employmentType" name="employmentType" placeholder="Temps plein" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionFileName">Référence du nom de fichier du PDF</Label>
                <Input id="descriptionFileName" name="descriptionFileName" placeholder="programme-manager.pdf" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionText">Description du poste</Label>
              <Textarea
                id="descriptionText"
                name="descriptionText"
                rows={10}
                placeholder="Collez ici la description complète du poste. Les questions générées s’appuieront sur ce texte."
                required
              />
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Files className="h-3.5 w-3.5" />
                L’analyse des PDF arrive bientôt. Pour l’instant, collez le texte extrait de
                la description et conservez le nom de fichier comme référence.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customQuestionPrompt">Consigne de génération (facultatif)</Label>
              <Textarea
                id="customQuestionPrompt"
                name="customQuestionPrompt"
                rows={2}
                placeholder="Ajoutez un angle propre au poste, par exemple : prioriser l’animation de la communauté, la conduite de programmes et la relation avec les parties prenantes."
              />
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
              <p className="text-sm text-slate-500 max-w-xl">
                La création du poste génère également une première série de 10 questions
                spécifiques au poste, modifiables depuis la page du poste.
              </p>
              <Button type="submit">Créer le poste</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
