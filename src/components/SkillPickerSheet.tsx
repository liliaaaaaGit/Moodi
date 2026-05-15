"use client";

import { X } from "lucide-react";
import type { SkillSummary } from "@/lib/checkin/types";

type SkillPickerSheetProps = {
  open: boolean;
  skills: SkillSummary[];
  onClose: () => void;
  onSelect: (skill: SkillSummary) => void;
};

export function SkillPickerSheet({
  open,
  skills,
  onClose,
  onSelect,
}: SkillPickerSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/30"
        aria-label="Schliessen"
        onClick={onClose}
      />
      <div
        className="relative max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white px-6 pb-8 pt-4 shadow-soft-lg"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Skill waehlen</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="space-y-2">
          {skills.map((skill) => (
            <li key={skill.id}>
              <button
                type="button"
                onClick={() => onSelect(skill)}
                className="w-full rounded-2xl border border-accent/30 bg-bg px-4 py-4 text-left transition-colors hover:border-primary"
              >
                <p className="font-medium text-text-primary">{skill.name}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {skill.kategorie}
                  {skill.dauer_minuten ? ` · ${skill.dauer_minuten} Min` : ""}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
