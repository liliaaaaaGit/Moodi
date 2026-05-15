"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckinDeleteModal } from "@/components/history/CheckinDeleteModal";
import { Toast } from "@/components/Toast";

type CheckinDetailActionsProps = {
  checkinId: string;
};

export function CheckinDetailActions({ checkinId }: CheckinDetailActionsProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setToast(null);

    try {
      const response = await fetch(`/api/checkin/${checkinId}`, { method: "DELETE" });
      if (!response.ok) {
        setToast("Konnte nicht gespeichert werden, versuch es nochmal");
        setDeleting(false);
        return;
      }

      setDeleteOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      setToast("Konnte nicht gespeichert werden, versuch es nochmal");
      setDeleting(false);
    }
  }

  return (
    <>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}

      <div className="mt-12 flex gap-3 pb-8">
        <Link
          href={`/history/${checkinId}/edit`}
          className="min-h-touch flex flex-1 items-center justify-center rounded-2xl border-2 border-primary bg-white text-sm font-medium text-primary"
        >
          Bearbeiten
        </Link>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="min-h-touch flex flex-1 items-center justify-center rounded-2xl border-2 border-warning bg-white text-sm font-medium text-warning"
        >
          Löschen
        </button>
      </div>

      <CheckinDeleteModal
        open={deleteOpen}
        loading={deleting}
        onCancel={() => {
          if (!deleting) setDeleteOpen(false);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
