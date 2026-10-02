"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { useConfirm, usePromptDialog } from "@/components/ui/confirm-dialog";
import { RowOverflowMenu, type MenuItem } from "@/components/admin/row-context-menu";
import {
  revokeInviteAction,
  extendInviteExpiryAction,
  regenerateInviteTokenAction,
  deleteInviteAction,
  markInviteCopiedAction,
} from "@/actions/jobs";
import { applyUrl } from "@/lib/base-url";

export type InviteRowData = {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  token: string;
  status: string;
  isStale: boolean;
};

export function InviteRowMenu({ invite }: { invite: InviteRowData }) {
  const router = useRouter();
  const toast = useToast();
  const confirmDialog = useConfirm();
  const promptDialog = usePromptDialog();
  const [, startTransition] = useTransition();
  const url = applyUrl(invite.token);

  function run(fn: () => Promise<void>, successMsg: string) {
    startTransition(async () => {
      await fn();
      toast.success(successMsg, invite.candidateName);
      router.refresh();
    });
  }

  const items: MenuItem[] = [
    {
      label: "Copier le lien d’invitation",
      kbd: "⌘C",
      onSelect: () => {
        navigator.clipboard
          .writeText(url)
          .then(() => toast.success("Lien copié", invite.candidateEmail))
          .catch(() => toast.error("Copie impossible"));
        markInviteCopiedAction(invite.id, invite.jobId).catch(() => {});
      },
    },
    {
      label: "Ouvrir comme le candidat la voit",
      kbd: "⌘O",
      onSelect: () => window.open(url, "_blank", "noopener"),
    },
    { type: "separator" },
    {
      label: "Prolonger la validité…",
      onSelect: async () => {
        const raw = await promptDialog.ask({
          title: "Prolonger la validité de l’invitation",
          description: `De combien de jours prolonger l’invitation de ${invite.candidateName} ?`,
          initialValue: "14",
          placeholder: "Jours (1–180)",
          confirmLabel: "Prolonger",
          validate: (v) => {
            const n = parseInt(v, 10);
            if (!Number.isFinite(n) || n < 1 || n > 180) return "Saisissez un nombre entre 1 et 180.";
            return null;
          },
        });
        if (!raw) return;
        const days = parseInt(raw, 10);
        run(() => extendInviteExpiryAction(invite.id, invite.jobId, days), `Validité prolongée de ${days} jours`);
      },
    },
    {
      label: "Régénérer le jeton",
      onSelect: async () => {
        const ok = await confirmDialog.ask({
          title: "Régénérer le jeton ?",
          description: "Le lien actuel cessera de fonctionner immédiatement. Toute personne conservant l’ancienne URL verra une page de lien expiré.",
          confirmLabel: "Régénérer",
        });
        if (ok) run(() => regenerateInviteTokenAction(invite.id, invite.jobId), "Jeton régénéré");
      },
    },
    { type: "separator" },
    {
      label: "Révoquer l’invitation",
      disabled: invite.status !== "ACTIVE",
      onSelect: () => run(() => revokeInviteAction(invite.id, invite.jobId), "Invitation révoquée"),
    },
    {
      label: "Supprimer…",
      danger: true,
      onSelect: async () => {
        const ok = await confirmDialog.ask({
          title: `Supprimer l’invitation de ${invite.candidateName} ?`,
          description: "Cette action supprime définitivement l’invitation et les données de candidature déjà enregistrées par le candidat. Action irréversible.",
          confirmLabel: "Supprimer",
          kind: "danger",
        });
        if (ok) run(() => deleteInviteAction(invite.id, invite.jobId), "Invitation supprimée");
      },
    },
  ];

  return (
    <>
      <RowOverflowMenu items={items} />
      {confirmDialog.dialog}
      {promptDialog.dialog}
    </>
  );
}
