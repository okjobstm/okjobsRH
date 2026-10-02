"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { BorderedOverflowMenu, type MenuItem } from "@/components/admin/row-context-menu";
import { setJobStatusAction, deleteJobAction } from "@/actions/jobs";

export function JobMenu({
  jobId,
  jobTitle,
  hasReusableLink,
  reusableLinkUrl,
}: {
  jobId: string;
  jobTitle: string;
  hasReusableLink: boolean;
  reusableLinkUrl: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [, startTransition] = useTransition();

  function setStatus(status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED", successMsg: string) {
    startTransition(async () => {
      await setJobStatusAction(jobId, status);
      toast.success(successMsg, jobTitle);
      router.refresh();
    });
  }

  const items: MenuItem[] = [
    { type: "label", label: `${jobTitle.toUpperCase()} · POSTE` },
    {
      label: "Modifier la description",
      onSelect: () => router.push(`/admin/jobs/${jobId}?tab=setup`),
    },
    {
      label: "Voir le journal d’audit",
      onSelect: () => router.push(`/admin/jobs/${jobId}/audit`),
    },
    { type: "separator" },
    {
      label: "Copier le lien d’invitation public",
      kbd: "⌘L",
      disabled: !hasReusableLink || !reusableLinkUrl,
      onSelect: () => {
        if (!reusableLinkUrl) return;
        navigator.clipboard
          .writeText(reusableLinkUrl)
          .then(() => toast.success("Lien public copié"))
          .catch(() => toast.error("Copie impossible"));
      },
    },
    { type: "separator" },
    {
      label: "Clôturer aux nouveaux candidats",
      onSelect: () => setStatus("CLOSED", "Clôturé aux candidats"),
    },
    {
      label: "Archiver le poste",
      onSelect: async () => {
        const ok = await confirmDialog.ask({
          title: `Archiver « ${jobTitle} » ?`,
          description:
            "Il sera masqué sur le tableau de bord, mais toutes les données sont conservées. Vous pourrez le restaurer plus tard.",
          confirmLabel: "Archiver",
        });
        if (ok) setStatus("ARCHIVED", "Poste archivé");
      },
    },
    {
      label: "Supprimer le poste…",
      danger: true,
      onSelect: async () => {
        const ok = await confirmDialog.ask({
          title: `Supprimer « ${jobTitle} » ?`,
          description:
            "Cette action supprime définitivement le poste ainsi que tous les candidats, invitations et candidatures qui y sont rattachés. Action irréversible.",
          confirmLabel: "Supprimer définitivement",
          kind: "danger",
          typeToConfirm: jobTitle,
        });
        if (!ok) return;
        startTransition(async () => {
          await deleteJobAction(jobId);
          toast.success("Poste supprimé", jobTitle);
          router.push("/admin");
        });
      },
    },
  ];

  return (
    <>
      <BorderedOverflowMenu items={items} label="Options du poste" />
      {confirmDialog.dialog}
    </>
  );
}
