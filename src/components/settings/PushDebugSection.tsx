"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SectionHeader } from "@/components/SectionHeader";
import { Toast } from "@/components/Toast";
import {
  getBrowserPushSubscription,
  getClientVapidPublicKey,
  getNotificationPermissionLabel,
  getServiceWorkerControllerLabel,
  subscribeUserToPush,
  unsubscribeFromPush,
} from "@/lib/push/client";

type PushStatus = {
  permission: string;
  serviceWorker: string;
  browserSubscription: string;
  dbSaved: string;
  vapidKeyLength: string;
};

const INITIAL_STATUS: PushStatus = {
  permission: "…",
  serviceWorker: "…",
  browserSubscription: "…",
  dbSaved: "…",
  vapidKeyLength: "…",
};

export function PushDebugSection() {
  const [status, setStatus] = useState<PushStatus>(INITIAL_STATUS);
  const [logs, setLogs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "error" | "info" } | null>(
    null
  );

  const appendLog = useCallback((line: string) => {
    const stamp = new Date().toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [`[${stamp}] ${line}`, ...prev].slice(0, 12));
  }, []);

  const showToast = useCallback(
    (message: string, variant: "error" | "info" = "info") => {
      setToast({ message, variant });
      appendLog(variant === "error" ? `FEHLER: ${message}` : `OK: ${message}`);
    },
    [appendLog]
  );

  const refreshStatus = useCallback(async () => {
    const permission = getNotificationPermissionLabel();
    const serviceWorker = getServiceWorkerControllerLabel();
    const browserSub = await getBrowserPushSubscription();
    const vapidKey = getClientVapidPublicKey();

    let dbSaved = "nein";
    try {
      const response = await fetch("/api/settings");
      const payload = await response.json();
      if (response.ok && payload.pushSubscribed) {
        dbSaved = "ja";
      }
    } catch {
      dbSaved = "Fehler beim Laden";
    }

    setStatus({
      permission,
      serviceWorker,
      browserSubscription: browserSub ? "vorhanden" : "fehlt",
      dbSaved,
      vapidKeyLength: vapidKey ? String(vapidKey.length) : "fehlt",
    });
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function handleRequestPermission() {
    setBusy(true);
    appendLog("Start: Mitteilungen erneut anfragen…");

    try {
      const result = await subscribeUserToPush();
      await refreshStatus();

      if (result.ok) {
        showToast("Erfolg: Permission granted, Subscription erstellt und in DB gespeichert.", "info");
      } else {
        showToast(
          `Fehler (${result.step ?? "?"}): ${result.error ?? "Unbekannt"}`,
          "error"
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      showToast(`Exception: ${msg}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleTestPush() {
    setBusy(true);
    appendLog("Start: Test-Mitteilung senden…");

    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        showToast(
          `Test fehlgeschlagen (${response.status}): ${payload.error ?? "Unbekannt"}`,
          "error"
        );
        return;
      }

      showToast(
        payload.message ?? "Test-Push gesendet — Mitteilung sollte gleich erscheinen.",
        "info"
      );
    } catch {
      showToast("Netzwerkfehler beim Test-Push", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetSubscription() {
    setBusy(true);
    appendLog("Start: Subscription löschen und neu erstellen…");

    try {
      const unsub = await unsubscribeFromPush();
      if (!unsub.ok) {
        showToast(`Client-Unsubscribe: ${unsub.error}`, "error");
      } else {
        appendLog("Client: Subscription entfernt");
      }

      const clearRes = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearPushSubscription: true }),
      });
      const clearPayload = await clearRes.json();
      if (!clearRes.ok) {
        showToast(`DB löschen fehlgeschlagen: ${clearPayload.error ?? "?"}`, "error");
        await refreshStatus();
        return;
      }
      appendLog("DB: push_subscription gelöscht");

      const subscribe = await subscribeUserToPush();
      await refreshStatus();

      if (subscribe.ok) {
        showToast("Reset erfolgreich: neue Subscription aktiv und gespeichert.", "info");
      } else {
        showToast(
          `Reset teilweise — DB geleert, Neu-Subscribe fehlgeschlagen (${subscribe.step}): ${subscribe.error}`,
          "error"
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannt";
      showToast(`Reset-Exception: ${msg}`, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}

      <section className="space-y-3">
        <SectionHeader>Push-Benachrichtigungen</SectionHeader>
        <Card className="space-y-4 p-4">
          <p className="text-xs text-text-secondary">
            Debug-Hilfe für Push-Probleme. App vom Home-Bildschirm öffnen (PWA).
          </p>

          <dl className="space-y-2 text-sm">
            <StatusRow label="Permission" value={status.permission} />
            <StatusRow label="Service Worker" value={status.serviceWorker} />
            <StatusRow label="Push Subscription" value={status.browserSubscription} />
            <StatusRow label="In DB gespeichert" value={status.dbSaved} />
            <StatusRow label="VAPID Key (Länge)" value={status.vapidKeyLength} />
          </dl>

          <button
            type="button"
            onClick={() => {
              appendLog("Status aktualisiert");
              void refreshStatus();
            }}
            className="text-sm text-primary underline"
          >
            Status aktualisieren
          </button>

          <div className="space-y-2">
            <PrimaryButton
              type="button"
              disabled={busy}
              onClick={() => void handleRequestPermission()}
            >
              Mitteilungen erneut anfragen
            </PrimaryButton>
            <PrimaryButton
              type="button"
              disabled={busy}
              onClick={() => void handleTestPush()}
              className="!bg-primary/90"
            >
              Test-Mitteilung jetzt senden
            </PrimaryButton>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleResetSubscription()}
              className="min-h-touch w-full rounded-2xl border border-warning/40 bg-white px-4 py-3 text-sm font-medium text-warning"
            >
              Subscription löschen und neu erstellen
            </button>
          </div>

          {logs.length > 0 ? (
            <div className="rounded-xl bg-bg p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
                Log
              </p>
              <ul className="max-h-40 space-y-1 overflow-y-auto font-mono text-xs text-text-secondary">
                {logs.map((line, index) => (
                  <li key={`${line}-${index}`}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      </section>
    </>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  const isOk =
    value === "granted" ||
    value === "aktiv" ||
    value === "vorhanden" ||
    value === "ja";
  const isBad =
    value === "denied" ||
    value === "fehlt" ||
    value === "nein" ||
    value === "nicht registriert" ||
    value === "nicht unterstützt";

  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-text-secondary">{label}</dt>
      <dd
        className={
          isOk
            ? "font-medium text-primary"
            : isBad
              ? "font-medium text-warning"
              : "font-medium text-text-primary"
        }
      >
        {value}
      </dd>
    </div>
  );
}
