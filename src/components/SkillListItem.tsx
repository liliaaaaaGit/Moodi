import { Pencil } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/Card";

type SkillListItemProps = {
  id: string;
  name: string;
  dauer_minuten: number | null;
  level_min: number;
  level_max: number;
  /** Levelzeile unter dem Namen (Cope); bei Thrive/SVV aus. */
  showLevel?: boolean;
};

export function SkillListItem({
  id,
  name,
  dauer_minuten,
  level_min,
  level_max,
  showLevel = true,
}: SkillListItemProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug text-text-primary">{name}</p>
          {showLevel ? (
            <p className="mt-0.5 text-xs text-text-secondary">
              Level {level_min}–{level_max}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {dauer_minuten != null ? (
            <span className="text-sm tabular-nums text-text-secondary">
              {dauer_minuten} Min
            </span>
          ) : (
            <span className="text-sm text-text-secondary">–</span>
          )}

          <Link
            href={`/skills/${id}/edit`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-accent/30 hover:text-primary"
            aria-label={`${name} bearbeiten`}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </Card>
  );
}
