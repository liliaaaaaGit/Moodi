"use client";

import { Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  dismissIosInstallHint,
  isIosInstallHintDismissed,
  isIosSafari,
  isStandalonePwa,
} from "@/lib/push/client";

export function IosInstallHint() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isStandalonePwa()) return;
    if (!isIosSafari()) return;
    if (isIosInstallHintDismissed()) return;
    setOpen(true);
  }, []);

  function close() {
    dismissIosInstallHint();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30"
        aria-label="Hinweis schliessen"
        onClick={close}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-white px-6 pb-8 pt-5 shadow-soft-lg"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-labelledby="ios-install-title"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="ios-install-title" className="text-lg font-semibold text-text-primary">
            Tipp fuer iPhone
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Tippe auf{" "}
          <span className="inline-flex items-center gap-1 font-medium text-text-primary">
            <Share className="h-4 w-4" aria-hidden />
            Teilen
          </span>{" "}
          und dann auf{" "}
          <span className="font-medium text-text-primary">Zum Home-Bildschirm</span>, damit
          Anspannung wie eine App funktioniert.
        </p>
        <button
          type="button"
          onClick={close}
          className="mt-6 w-full min-h-touch rounded-2xl bg-primary text-sm font-medium text-white"
        >
          Verstanden
        </button>
      </div>
    </>
  );
}
