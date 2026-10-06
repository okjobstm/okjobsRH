import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STAGE_LABELS: Record<string, string> = {
  NOT_STARTED: "À commencer",
  IN_PROGRESS: "En cours",
  COMPLETED: "Envoyée",
  REVIEWING: "En cours d’examen",
  SHORTLISTED: "Présélectionnée",
  OFFER: "Offre reçue",
  HIRED: "Retenue",
  REJECTED: "Non retenue",
  WITHDRAWN: "Retirée",
  ARCHIVED: "Archivée",
};

function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{children}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getAuthedUser();
  if (!user) redirect("/login");
  if (user.role !== "CANDIDATE") redirect("/admin");

  if (user.role === "CANDIDATE") {
    const applications = await prisma.candidate.findMany({
      where: { email: { equals: user.email, mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        stage: true,
        completionPercent: true,
        job: { select: { title: true, department: true } },
        invite: { select: { token: true } },
      },
    });

    return (
      <DashboardShell email={user.email} role="CANDIDATE">
        <div className="space-y-8">
          <header>
            <p className="text-sm font-medium text-blue-600">Espace candidat</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="mt-2 text-sm text-slate-500">Suivez vos candidatures et reprenez un dossier en cours.</p>
          </header>

          <section aria-labelledby="applications-title" id="applications">
            <div className="mb-4 flex items-center gap-2">
              <FileText aria-hidden="true" className="size-5 text-slate-500" />
              <h2 className="text-lg font-semibold" id="applications-title">Mes candidatures</h2>
            </div>
            {applications.length ? (
              <div className="grid gap-4">
                {applications.map((application) => (
                  <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={application.id}>
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                      <div>
                        <h3 className="font-semibold">{application.job.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {application.job.department ?? "Candidature"} · {STAGE_LABELS[application.stage] ?? application.stage}
                        </p>
                        <p className="mt-3 text-xs font-medium text-slate-500">Progression : {application.completionPercent}%</p>
                      </div>
                      <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" href={`/apply/${application.invite.token}`}>
                        {application.completionPercent >= 100 ? "Consulter" : "Continuer"}
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="Aucune candidature associée">
                Les candidatures envoyées avec {user.email} apparaîtront ici. Vous pouvez également ouvrir le lien reçu par courriel.
              </EmptyState>
            )}
          </section>
        </div>
      </DashboardShell>
    );
  }
}
