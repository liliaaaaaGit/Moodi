import { Card } from "@/components/Card";
import { formatCategory } from "@/lib/skills/categories";
import type { SkillSummary } from "@/lib/checkin/types";
import { clsx } from "clsx";

type ReviewSkillCardProps = {
  skill: SkillSummary;
  variant: "cope" | "thrive" | "svv";
};

const variantStyles = {
  cope: "border-primary/25 bg-primary/5",
  thrive: "border-accent/40 bg-accent/10",
  svv: "border-warning/30 bg-warning/5",
};

export function ReviewSkillCard({ skill, variant }: ReviewSkillCardProps) {
  return (
    <Card className={clsx("border p-5", variantStyles[variant])}>
      <p className="text-lg font-semibold text-text-primary">{skill.name}</p>
      <p className="mt-1 text-sm text-text-secondary">
        {formatCategory(skill.kategorie)}
        {skill.dauer_minuten ? ` · ${skill.dauer_minuten} Min` : ""}
      </p>
      {skill.beschreibung ? (
        <p className="mt-3 text-sm leading-relaxed text-text-primary">
          {skill.beschreibung}
        </p>
      ) : null}
    </Card>
  );
}
