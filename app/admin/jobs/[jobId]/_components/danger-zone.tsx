"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setJobStatusAction, deleteJobAction } from "@/actions/jobs";

export function DangerZone({
  jobId,
  jobTitle,
  status,
}: {
  jobId: string;
  jobTitle: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState("");

  function setStatus(next: "CLOSED" | "ARCHIVED") {
    startTransition(async () => {
      await setJobStatusAction(jobId, next);
      router.refresh();
    });
  }

  function tryDelete() {
    if (typed.trim() !== jobTitle.trim()) return;
    startTransition(async () => {
      await deleteJobAction(jobId);
      router.push("/admin");
    });
  }

  return (
    <div className="rounded-md border border-dashed border-red-200 bg-red-50/40 p-4">
      <h3 className="text-sm font-semibold text-red-700">Zone sensible</h3>
      <p className="mt-1 text-xs text-slate-500">
        Clôturez, archivez ou supprimez ce poste. L’archivage le masque sur le tableau de
        bord tout en conservant les données. La suppression efface définitivement le poste et
        tous ses candidats.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || status === "CLOSED" || status === "ARCHIVED"}
          onClick={() => setStatus("CLOSED")}
        >
          Clôturer aux candidats
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || status === "ARCHIVED"}
          onClick={() => setStatus("ARCHIVED")}
        >
          Archiver le poste
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => setConfirmDelete(true)}
        >
          Supprimer le poste…
        </Button>
      </div>

      {confirmDelete && (
        <div className="mt-4 rounded-md border border-red-300 bg-white p-3">
          <Label htmlFor="confirm-delete" className="text-xs text-slate-700">
            Saisissez le nom du poste pour confirmer : <b>{jobTitle}</b>
          </Label>
          <Input
            id="confirm-delete"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={jobTitle}
            className="mt-1.5"
            autoFocus
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setConfirmDelete(false);
                setTyped("");
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending || typed.trim() !== jobTitle.trim()}
              onClick={tryDelete}
            >
              {pending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
