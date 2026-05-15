"use client";

type CheckinDeleteModalProps = {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CheckinDeleteModal({
  open,
  loading,
  onCancel,
  onConfirm,
}: CheckinDeleteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Abbrechen"
        onClick={onCancel}
      />
      <div
        className="relative mx-auto w-full max-w-sm rounded-t-3xl bg-white px-6 pb-8 pt-6 shadow-soft-lg sm:rounded-3xl"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-labelledby="delete-checkin-title"
      >
        <h2 id="delete-checkin-title" className="text-lg font-semibold text-text-primary">
          Wirklich löschen?
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Dieser Eintrag wird endgültig entfernt.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-touch flex-1 rounded-2xl border border-accent/50 bg-white text-sm font-medium text-text-secondary"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="min-h-touch flex-1 rounded-2xl bg-warning text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Löscht…" : "Ja, löschen"}
          </button>
        </div>
      </div>
    </div>
  );
}
