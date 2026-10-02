"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { setJobStatusAction, deleteJobAction } from "@/actions/jobs";
import { JOB_STATUS_LABEL } from "@/lib/format";
import type { JobStatus } from "@prisma/client";

export type SidebarJob = {
  id: string;
  title: string;
  status: string;
  candidateCount: number;
};

export function SidebarJobItem({ job }: { job: SidebarJob }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [, startTransition] = useTransition();

  const isArchived = job.status === "ARCHIVED";
  const active = pathname?.startsWith(`/admin/jobs/${job.id}`);

  function archive() {
    startTransition(async () => {
      await setJobStatusAction(job.id, "ARCHIVED");
      toast.success("Poste archivé", job.title);
      router.refresh();
    });
  }

  function unarchive() {
    startTransition(async () => {
      await setJobStatusAction(job.id, "OPEN");
      toast.success("Poste restauré", job.title);
      router.refresh();
    });
  }

  async function tryDelete() {
    const ok = await confirmDialog.ask({
      title: `Supprimer « ${job.title} » ?`,
      description:
        "Cette action supprime définitivement le poste ainsi que tous les candidats, invitations et candidatures qui lui sont rattachés. Elle est irréversible.",
      confirmLabel: "Supprimer définitivement",
      kind: "danger",
      typeToConfirm: job.title,
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteJobAction(job.id);
      toast.success("Poste supprimé", job.title);
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <li>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Link
            href={`/admin/jobs/${job.id}`}
            className={`flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm transition-colors ${
              active
                ? "bg-slate-100 text-slate-900"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <div className="min-w-0">
              <span className="block truncate">{job.title}</span>
              {job.candidateCount > 0 && (
                <span className="text-[10px] text-slate-400">
                  {job.candidateCount}{" "}
                  {job.candidateCount === 1 ? "candidat" : "candidats"}
                </span>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {JOB_STATUS_LABEL[job.status as JobStatus] ?? job.status}
            </span>
          </Link>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => router.push(`/admin/jobs/${job.id}`)}>
            Ouvrir
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => window.open(`/admin/jobs/${job.id}`, "_blank", "noopener")}
          >
            Ouvrir dans un nouvel onglet
          </ContextMenuItem>
          <ContextMenuSeparator />
          {isArchived ? (
            <>
              <ContextMenuItem onSelect={unarchive}>Restaurer depuis les archives</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem danger onSelect={tryDelete}>
                Supprimer définitivement…
              </ContextMenuItem>
            </>
          ) : (
            <ContextMenuItem onSelect={archive}>Archiver le poste</ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
      {confirmDialog.dialog}
    </li>
  );
}
