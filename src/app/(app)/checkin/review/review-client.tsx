"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { ReviewTapSkillCard } from "@/components/ReviewTapSkillCard";
import { SkillPickerGroupedSheet } from "@/components/SkillPickerGroupedSheet";
import { Toast } from "@/components/Toast";
import type { CheckinRecord, SkillSummary } from "@/lib/checkin/types";

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
  skill_status: string;
};

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

export function ReviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkinId = searchParams.get("id");

  const [checkin, setCheckin] = useState<CheckinRecord | null>(null);
  const [shortSkills, setShortSkills] = useState<SkillSummary[]>([]);
  const [longSkills, setLongSkills] = useState<SkillSummary[]>([]);
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
  }, [checkinId]);

  async function selectShortOrSvv(skillId: string, status: "gemacht" | "anderer") {
    if (!checkinId) return;
    setActing(true);
    try {
      await patchCheckin(checkinId, {
        chosen_skill_id: skillId,
        chosen_long_skill_id: null,
        skill_status: status,
      });
      router.refresh();
      router.push(`/checkin/after?id=${checkinId}`);
    } catch {
      setToast("Konnte nicht gespeichert werden");
    } finally {
      setActing(false);
    }
  }

  async function selectLong(skillId: string, status: "gemacht" | "anderer") {
    if (!checkinId) return;
    setActing(true);
    try {
      await patchCheckin(checkinId, {
        chosen_skill_id: null,
        chosen_long_skill_id: skillId,
        skill_status: status,
      });
      router.refresh();
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
      await patchCheckin(checkinId, {
        chosen_skill_id: null,
        chosen_long_skill_id: null,
        skill_status: "nicht_gemacht",
      });
      router.refresh();
      router.push("/");
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

  const shortSuggestions = checkin.suggested_short_skills ?? [];
  const hasLong = Boolean(checkin.suggested_long_skill);
  const hasSvv = checkin.svv_flag && Boolean(checkin.svv_skill);
  const hasSuggestions = shortSuggestions.length > 0 || hasLong || hasSvv;

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
          <section className="space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-text-secondary">
              Vorschläge
            </h2>

            <div className="space-y-3">
              {shortSuggestions.map((skill) => (
                <ReviewTapSkillCard
                  key={skill.id}
                  skill={skill}
                  variant="short"
                  disabled={acting}
                  onSelect={() => selectShortOrSvv(skill.id, "gemacht")}
                />
              ))}

              {hasLong && checkin.suggested_long_skill ? (
                <ReviewTapSkillCard
                  skill={checkin.suggested_long_skill}
                  variant="long"
                  disabled={acting}
                  onSelect={() =>
                    selectLong(checkin.suggested_long_skill!.id, "gemacht")
                  }
                />
              ) : null}

              {hasSvv && checkin.svv_skill ? (
                <ReviewTapSkillCard
                  skill={checkin.svv_skill}
                  variant="svv"
                  disabled={acting}
                  onSelect={() => selectShortOrSvv(checkin.svv_skill!.id, "gemacht")}
                />
              ) : null}
            </div>
          </section>
        ) : (
          <p className="text-center text-sm text-text-secondary">
            Kein Skill-Vorschlag für dieses Level.
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={acting}
            onClick={() => setSheetOpen(true)}
            className="min-h-touch w-1/2 rounded-2xl border border-primary bg-white px-4 text-base font-medium text-primary shadow-soft transition-opacity hover:bg-primary/5 disabled:opacity-60"
          >
            Andere Skills
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={handleNichtJetzt}
            className="min-h-touch w-1/2 rounded-2xl border border-[#C97B7B] bg-white px-4 text-base font-medium text-[#C97B7B] shadow-soft transition-opacity hover:bg-[#C97B7B]/5 disabled:opacity-60"
          >
            Nicht jetzt
          </button>
        </div>
      </div>

      <SkillPickerGroupedSheet
        open={sheetOpen}
        shortSkills={shortSkills}
        longSkills={longSkills}
        onClose={() => setSheetOpen(false)}
        onSelect={(skill, kind) => {
          setSheetOpen(false);
          if (kind === "long") {
            void selectLong(skill.id, "anderer");
          } else {
            void selectShortOrSvv(skill.id, "anderer");
          }
        }}
      />
    </>
  );
}
