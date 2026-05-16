"use client";

import { clsx } from "clsx";
import { formatCategory } from "@/lib/skills/categories";
import type { SkillSummary } from "@/lib/checkin/types";

type ReviewTapSkillCardProps = {
  skill: SkillSummary;
  onSelect: () => void;
  disabled?: boolean;
  variant?: "short" | "long" | "svv";
};

const variantStyles = {
  short: "border-accent/30 bg-white hover:bg-primary/5 active:bg-primary/10",
  long: "border-primary/25 bg-primary/5 hover:bg-primary/10 active:bg-primary/15",
  svv: "border-accent/30 bg-white hover:bg-[#C97B7B]/5 active:bg-[#C97B7B]/10",
};

export function ReviewTapSkillCard({
  skill,
  onSelect,
  disabled,
  variant = "short",
}: ReviewTapSkillCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={clsx(
        "w-full rounded-2xl border p-5 text-left shadow-soft transition-all duration-150 ease-gentle",
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        "active:scale-[0.99]",
        variantStyles[variant],
        variant === "svv" && "border-l-[3px] border-l-[#C97B7B]"
      )}
    >
      {variant === "long" ? (
        <span className="mb-2 inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
          Längerer Skill
        </span>
      ) : null}
      {variant === "svv" ? (
        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-secondary">
          Zusätzlicher Skill
        </span>
      ) : null}

      <p className="text-lg font-semibold leading-snug text-text-primary">
        {skill.name}
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        {formatCategory(skill.kategorie)}
        {skill.dauer_minuten != null ? ` · ca. ${skill.dauer_minuten} Min` : ""}
      </p>
      {skill.beschreibung ? (
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {skill.beschreibung}
        </p>
      ) : null}
    </button>
  );
}
