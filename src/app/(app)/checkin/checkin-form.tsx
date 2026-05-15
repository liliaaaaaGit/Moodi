"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { LevelSlider } from "@/components/LevelSlider";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Toast } from "@/components/Toast";
import { VoiceRecorder } from "@/components/VoiceRecorder";

export function CheckinForm() {
  const router = useRouter();
  const [level, setLevel] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  async function handleEvaluate() {
    setToast(null);

    if (level >= 9) {
      const params = new URLSearchParams({
        level: String(level),
        text: text.trim(),
      });
      router.push(`/checkin/crisis?${params.toString()}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/checkin/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, text }),
      });

      const payload = (await response.json()) as {
        checkinId?: string;
        crisis?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setToast(payload.error ?? "Auswertung fehlgeschlagen. Bitte versuche es erneut.");
        return;
      }

      if (payload.crisis) {
        const params = new URLSearchParams({
          level: String(level),
          text: text.trim(),
        });
        if (payload.checkinId) {
          params.set("id", payload.checkinId);
        }
        router.push(`/checkin/crisis?${params.toString()}`);
        return;
      }

      if (payload.checkinId) {
        router.push(`/checkin/review?id=${payload.checkinId}`);
        return;
      }

      setToast("Auswertung fehlgeschlagen. Bitte versuche es erneut.");
    } catch {
      setToast("Netzwerkfehler. Bitte pruefe deine Verbindung.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {toast ? <Toast message={toast} onClose={dismissToast} /> : null}

      <div className="flex flex-col gap-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Wie ist es gerade?
        </h1>

        <LevelSlider value={level} onChange={setLevel} />

        <VoiceRecorder
          disabled={loading}
          onResult={(transcript) => {
            setText((prev) => {
              const trimmed = prev.trim();
              return trimmed ? `${trimmed} ${transcript}` : transcript;
            });
          }}
          onError={setToast}
        />

        <div className="space-y-2">
          <label htmlFor="checkin-text" className="sr-only">
            Was ist gerade los?
          </label>
          <textarea
            id="checkin-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={5}
            placeholder='z.B. "Ich sitze im Buero, Kopf drueckt, Deadline morgen, fuehle mich ueberfordert."'
            className="w-full resize-none rounded-2xl border border-accent/40 bg-white px-4 py-4 text-base text-text-primary shadow-soft outline-none transition-colors duration-200 ease-gentle placeholder:text-text-secondary/70 focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <PrimaryButton onClick={handleEvaluate} disabled={loading}>
          {loading ? "Wird ausgewertet…" : "Auswerten"}
        </PrimaryButton>
      </div>
    </>
  );
}
