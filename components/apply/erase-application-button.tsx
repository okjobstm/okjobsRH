"use client";

import { useConfirm } from "@/components/ui/confirm-dialog";
import { deleteApplicationAction } from "@/actions/apply";

/**
 * The four mid-application stages each offered a native confirm() before
 * erasing. One shared button keeps the wording from drifting between stages,
 * which matters because it states what is destroyed and how long backups keep it.
 */
export function EraseApplicationButton() {
  const confirmDialog = useConfirm();

  return (
    <>
      <button
        type="submit"
        formAction={deleteApplicationAction}
        className="text-xs text-slate-400 hover:text-red-500 transition-colors"
        onClick={async (e) => {
          const button = e.currentTarget;
          const form = button.form;
          e.preventDefault();
          const confirmed = await confirmDialog.ask({
            title: "Effacer mes données",
            description:
              "Votre profil, votre CV et vos résultats d'analyse seront supprimés définitivement. Des copies de sauvegarde peuvent subsister jusqu'à 35 jours avant destruction définitive. Pour postuler de nouveau, vous devrez recevoir une nouvelle invitation. Cette action est irréversible.",
            confirmLabel: "Effacer mes données",
            cancelLabel: "Annuler",
            kind: "danger",
          });
          if (confirmed && form) form.requestSubmit(button);
        }}
      >
        Effacer mes données
      </button>
      {confirmDialog.dialog}
    </>
  );
}