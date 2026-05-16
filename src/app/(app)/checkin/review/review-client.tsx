"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import {
  ReviewSkillSuggestion,
  ReviewSvvCard,
} from "@/components/ReviewSkillSuggestion";
import { SkillPickerSheet } from "@/components/SkillPickerSheet";
import { Toast } from "@/components/Toast";
import type { CheckinRecord, SkillStatus, SkillSummary } from "@/lib/checkin/types";

const FIELD_LABELS: { key: keyof CheckinRecord; label: string }[] = [
  { key: "situation", label: "Situation" },
  { key: "gedanken", label: "Gedanken" },
  { key: "koerper", label: "Körper" },
  { key: "gefuehl", label: "Gefühl" },
  { key: "beduerfnis", label: "Bedürfnis" },
];

type PatchBody = {
  chosen_skill_id?: string | null;
  chosen_long_skill_id?: string | null;
  chosen_svv_skill_id?: string | null;
  skill_status?: SkillStatus;
  long_skill_status?: SkillStatus;
  svv_skill_status?: SkillStatus;
};

type SheetKind = "short" | "long" | null;

async function patchCheckin(id: string, body: PatchBody) {
  const response = await fetch(`/api/checkin/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("Speichern fehlgeschlagen");
  }
}

function isEvaluated(status: SkillStatus) {
  return status != null;
}

export function ReviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkinId = searchParams.get("id");

  const [checkin, setCheckin] = useState<CheckinRecord | null>(null);
  const [shortSkills, setShortSkills] = useState<SkillSummary[]>([]);
  const [longSkills, setLongSkills] = useState<SkillSummary[]>([]);
  const [sheetKind, setSheetKind] = useState<SheetKind>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const loadCheckin = useCallback(async () => {
    if (!checkinId) return null;

    const response = await fetch(`/api/checkin/${checkinId}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Check-in nicht gefunden");
    }

    const record = payload.checkin as CheckinRecord;
    setCheckin(record);
    return record;
  }, [checkinId]);

  useEffect(() => {
    if (!checkinId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const record = await loadCheckin();
        if (!record) return;

        const [shortRes, longRes] = await Promise.all([
          fetch(`/api/checkin/skills?level=${record.level_before}&kind=short`),
          fetch(`/api/checkin/skills?level=${record.level_before}&kind=long`),
        ]);

        const shortPayload = await shortRes.json();
        const longPayload = await longRes.json();

        if (shortRes.ok) setShortSkills(shortPayload.skills ?? []);
        if (longRes.ok) setLongSkills(longPayload.skills ?? []);
      } catch {
        setToast("Daten konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [checkinId, loadCheckin]);

  async function applyPatch(body: PatchBody) {
    if (!checkinId) return;
    setActing(true);
    try {
      await patchCheckin(checkinId, body);
      router.refresh();
      await loadCheckin();
    } catch {
      setToast("Konnte nicht gespeichert werden");
    } finally {
      setActing(false);
    }
  }

  // Kurzer Skill: chosen_skill_id + skill_status (unabhängig von lang/SVV)
  function handleShortMachIch() {
    if (!checkin?.suggested_skill_id) return;
    void applyPatch({
      chosen_skill_id: checkin.suggested_skill_id,
      skill_status: "gemacht",
    });
  }

  function handleShortJetztNicht() {
    void applyPatch({ skill_status: "nicht_gemacht" });
  }

  function handleShortOther(skill: SkillSummary) {
    setSheetKind(null);
    void applyPatch({
      chosen_skill_id: skill.id,
      skill_status: "anderer",
    });
  }

  function handleLongMachIch() {
    if (!checkin?.suggested_long_skill_id) return;
    void applyPatch({
      chosen_long_skill_id: checkin.suggested_long_skill_id,
      long_skill_status: "gemacht",
    });
  }

  function handleLongJetztNicht() {
    void applyPatch({ long_skill_status: "nicht_gemacht" });
  }

  function handleLongOther(skill: SkillSummary) {
    setSheetKind(null);
    void applyPatch({
      chosen_long_skill_id: skill.id,
      long_skill_status: "anderer",
    });
  }

  /**
   * SVV nutzt eigene Felder chosen_svv_skill_id + svv_skill_status,
   * damit kurzer/langer Skill parallel bewertet werden können (additiv).
   */
  function handleSvvMachIch() {
    if (!checkin?.svv_skill?.id) return;
    void applyPatch({
      chosen_svv_skill_id: checkin.svv_skill.id,
      svv_skill_status: "gemacht",
    });
  }

  function handleSvvJetztNicht() {
    void applyPatch({ svv_skill_status: "nicht_gemacht" });
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

  const hasShort = Boolean(checkin.suggested_skill);
  const hasLong = Boolean(checkin.suggested_long_skill);
  const hasSvv = checkin.svv_flag && Boolean(checkin.svv_skill);
  const hasSuggestions = hasShort || hasLong || hasSvv;

  const anyEvaluated =
    (hasShort && isEvaluated(checkin.skill_status)) ||
    (hasLong && isEvaluated(checkin.long_skill_status)) ||
    (hasSvv && isEvaluated(checkin.svv_skill_status));

  const showWeiter = !hasSuggestions || anyEvaluated;

  const sheetSkills = sheetKind === "long" ? longSkills : shortSkills;

  return (
    <>
      {toast ? <Toast message={toast} onClose={dismissToast} /> : null}

      <div className="space-y-10">
        <h1 className="text-2xl font-semibold text-text-primary">
          Deine Auswertung
        </h1>

        {checkin.input_raw ? (
          <p className="-mt-4 text-sm text-text-secondary">{checkin.input_raw}</p>
        ) : null}

        {structuredFields.length > 0 ? (
          <section className="space-y-3">
            {structuredFields.map(({ key, label }) => (
              <Card key={key} className="p-5 shadow-soft">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                  {label}
                </p>
                <p className="mt-2 text-text-primary">{checkin[key] as string}</p>
              </Card>
            ))}
          </section>
        ) : null}

        {hasSuggestions ? (
          <section className="space-y-6">
            <h2 className="text-xs font-medium uppercase tracking-wider text-text-secondary">
              Vorschläge
            </h2>

            {hasShort && checkin.suggested_skill ? (
              <ReviewSkillSuggestion
                skill={checkin.suggested_skill}
                status={checkin.skill_status}
                acting={acting}
                onMachIch={handleShortMachIch}
                onJetztNicht={handleShortJetztNicht}
                onOtherSkill={() => setSheetKind("short")}
              />
            ) : null}

            {hasLong && checkin.suggested_long_skill ? (
              <ReviewSkillSuggestion
                skill={checkin.suggested_long_skill}
                status={checkin.long_skill_status}
                acting={acting}
                onMachIch={handleLongMachIch}
                onJetztNicht={handleLongJetztNicht}
                onOtherSkill={() => setSheetKind("long")}
              />
            ) : null}

            {hasSvv && checkin.svv_skill ? (
              <ReviewSvvCard
                skill={checkin.svv_skill}
                status={checkin.svv_skill_status}
                acting={acting}
                onMachIch={handleSvvMachIch}
                onJetztNicht={handleSvvJetztNicht}
              />
            ) : null}
          </section>
        ) : (
          <p className="text-center text-sm text-text-secondary">
            Kein Skill-Vorschlag für dieses Level – du kannst trotzdem
            fortfahren.
          </p>
        )}

        {showWeiter ? (
          <PrimaryButton
            disabled={acting}
            onClick={() => router.push(`/checkin/after?id=${checkinId}`)}
            className="mt-2"
          >
            Weiter
          </PrimaryButton>
        ) : null}
      </div>

      <SkillPickerSheet
        open={sheetKind != null}
        skills={sheetSkills}
        onClose={() => setSheetKind(null)}
        onSelect={(skill) => {
          if (sheetKind === "long") {
            handleLongOther(skill);
          } else {
            handleShortOther(skill);
          }
        }}
      />
    </>
  );
}
