"use client";

import { X } from "lucide-react";
import { formatCategory } from "@/lib/skills/categories";
import type { SkillSummary } from "@/lib/checkin/types";

type SkillPickerGroupedSheetProps = {
  open: boolean;
  shortSkills: SkillSummary[];
  longSkills: SkillSummary[];
  onClose: () => void;
  onSelect: (skill: SkillSummary, kind: "short" | "long") => void;
};

function SkillList({
  skills,
  kind,
  onSelect,
}: {
  skills: SkillSummary[];
  kind: "short" | "long";
  onSelect: (skill: SkillSummary, kind: "short" | "long") => void;
}) {
  if (!skills.length) {
    return (
      <p className="text-sm text-text-secondary">Keine passenden Skills.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {skills.map((skill) => (
        <li key={skill.id}>
          <button
            type="button"
            onClick={() => onSelect(skill, kind)}
            className="w-full rounded-2xl border border-accent/30 bg-white px-4 py-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <p className="font-medium text-text-primary">{skill.name}</p>
            <p className="mt-1 text-sm text-text-secondary">
              {formatCategory(skill.kategorie)}
              {skill.dauer_minuten ? ` · ca. ${skill.dauer_minuten} Min` : ""}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function SkillPickerGroupedSheet({
  open,
  shortSkills,
  longSkills,
  onClose,
  onSelect,
}: SkillPickerGroupedSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/30"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div
        className="relative max-h-[75vh] overflow-y-auto rounded-t-3xl bg-white px-6 pb-8 pt-4 shadow-soft-lg"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            Anderen Skill wählen
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary hover:bg-accent/20"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">
              Kurz
            </h3>
            <SkillList skills={shortSkills} kind="short" onSelect={onSelect} />
          </section>
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">
              Lang
            </h3>
            <SkillList skills={longSkills} kind="long" onSelect={onSelect} />
          </section>
        </div>
      </div>
    </div>
  );
}
