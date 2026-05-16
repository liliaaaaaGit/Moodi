"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import {
  getClientVapidPublicKey,
  hasPushBeenAsked,
  isStandalonePwa,
  markPushAsked,
  markPushDismissed,
  subscribeToPush,
} from "@/lib/push/client";

const VAPID_CONFIG_ERROR =
  "Push ist nicht konfiguriert: NEXT_PUBLIC_VAPID_PUBLIC_KEY fehlt. Bitte in Vercel setzen und die App neu deployen.";

export function PushOptIn() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStandalonePwa()) return;
    if (hasPushBeenAsked()) return;
    if (!("Notification" in window) || !("PushManager" in window)) return;

    const publicKey = getClientVapidPublicKey();
    console.log("VAPID key length:", publicKey?.length);

    async function checkExisting() {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          setVisible(true);
          if (!publicKey) setError(VAPID_CONFIG_ERROR);
          return;
        }
        const payload = await response.json();
        if (payload.pushSubscribed) {
          markPushAsked();
          return;
        }
        setVisible(true);
        if (!publicKey) setError(VAPID_CONFIG_ERROR);
      } catch {
        setVisible(true);
        if (!publicKey) setError(VAPID_CONFIG_ERROR);
      }
    }

    checkExisting();
  }, []);

  async function enablePush() {
    setLoading(true);
    setError(null);

    const publicKey = getClientVapidPublicKey();
    console.log("VAPID key length:", publicKey?.length);

    if (!publicKey) {
      setError(VAPID_CONFIG_ERROR);
      setLoading(false);
      return;
    }

    try {
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
              Sanfte Hinweise zu deinen Check-in-Zeiten — nur auf diesem Gerät.
            </p>
          </div>
          {error ? <p className="text-sm text-warning">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <PrimaryButton
              type="button"
              onClick={enablePush}
              disabled={loading || !getClientVapidPublicKey()}
            >
              {loading ? "Bitte warten…" : "Ja, erinnern"}
            </PrimaryButton>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-touch rounded-2xl px-4 text-sm text-text-secondary underline"
            >
              Später
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
