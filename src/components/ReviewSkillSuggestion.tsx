"use client";

import { clsx } from "clsx";
import { Card } from "@/components/Card";
import { formatCategory } from "@/lib/skills/categories";
import type { SkillStatus, SkillSummary } from "@/lib/checkin/types";

type ReviewSkillSuggestionProps = {
  skill: SkillSummary;
  status: SkillStatus;
  acting: boolean;
  onMachIch: () => void;
  onJetztNicht: () => void;
  onOtherSkill?: () => void;
};

function statusLabel(status: SkillStatus) {
  if (status === "gemacht" || status === "anderer") return "✓ Gemacht";
  if (status === "nicht_gemacht" || status === "uebersprungen") return "Übersprungen";
  return null;
}

export function ReviewSkillSuggestion({
  skill,
  status,
  acting,
  onMachIch,
  onJetztNicht,
  onOtherSkill,
}: ReviewSkillSuggestionProps) {
  const resolved = statusLabel(status);
  const done = status === "gemacht" || status === "anderer";
  const skipped =
    status === "nicht_gemacht" || status === "uebersprungen";

  return (
    <Card className="p-5 shadow-soft">
      <p className="text-lg font-semibold leading-snug text-text-primary">
        {skill.name}
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        {formatCategory(skill.kategorie)}
        {skill.dauer_minuten != null
          ? ` · ca. ${skill.dauer_minuten} Min`
          : ""}
      </p>
      {skill.beschreibung ? (
        <p className="mt-3 text-sm leading-relaxed text-text-primary">
          {skill.beschreibung}
        </p>
      ) : null}

      <div className="mt-5 flex justify-center gap-3">
        <button
          type="button"
          disabled={acting || done || skipped}
          onClick={onMachIch}
          className={clsx(
            "min-h-[44px] w-[40%] rounded-2xl text-sm font-medium shadow-soft transition-opacity",
            done
              ? "cursor-default bg-primary/80 text-white"
              : "bg-primary text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {done ? "✓ Gemacht" : "Mach ich"}
        </button>
        <button
          type="button"
          disabled={acting || done || skipped}
          onClick={onJetztNicht}
          className={clsx(
            "min-h-[44px] w-[40%] rounded-2xl border text-sm font-medium shadow-soft transition-colors",
            skipped
              ? "cursor-default border-accent/50 bg-accent/20 text-text-secondary"
              : "border-accent/50 bg-white text-text-primary hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {skipped ? "Übersprungen" : "Jetzt nicht"}
        </button>
      </div>

      {onOtherSkill && !resolved ? (
        <button
          type="button"
          disabled={acting}
          onClick={onOtherSkill}
          className="mt-3 w-full text-center text-xs text-text-secondary underline-offset-2 hover:underline disabled:opacity-60"
        >
          Anderer Skill
        </button>
      ) : null}
    </Card>
  );
}

type ReviewSvvCardProps = {
  skill: SkillSummary;
  status: SkillStatus;
  acting: boolean;
  onMachIch: () => void;
  onJetztNicht: () => void;
};

export function ReviewSvvCard({
  skill,
  status,
  acting,
  onMachIch,
  onJetztNicht,
}: ReviewSvvCardProps) {
  const done = status === "gemacht" || status === "anderer";
  const skipped =
    status === "nicht_gemacht" || status === "uebersprungen";

  return (
    <div
      className="rounded-2xl border border-accent/30 bg-white p-5 shadow-soft"
      style={{ borderLeft: "3px solid #C97B7B" }}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
        Zusätzlicher Skill
      </p>
      <p className="mt-2 text-lg font-semibold text-text-primary">{skill.name}</p>
      <p className="mt-1 text-sm text-text-secondary">
        Sicher und sofort umsetzbar
      </p>

      <div className="mt-5 flex justify-center gap-3">
        <button
          type="button"
          disabled={acting || done || skipped}
          onClick={onMachIch}
          className={clsx(
            "min-h-[44px] w-[40%] rounded-2xl text-sm font-medium shadow-soft",
            done
              ? "cursor-default bg-primary/80 text-white"
              : "bg-primary text-white hover:opacity-90 disabled:opacity-60"
          )}
        >
          {done ? "✓ Gemacht" : "Mach ich"}
        </button>
        <button
          type="button"
          disabled={acting || done || skipped}
          onClick={onJetztNicht}
          className={clsx(
            "min-h-[44px] w-[40%] rounded-2xl border text-sm font-medium shadow-soft",
            skipped
              ? "cursor-default border-accent/50 bg-accent/20 text-text-secondary"
              : "border-accent/50 bg-white text-text-primary hover:bg-accent/10 disabled:opacity-60"
          )}
        >
          {skipped ? "Übersprungen" : "Jetzt nicht"}
        </button>
      </div>
    </div>
  );
}
