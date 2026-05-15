"use client";

import { useCallback, useEffect, useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { isPinUnlocked, setPinUnlocked } from "@/lib/pin/storage";

type PinGateProps = {
  children: React.ReactNode;
};

export function PinGate({ children }: PinGateProps) {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkUnlocked = useCallback(() => {
    if (!pinEnabled) {
      setUnlocked(true);
      return;
    }
    setUnlocked(isPinUnlocked());
  }, [pinEnabled]);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/settings");
        const payload = await response.json();
        if (response.ok) {
          setPinEnabled(Boolean(payload.pinEnabled));
          if (!payload.pinEnabled) {
            setUnlocked(true);
          } else {
            setUnlocked(isPinUnlocked());
          }
        } else {
          setUnlocked(true);
        }
      } catch {
        setUnlocked(true);
      } finally {
        setReady(true);
      }
    }
    load();
  }, []);

  useEffect(() => {
    checkUnlocked();
  }, [checkUnlocked]);

  async function handleUnlock(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!/^\d{4}$/.test(pin)) {
      setError("Bitte 4 Ziffern eingeben.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/settings/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error ?? "Falsche PIN");
        setPin("");
        return;
      }

      setPinUnlocked();
      setUnlocked(true);
      setPin("");
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  }

  function handleDigit(digit: string) {
    if (pin.length >= 4) return;
    setPin((prev) => `${prev}${digit}`.slice(0, 4));
    setError(null);
  }

  function handleBackspace() {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-text-secondary">Lädt…</p>
      </div>
    );
  }

  if (pinEnabled && !unlocked) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
        <h1 className="text-center text-2xl font-semibold text-text-primary">PIN eingeben</h1>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Zum Schutz deiner Daten
        </p>

        <form onSubmit={handleUnlock} className="mt-8 space-y-6">
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-white"
              >
                {pin[index] ? (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                ) : null}
              </span>
            ))}
          </div>

          {error ? (
            <p className="text-center text-sm text-warning" role="alert">
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key) => {
              if (key === "") {
                return <span key="empty" />;
              }
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => (key === "⌫" ? handleBackspace() : handleDigit(key))}
                  className="flex min-h-touch items-center justify-center rounded-2xl bg-white text-xl font-medium text-text-primary shadow-soft"
                >
                  {key}
                </button>
              );
            })}
          </div>

          <PrimaryButton type="submit" disabled={loading || pin.length !== 4}>
            {loading ? "Prüft…" : "Entsperren"}
          </PrimaryButton>
        </form>
      </main>
    );
  }

  return <>{children}</>;
}
