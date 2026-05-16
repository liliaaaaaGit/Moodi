"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ReviewTapSkillCard } from "@/components/ReviewTapSkillCard";
import { Toast } from "@/components/Toast";
import {
  BAYERN_CRISIS_PHONE_DISPLAY,
  BAYERN_CRISIS_PHONE_TEL,
} from "@/lib/checkin/crisis-skills";
import type { SkillSummary } from "@/lib/checkin/types";

async function patchCheckin(
  id: string,
  body: { chosen_skill_id: string; skill_status: "gemacht" }
) {
  const response = await fetch(`/api/checkin/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("Speichern fehlgeschlagen");
  }
}

function CrisisSectionHeading({ children }: { children: string }) {
  return (
    <h2 className="text-xs font-medium uppercase tracking-wider text-text-secondary">
      {children}
    </h2>
  );
}

export function CrisisClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = Number(searchParams.get("level") ?? "9");
  const text = searchParams.get("text") ?? "";
  const existingId = searchParams.get("id");

  const [checkinId, setCheckinId] = useState<string | null>(existingId);
  const [shortSkills, setShortSkills] = useState<SkillSummary[]>([]);
  const [umgebungSkills, setUmgebungSkills] = useState<SkillSummary[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    async function ensureCheckin() {
      if (checkinId) return;

      try {
        const response = await fetch("/api/checkin/crisis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ level, text }),
        });
        const payload = await response.json();
        if (response.ok && payload.checkinId) {
          setCheckinId(payload.checkinId);
        } else {
          setToast(payload.error ?? "Check-in konnte nicht gespeichert werden");
        }
      } catch {
        setToast("Check-in konnte nicht gespeichert werden");
      }
    }

    void ensureCheckin();
  }, [checkinId, level, text]);

  useEffect(() => {
    async function loadSkills() {
      try {
        const response = await fetch("/api/checkin/crisis-skills");
        const payload = await response.json();
        if (!response.ok) {
          setToast(payload.error ?? "Skills konnten nicht geladen werden");
          return;
        }
        setShortSkills(payload.shortSkills ?? []);
        setUmgebungSkills(payload.umgebungSkills ?? []);
      } catch {
        setToast("Skills konnten nicht geladen werden");
      } finally {
        setSkillsLoading(false);
      }
    }

    void loadSkills();
  }, []);

  async function handleSkillSelect(skill: SkillSummary) {
    if (!checkinId) {
      setToast("Bitte kurz warten, Check-in wird gespeichert…");
      return;
    }

    setActing(true);
    try {
      await patchCheckin(checkinId, {
        chosen_skill_id: skill.id,
        skill_status: "gemacht",
      });
      router.refresh();
      router.push(`/checkin/after?id=${checkinId}`);
    } catch {
      setToast("Konnte nicht gespeichert werden");
    } finally {
      setActing(false);
    }
  }

  return (
    <>
      {toast ? <Toast message={toast} onClose={dismissToast} /> : null}

      <div className="space-y-10 pb-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Das ist gerade viel. Ein Schritt nach dem anderen.
        </h1>

        <section className="space-y-4">
          <CrisisSectionHeading>Schnelle Skills</CrisisSectionHeading>
          {skillsLoading ? (
            <p className="text-sm text-text-secondary">Skills werden geladen…</p>
          ) : shortSkills.length > 0 ? (
            <div className="space-y-3">
              {shortSkills.map((skill) => (
                <ReviewTapSkillCard
                  key={skill.id}
                  skill={skill}
                  variant="short"
                  disabled={acting}
                  onSelect={() => handleSkillSelect(skill)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              Keine kurzen Skills verfügbar.
            </p>
          )}
        </section>

        {umgebungSkills.length > 0 ? (
          <section className="space-y-4">
            <CrisisSectionHeading>Umgebungswechsel</CrisisSectionHeading>
            <div className="space-y-3">
              {umgebungSkills.map((skill) => (
                <ReviewTapSkillCard
                  key={skill.id}
                  skill={skill}
                  variant="short"
                  disabled={acting}
                  onSelect={() => handleSkillSelect(skill)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <CrisisSectionHeading>Notfallnummern</CrisisSectionHeading>

          <Card className="space-y-4 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Bayrischer Krisendienst
            </p>
            <a href={`tel:${BAYERN_CRISIS_PHONE_TEL}`} className="block">
              <PrimaryButton type="button" className="w-full text-center">
                {BAYERN_CRISIS_PHONE_DISPLAY} anrufen
              </PrimaryButton>
            </a>
          </Card>

          <Card className="bg-bg p-4 shadow-none">
            <p className="text-center text-sm text-text-secondary">
              Bei akuter Gefahr →{" "}
              <a
                href="tel:112"
                className="font-semibold text-text-primary underline"
              >
                112
              </a>
            </p>
          </Card>

          <p className="text-center text-sm text-text-secondary">
            Wenn es jetzt nicht reicht – ruf bitte jemanden an.
          </p>
        </section>
      </div>
    </>
  );
}
