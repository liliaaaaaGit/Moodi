"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MiniLevelSlider } from "@/components/MiniLevelSlider";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SectionHeader } from "@/components/SectionHeader";
import { Toast } from "@/components/Toast";
import { clsx } from "clsx";

type Hilfreich = "ja" | "bisschen" | "nein";

function AfterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkinId = searchParams.get("id");

  const [levelAfter, setLevelAfter] = useState(5);
  const [hilfreich, setHilfreich] = useState<Hilfreich | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!checkinId) {
      setInitialLoading(false);
      return;
    }

    async function loadCheckin() {
      try {
        const response = await fetch(`/api/checkin/${checkinId}`);
        const payload = await response.json();
        if (response.ok && payload.checkin?.level_before != null) {
          setLevelAfter(payload.checkin.level_before);
        }
      } catch {
        // Default-Level 5 bleibt
      } finally {
        setInitialLoading(false);
      }
    }

    loadCheckin();
  }, [checkinId]);

  async function handleSave() {
    if (!checkinId) {
      setToast("Check-in nicht gefunden.");
      return;
    }

    if (!hilfreich) {
      setToast("Bitte wähle aus, ob es geholfen hat.");
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      const response = await fetch(`/api/checkin/${checkinId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level_after: levelAfter,
          hilfreich,
          comment: comment.trim() || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setToast(payload.error ?? "Speichern fehlgeschlagen.");
        return;
      }

      router.push("/");
    } catch {
      setToast("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return <p className="py-12 text-center text-text-secondary">Lädt…</p>;
  }

  if (!checkinId) {
    return (
      <p className="py-12 text-center text-text-secondary">
        Kein Check-in gefunden.{" "}
        <Link href="/" className="text-primary underline">
          Zur Startseite
        </Link>
      </p>
    );
  }

  return (
    <>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}

      <Link
        href="/"
        className="inline-block text-sm text-text-secondary underline-offset-2 hover:underline"
      >
        Überspringen
      </Link>

      <div className="mt-8 space-y-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Wie geht es dir jetzt?
        </h1>

        <section className="space-y-2">
          <SectionHeader>Level jetzt</SectionHeader>
          <MiniLevelSlider value={levelAfter} onChange={setLevelAfter} />
        </section>

        <section className="space-y-3">
          <SectionHeader>Hat geholfen?</SectionHeader>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: "ja", label: "Ja" },
                { value: "bisschen", label: "Bisschen" },
                { value: "nein", label: "Nein" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setHilfreich(option.value)}
                className={clsx(
                  "min-h-touch rounded-2xl border px-2 text-sm font-medium transition-colors duration-200 ease-gentle",
                  hilfreich === option.value
                    ? "border-primary bg-primary text-white"
                    : "border-accent/40 bg-white text-text-primary"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <label htmlFor="after-comment" className="text-sm text-text-secondary">
            Kommentar (optional)
          </label>
          <textarea
            id="after-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            placeholder="Was hat sich verändert?"
            className="w-full resize-none rounded-2xl border border-accent/40 bg-white px-4 py-3 text-sm text-text-primary shadow-soft outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </section>

        <PrimaryButton onClick={handleSave} disabled={loading}>
          {loading ? "Speichert…" : "Speichern"}
        </PrimaryButton>
      </div>
    </>
  );
}

export default function AfterPage() {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <Suspense fallback={<p className="text-text-secondary">Lädt…</p>}>
        <AfterContent />
      </Suspense>
    </main>
  );
}
