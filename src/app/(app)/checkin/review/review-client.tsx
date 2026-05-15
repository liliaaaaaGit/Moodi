"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SectionHeader } from "@/components/SectionHeader";
import { SkillPickerSheet } from "@/components/SkillPickerSheet";
import { Toast } from "@/components/Toast";
import type { CheckinRecord, SkillSummary } from "@/lib/checkin/types";

const FIELD_LABELS: { key: keyof CheckinRecord; label: string }[] = [
  { key: "situation", label: "Situation" },
  { key: "gedanken", label: "Gedanken" },
  { key: "koerper", label: "Körper" },
  { key: "gefuehl", label: "Gefühl" },
  { key: "beduerfnis", label: "Bedürfnis" },
];

async function patchCheckin(
  id: string,
  body: { chosen_skill_id?: string | null; skill_status: string }
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

export function ReviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkinId = searchParams.get("id");

  const [checkin, setCheckin] = useState<CheckinRecord | null>(null);
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!checkinId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const response = await fetch(`/api/checkin/${checkinId}`);
        const payload = await response.json();
        if (!response.ok) {
          setToast(payload.error ?? "Check-in nicht gefunden");
          return;
        }
        const record = payload.checkin as CheckinRecord;
        setCheckin(record);

        const skillsRes = await fetch(`/api/checkin/skills?level=${record.level_before}`);
        const skillsPayload = await skillsRes.json();
        if (skillsRes.ok) {
          setSkills(skillsPayload.skills ?? []);
        }
      } catch {
        setToast("Daten konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [checkinId]);

  async function handleMachIch() {
    if (!checkin?.suggested_skill_id || !checkinId) return;
    setActing(true);
    try {
      await patchCheckin(checkinId, {
        chosen_skill_id: checkin.suggested_skill_id,
        skill_status: "gemacht",
      });
      router.push(`/checkin/after?id=${checkinId}`);
    } catch {
      setToast("Konnte nicht gespeichert werden");
    } finally {
      setActing(false);
    }
  }

  async function handleNichtJetzt() {
    if (!checkinId) return;
    setActing(true);
    try {
      await patchCheckin(checkinId, { skill_status: "nicht_gemacht" });
      router.push("/");
    } catch {
      setToast("Konnte nicht gespeichert werden");
    } finally {
      setActing(false);
    }
  }

  async function handleOtherSkill(skill: SkillSummary) {
    if (!checkinId) return;
    setActing(true);
    setSheetOpen(false);
    try {
      await patchCheckin(checkinId, {
        chosen_skill_id: skill.id,
        skill_status: "anderer",
      });
      router.push(`/checkin/after?id=${checkinId}`);
    } catch {
      setToast("Konnte nicht gespeichert werden");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <p className="py-12 text-center text-text-secondary">Lädt Auswertung…</p>
    );
  }

  if (!checkinId || !checkin) {
    return (
      <p className="py-12 text-center text-text-secondary">
        Kein Check-in gefunden.
      </p>
    );
  }

  const structuredFields = FIELD_LABELS.filter(({ key }) => {
    const value = checkin[key];
    return typeof value === "string" && value.trim().length > 0;
  });

  return (
    <>
      {toast ? <Toast message={toast} onClose={dismissToast} /> : null}

      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-text-primary">Deine Auswertung</h1>

        {checkin.input_raw ? (
          <p className="text-sm text-text-secondary">{checkin.input_raw}</p>
        ) : null}

        {structuredFields.length > 0 ? (
          <section className="space-y-3">
            <SectionHeader>Strukturiert</SectionHeader>
            {structuredFields.map(({ key, label }) => (
              <Card key={key}>
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                  {label}
                </p>
                <p className="mt-2 text-text-primary">{checkin[key] as string}</p>
              </Card>
            ))}
          </section>
        ) : null}

        {checkin.suggested_skill ? (
          <section className="space-y-3">
            <SectionHeader>Skill-Vorschlag</SectionHeader>
            <Card className="border border-primary/20 bg-primary/5 p-6">
              <p className="text-xl font-semibold text-text-primary">
                {checkin.suggested_skill.name}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                {checkin.suggested_skill.kategorie}
                {checkin.suggested_skill.dauer_minuten
                  ? ` · ${checkin.suggested_skill.dauer_minuten} Min`
                  : ""}
              </p>
              {checkin.suggested_skill.beschreibung ? (
                <p className="mt-3 text-text-primary">
                  {checkin.suggested_skill.beschreibung}
                </p>
              ) : null}
            </Card>
          </section>
        ) : null}

        <div className="space-y-3 pt-2">
          {checkin.suggested_skill ? (
            <PrimaryButton onClick={handleMachIch} disabled={acting}>
              Mach ich
            </PrimaryButton>
          ) : null}
          <button
            type="button"
            onClick={handleNichtJetzt}
            disabled={acting}
            className="min-h-touch w-full rounded-2xl border border-accent/50 bg-white px-6 text-lg font-medium text-text-primary shadow-soft disabled:opacity-60"
          >
            Nicht jetzt
          </button>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            disabled={acting || skills.length === 0}
            className="min-h-touch w-full rounded-2xl bg-accent/30 px-6 text-lg font-medium text-text-primary disabled:opacity-60"
          >
            Anderer Skill
          </button>
        </div>
      </div>

      <SkillPickerSheet
        open={sheetOpen}
        skills={skills}
        onClose={() => setSheetOpen(false)}
        onSelect={handleOtherSkill}
      />
    </>
  );
}
