"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { usePromptDialog } from "@/components/ui/confirm-dialog";
import { RowOverflowMenu, type MenuItem } from "@/components/admin/row-context-menu";
import { LOCALE, TIME_ZONE } from "@/lib/site-config";
import { ROLE_FIT_LABEL } from "@/lib/format";
import {
  shortlistCandidateAction,
  rejectCandidateAction,
  moveToInReviewAction,
  archiveCandidateAction,
  unarchiveCandidateAction,
  updateCandidateNotesAction,
} from "@/actions/candidates";
import { assignReviewerAction } from "@/actions/reviews";
import { CandidateStage } from "@prisma/client";

export type RoleFitBand =
  | "Strong fit"
  | "Likely fit"
  | "Mixed fit"
  | "Weak fit"
  | "Likely mis-fit";

export type CandidateRowData = {
  id: string;
  name: string;
  email: string;
  stage: CandidateStage;
  submittedAt: Date | null;
  roleFit: RoleFitBand | null;
  reviewerInitials: string | null;
  notes: string | null;
};

const ROLE_FIT_CLASSES: Record<RoleFitBand, string> = {
  "Strong fit": "bg-emerald-100 text-emerald-700",
  "Likely fit": "bg-emerald-50 text-emerald-700",
  "Mixed fit": "bg-amber-50 text-amber-700",
  "Weak fit": "bg-orange-50 text-orange-700",
  "Likely mis-fit": "bg-red-50 text-red-700",
};

const STAGE_LABEL: Partial<Record<CandidateStage, { label: string; className: string }>> = {
  COMPLETED: { label: "Soumise", className: "bg-emerald-100 text-emerald-700" },
  REVIEWING: { label: "En cours d’examen", className: "bg-violet-100 text-violet-700" },
  SHORTLISTED: { label: "Présélectionné", className: "bg-blue-100 text-blue-700" },
  REJECTED: { label: "Refusé", className: "bg-red-100 text-red-600" },
  ARCHIVED: { label: "Archivé", className: "bg-slate-100 text-slate-500" },
  HIRED: { label: "Embauché", className: "bg-emerald-600 text-white" },
  OFFER: { label: "Offre", className: "bg-indigo-100 text-indigo-700" },
  WITHDRAWN: { label: "Retrait", className: "bg-slate-100 text-slate-400" },
  IN_PROGRESS: { label: "En cours", className: "bg-amber-100 text-amber-700" },
};

export function CandidateRow({
  c,
  reviewerEmails,
  selected,
  onToggle,
}: {
  c: CandidateRowData;
  reviewerEmails: string[];
  selected?: boolean;
  onToggle?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const promptDialog = usePromptDialog();
  const [pending, startTransition] = useTransition();

  function action(
    formAction: (fd: FormData) => Promise<void>,
    successTitle: string,
    extra?: Record<string, string>
  ) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("candidateId", c.id);
      if (extra) for (const [k, v] of Object.entries(extra)) fd.set(k, v);
      await formAction(fd);
      toast.success(successTitle, c.name);
      router.refresh();
    });
  }

  async function editNote() {
    const next = await promptDialog.ask({
      title: c.notes ? `Modifier la note de ${c.name}` : `Ajouter une note pour ${c.name}`,
      initialValue: c.notes ?? "",
      placeholder: "Tout élément utile pour l’équipe de recrutement…",
      multiline: true,
      confirmLabel: "Enregistrer la note",
    });
    if (next === null) return;
    startTransition(async () => {
      await updateCandidateNotesAction(c.id, next);
      toast.success(c.notes ? "Note mise à jour" : "Note ajoutée", c.name);
      router.refresh();
    });
  }

  function copyEmail() {
    navigator.clipboard
      .writeText(c.email)
      .then(() => toast.success("E-mail copié", c.email))
      .catch(() => toast.error("Copie impossible", "Presse-papiers indisponible"));
  }

  const isArchived = c.stage === CandidateStage.ARCHIVED;

  const items: MenuItem[] = [
    {
      label: "Voir la fiche",
      kbd: "↵",
      onSelect: () => router.push(`/admin/candidates/${c.id}`),
    },
    {
      label: "Ouvrir dans un nouvel onglet",
      kbd: "⌘↵",
      onSelect: () => window.open(`/admin/candidates/${c.id}`, "_blank", "noopener"),
    },
    { type: "separator" },
    { type: "label", label: "Statut" },
    { label: "★ Présélectionner", onSelect: () => action(shortlistCandidateAction, "Présélectionné") },
    { label: "Passer en cours d’examen", onSelect: () => action(moveToInReviewAction, "Passé en cours d’examen") },
    { label: "⊘ Refuser", onSelect: () => action(rejectCandidateAction, "Refusé") },
    { type: "separator" },
    {
      type: "submenu",
      label: "Affecter un évaluateur…",
      items: reviewerEmails.map((email) => ({
        label: email,
        onSelect: () => action(assignReviewerAction, `Affecté à ${email}`, { reviewerEmail: email }),
      })),
    },
    { label: c.notes ? "Modifier la note…" : "Ajouter une note…", onSelect: editNote },
    { type: "separator" },
    { label: "Copier l’e-mail", kbd: "⌘C", onSelect: copyEmail },
    { type: "separator" },
    isArchived
      ? { label: "Restaurer depuis l’archive", onSelect: () => action(unarchiveCandidateAction, "Restauré") }
      : { label: "Archiver le candidat", onSelect: () => action(archiveCandidateAction, "Archivé") },
  ];

  const stageLabel = STAGE_LABEL[c.stage];

  return (
    <tr
      className={`group cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 ${
        pending ? "opacity-60" : ""
      }`}
      onClick={() => router.push(`/admin/candidates/${c.id}`)}
    >
      <td className="w-8 px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={!!selected}
          onChange={() => onToggle?.()}
          className="h-3.5 w-3.5 rounded border-slate-300"
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2.5">
          <Avatar initials={initials(c.name)} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
            <p className="truncate text-xs text-slate-500">{c.email}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-sm text-slate-600">
        {c.submittedAt
          ? new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", timeZone: TIME_ZONE }).format(c.submittedAt)
          : "—"}
      </td>
      <td className="px-3 py-2">
        {c.roleFit ? (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_FIT_CLASSES[c.roleFit]}`}>
            {ROLE_FIT_LABEL[c.roleFit]}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        {stageLabel && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${stageLabel.className}`}>
            {stageLabel.label}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-xs text-slate-500">{c.reviewerInitials ?? "—"}</td>
      <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            title="Présélectionner"
            className="rounded-md p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
            onClick={() => action(shortlistCandidateAction, "Présélectionné")}
          >
            ★
          </button>
          <button
            type="button"
            title="Refuser"
            className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            onClick={() => action(rejectCandidateAction, "Refusé")}
          >
            ⊘
          </button>
          <RowOverflowMenu items={items} />
        </div>
        {promptDialog.dialog}
      </td>
    </tr>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
      {initials || "?"}
    </div>
  );
}
