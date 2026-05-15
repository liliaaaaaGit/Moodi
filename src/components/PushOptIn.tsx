"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import {
  hasPushBeenAsked,
  isStandalonePwa,
  markPushAsked,
  markPushDismissed,
  subscribeToPush,
} from "@/lib/push/client";

export function PushOptIn() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStandalonePwa()) return;
    if (hasPushBeenAsked()) return;
    if (!("Notification" in window) || !("PushManager" in window)) return;

    async function checkExisting() {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          setVisible(true);
          return;
        }
        const payload = await response.json();
        if (payload.pushSubscribed) {
          markPushAsked();
          return;
        }
        setVisible(true);
      } catch {
        setVisible(true);
      }
    }

    checkExisting();
  }, []);

  async function enablePush() {
    setLoading(true);
    setError(null);

    try {
      const vapidRes = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await vapidRes.json();
      if (!publicKey) {
        setError("Push ist noch nicht konfiguriert.");
        return;
      }

      const permission = await Notification.requestPermission();
      markPushAsked();

      if (permission !== "granted") {
        setVisible(false);
        return;
      }

      const subscription = await subscribeToPush(publicKey);
      if (!subscription) {
        setError("Push konnte nicht eingerichtet werden.");
        return;
      }

      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!saveRes.ok) {
        setError("Speichern fehlgeschlagen.");
        return;
      }

      setVisible(false);
    } catch {
      setError("Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    markPushDismissed();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <Card className="border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bell className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-medium text-text-primary">Erinnerungen aktivieren?</p>
            <p className="mt-1 text-sm text-text-secondary">
              Sanfte Hinweise zu deinen Check-in-Zeiten — nur auf diesem Geraet.
            </p>
          </div>
          {error ? <p className="text-sm text-warning">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <PrimaryButton type="button" onClick={enablePush} disabled={loading}>
              {loading ? "Bitte warten…" : "Ja, erinnern"}
            </PrimaryButton>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-touch rounded-2xl px-4 text-sm text-text-secondary underline"
            >
              Spaeter
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
