"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LevelSlider } from "@/components/LevelSlider";
import { MiniLevelSlider } from "@/components/MiniLevelSlider";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SectionHeader } from "@/components/SectionHeader";
import { Toast } from "@/components/Toast";
import { clsx } from "clsx";

type Hilfreich = "ja" | "bisschen" | "nein";

type SkillOption = {
  id: string;
  name: string;
};

type CheckinFormData = {
  level_before: number;
  situation: string;
  gedanken: string;
  koerper: string;
  gefuehl: string;
  beduerfnis: string;
  level_after: number | null;
  hilfreich: Hilfreich | null;
  comment: string;
  chosen_skill_id: string | null;
  skill_status: string | null;
};

const TEXT_FIELDS = [
  { key: "situation", label: "Situation" },
  { key: "gedanken", label: "Gedanken" },
  { key: "koerper", label: "Körper" },
  { key: "gefuehl", label: "Gefühl" },
  { key: "beduerfnis", label: "Bedürfnis" },
] as const;

const SKILL_STATUS_OPTIONS = [
  { value: "", label: "Kein Status" },
  { value: "gemacht", label: "Gemacht" },
  { value: "nicht_gemacht", label: "Nicht gemacht" },
  { value: "anderer", label: "Anderer Skill" },
  { value: "uebersprungen", label: "Übersprungen" },
] as const;

const inputClass =
  "w-full resize-none rounded-2xl border border-accent/40 bg-white px-4 py-3 text-sm text-text-primary shadow-soft outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

export function CheckinEditForm({ checkinId }: { checkinId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [showLevelAfter, setShowLevelAfter] = useState(false);
  const [form, setForm] = useState<CheckinFormData>({
    level_before: 5,
    situation: "",
    gedanken: "",
    koerper: "",
    gefuehl: "",
    beduerfnis: "",
    level_after: null,
    hilfreich: null,
    comment: "",
    chosen_skill_id: null,
    skill_status: null,
  });

  useEffect(() => {
    async function load() {
      try {
        const [checkinRes, skillsRes] = await Promise.all([
          fetch(`/api/checkin/${checkinId}`),
          fetch("/api/skills"),
        ]);

        const checkinPayload = await checkinRes.json();
        const skillsPayload = await skillsRes.json();

        if (!checkinRes.ok || !checkinPayload.checkin) {
          setToast("Check-in nicht gefunden.");
          return;
        }

        const c = checkinPayload.checkin;
        setForm({
          level_before: c.level_before,
          situation: c.situation ?? "",
          gedanken: c.gedanken ?? "",
          koerper: c.koerper ?? "",
          gefuehl: c.gefuehl ?? "",
          beduerfnis: c.beduerfnis ?? "",
          level_after: c.level_after,
          hilfreich: c.hilfreich,
          comment: c.comment ?? "",
          chosen_skill_id: c.chosen_skill_id,
          skill_status: c.skill_status,
        });
        setShowLevelAfter(c.level_after != null);

        if (skillsRes.ok) {
          const active: SkillOption[] = (skillsPayload.skills ?? [])
            .filter((s: { aktiv: boolean }) => s.aktiv)
            .map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }));
          setSkills(active);
        }
      } catch {
        setToast("Daten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [checkinId]);

  function updateField<K extends keyof CheckinFormData>(key: K, value: CheckinFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setToast(null);

    try {
      const response = await fetch(`/api/checkin/${checkinId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level_before: form.level_before,
          situation: form.situation.trim() || null,
          gedanken: form.gedanken.trim() || null,
          koerper: form.koerper.trim() || null,
          gefuehl: form.gefuehl.trim() || null,
          beduerfnis: form.beduerfnis.trim() || null,
          level_after: showLevelAfter ? form.level_after : null,
          hilfreich: form.hilfreich,
          comment: form.comment.trim() || null,
          chosen_skill_id: form.chosen_skill_id,
          skill_status: form.skill_status || null,
        }),
      });

      if (!response.ok) {
        setToast("Konnte nicht gespeichert werden, versuch es nochmal");
        return;
      }

      router.push(`/history/${checkinId}`);
      router.refresh();
    } catch {
      setToast("Konnte nicht gespeichert werden, versuch es nochmal");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-text-secondary">Lädt…</p>;
  }

  return (
    <>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}

      <div className="space-y-8">
        <section className="space-y-2">
          <SectionHeader>Level vorher</SectionHeader>
          <LevelSlider
            value={form.level_before}
            onChange={(value) => updateField("level_before", value)}
          />
        </section>

        {TEXT_FIELDS.map(({ key, label }) => (
          <section key={key} className="space-y-2">
            <label htmlFor={key} className="text-sm font-medium text-text-secondary">
              {label}
            </label>
            <textarea
              id={key}
              rows={3}
              value={form[key]}
              onChange={(e) => updateField(key, e.target.value)}
              className={inputClass}
            />
          </section>
        ))}

        <section className="space-y-3">
          <label className="flex items-center gap-3 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={showLevelAfter}
              onChange={(e) => {
                setShowLevelAfter(e.target.checked);
                if (e.target.checked && form.level_after == null) {
                  updateField("level_after", form.level_before);
                }
              }}
              className="h-5 w-5 rounded border-accent text-primary"
            />
            Level danach angeben
          </label>
          {showLevelAfter ? (
            <MiniLevelSlider
              value={form.level_after ?? form.level_before}
              onChange={(value) => updateField("level_after", value)}
            />
          ) : null}
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
                onClick={() => updateField("hilfreich", option.value)}
                className={clsx(
                  "min-h-touch rounded-2xl border px-2 text-sm font-medium transition-colors",
                  form.hilfreich === option.value
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
          <label htmlFor="comment" className="text-sm text-text-secondary">
            Kommentar
          </label>
          <textarea
            id="comment"
            rows={3}
            value={form.comment}
            onChange={(e) => updateField("comment", e.target.value)}
            className={inputClass}
          />
        </section>

        <section className="space-y-2">
          <label htmlFor="chosen_skill" className="text-sm font-medium text-text-secondary">
            Gewählter Skill
          </label>
          <select
            id="chosen_skill"
            value={form.chosen_skill_id ?? ""}
            onChange={(e) =>
              updateField("chosen_skill_id", e.target.value ? e.target.value : null)
            }
            className={inputClass}
          >
            <option value="">Kein Skill</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </section>

        <section className="space-y-2">
          <label htmlFor="skill_status" className="text-sm font-medium text-text-secondary">
            Skill-Status
          </label>
          <select
            id="skill_status"
            value={form.skill_status ?? ""}
            onChange={(e) => updateField("skill_status", e.target.value || null)}
            className={inputClass}
          >
            {SKILL_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "none"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </section>

        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? "Speichert…" : "Speichern"}
        </PrimaryButton>

        <Link
          href={`/history/${checkinId}`}
          className="block py-2 text-center text-sm text-text-secondary underline"
        >
          Abbrechen
        </Link>
      </div>
    </>
  );
}
