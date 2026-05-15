"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SectionHeader } from "@/components/SectionHeader";
import { Toast } from "@/components/Toast";
import type { EmergencyContact, SkillSummary } from "@/lib/checkin/types";

const UMGEBUNG_SKILL_NAMES = [
  "Auto fahren, kurze Strecke",
  "Raus, frische Luft, Umgebungswechsel",
  "Nach Dachau (Schloss/Aussichtsplattform)",
] as const;

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

export function CrisisClient() {
  const searchParams = useSearchParams();
  const level = Number(searchParams.get("level") ?? "9");
  const text = searchParams.get("text") ?? "";
  const existingId = searchParams.get("id");

  const [checkinId, setCheckinId] = useState<string | null>(existingId);
  const [umgebungSkills, setUmgebungSkills] = useState<SkillSummary[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [savingSkill, setSavingSkill] = useState<string | null>(null);

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
        }
      } catch {
        setToast("Check-in konnte nicht gespeichert werden");
      }
    }

    ensureCheckin();
  }, [checkinId, level, text]);

  useEffect(() => {
    async function loadExtras() {
      try {
        const [skillsRes, settingsRes] = await Promise.all([
          fetch("/api/checkin/skills?level=9"),
          fetch("/api/settings"),
        ]);

        if (skillsRes.ok) {
          const skillsPayload = await skillsRes.json();
          const allSkills: SkillSummary[] = skillsPayload.skills ?? [];
          const matched = UMGEBUNG_SKILL_NAMES.map((name) =>
            allSkills.find((skill) => skill.name === name)
          ).filter((skill): skill is SkillSummary => Boolean(skill));
          setUmgebungSkills(matched);
        }

        if (settingsRes.ok) {
          const settingsPayload = await settingsRes.json();
          setContacts(settingsPayload.notfallkontakte ?? []);
        }
      } catch {
        // Optional extras – Seite bleibt nutzbar
      }
    }

    loadExtras();
  }, []);

  async function handleUmgebungSkill(skill: SkillSummary) {
    if (!checkinId) {
      setToast("Bitte kurz warten, Check-in wird gespeichert…");
      return;
    }

    setSavingSkill(skill.id);
    try {
      await patchCheckin(checkinId, {
        chosen_skill_id: skill.id,
        skill_status: "gemacht",
      });
      setToast(`„${skill.name}" notiert.`);
    } catch {
      setToast("Konnte nicht gespeichert werden");
    } finally {
      setSavingSkill(null);
    }
  }

  return (
    <>
      {toast ? <Toast message={toast} onClose={dismissToast} variant="info" /> : null}

      <div className="space-y-6 pb-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Das ist gerade viel. Ein Schritt nach dem anderen.
        </h1>

        <Card className="space-y-3 border border-primary/20">
          <SectionHeader>TIPP – Schnellster Skill</SectionHeader>
          <p className="text-text-primary leading-relaxed">
            Eis oder kaltes Wasser ins Gesicht. Atme so langsam aus, wie du kannst.
            Spann alle Muskeln 5 Sekunden an, dann loslassen. Wiederhol das.
          </p>
        </Card>

        <Card className="space-y-4">
          <SectionHeader>Telefonseelsorge</SectionHeader>
          <a href="tel:08001110111" className="block">
            <PrimaryButton type="button" className="text-center">
              0800 111 0 111 anrufen
            </PrimaryButton>
          </a>
        </Card>

        <Card className="bg-bg shadow-none">
          <p className="text-center text-sm text-text-secondary">
            Bei akuter Gefahr →{" "}
            <a href="tel:112" className="font-semibold text-warning underline">
              112
            </a>
          </p>
        </Card>

        {umgebungSkills.length > 0 ? (
          <Card className="space-y-3">
            <SectionHeader>Umgebungswechsel</SectionHeader>
            <div className="space-y-2">
              {umgebungSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  disabled={savingSkill === skill.id}
                  onClick={() => handleUmgebungSkill(skill)}
                  className="min-h-touch w-full rounded-2xl border border-accent/40 bg-bg px-4 py-3 text-left text-text-primary transition-colors hover:border-primary disabled:opacity-60"
                >
                  {skill.name}
                </button>
              ))}
            </div>
          </Card>
        ) : null}

        {contacts.length > 0 ? (
          <Card className="space-y-3">
            <SectionHeader>Notfallkontakte</SectionHeader>
            <ul className="space-y-2">
              {contacts.map((contact) => (
                <li key={`${contact.name}-${contact.phone}`}>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="flex min-h-touch items-center justify-between rounded-2xl bg-bg px-4 py-3 text-text-primary"
                  >
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-sm text-primary">{contact.phone}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <p className="text-center text-sm text-text-secondary">
          Wenn es jetzt nicht reicht – ruf bitte jemanden an.
        </p>
      </div>
    </>
  );
}
