"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SectionHeader } from "@/components/SectionHeader";
import { Toast } from "@/components/Toast";
import {
  getBrowserPushSubscription,
  getNotificationPermissionLabel,
  subscribeUserToPush,
} from "@/lib/push/client";

export function PushDebugSection() {
  const [active, setActive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "error" | "info" } | null>(
    null
  );

  const refreshActive = useCallback(async () => {
    const permission = getNotificationPermissionLabel();
    const subscription = await getBrowserPushSubscription();
    setActive(permission === "granted" && subscription !== null);
  }, []);

  useEffect(() => {
    void refreshActive();
  }, [refreshActive]);

  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(null), 5000);
    return () => window.clearTimeout(timer);
  }, [hint]);

  async function handleEnable() {
    setBusy(true);
    setHint(null);
    try {
      const result = await subscribeUserToPush();
      await refreshActive();
      if (result.ok) {
        setHint("Mitteilungen sind jetzt aktiv.");
      } else {
        setToast({
          message: result.error ?? "Aktivieren fehlgeschlagen",
          variant: "error",
        });
      }
    } catch {
      setToast({ message: "Aktivieren fehlgeschlagen", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleTestPush() {
    setBusy(true);
    setHint(null);
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        setToast({
          message: (payload.error as string) ?? "Test fehlgeschlagen",
          variant: "error",
        });
        return;
      }
      setHint("Mitteilung verschickt — sollte gleich erscheinen.");
    } catch {
      setToast({ message: "Netzwerkfehler beim Test", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  const isActive = active === true;

  return (
    <>
      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      ) : null}

      <section className="space-y-3">
        <SectionHeader>Push-Benachrichtigungen</SectionHeader>
        <Card className="space-y-4 p-4">
          {active === null ? (
            <p className="text-sm text-text-secondary">Status wird geladen…</p>
          ) : isActive ? (
            <p className="text-sm text-text-secondary">Aktiv ✓</p>
          ) : (
            <p className="text-sm text-[#C97B7B]">
              Nicht aktiv – tap unten zum Aktivieren
            </p>
          )}

          {hint ? <p className="text-sm text-primary">{hint}</p> : null}

          <button
            type="button"
            disabled={busy}
            onClick={() => void handleTestPush()}
            className="min-h-touch w-full rounded-2xl border border-primary/40 bg-white px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
          >
            Test-Mitteilung senden
          </button>

          {!isActive && active !== null ? (
            <PrimaryButton type="button" disabled={busy} onClick={() => void handleEnable()}>
              {busy ? "Bitte warten…" : "Mitteilungen aktivieren"}
            </PrimaryButton>
          ) : null}
        </Card>
      </section>
    </>
  );
}
