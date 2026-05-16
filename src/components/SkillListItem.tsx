"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Card } from "@/components/Card";

type SkillListItemProps = {
  id: string;
  name: string;
  dauer_minuten: number | null;
  level_min: number;
  level_max: number;
  aktiv: boolean;
  /** Levelzeile unter dem Namen (Cope); bei Thrive/SVV aus. */
  showLevel?: boolean;
};

export function SkillListItem({
  id,
  name,
  dauer_minuten,
  level_min,
  level_max,
  aktiv,
  showLevel = true,
}: SkillListItemProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleAktiv() {
    startTransition(async () => {
      await fetch(`/api/skills/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktiv: !aktiv }),
      });
      router.refresh();
    });
  }

  return (
    <Card className={`p-4 ${!aktiv ? "opacity-60" : ""}`}>
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug text-text-primary">{name}</p>
          {showLevel ? (
            <p className="mt-0.5 text-xs text-text-secondary">
              Level {level_min}–{level_max}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {dauer_minuten != null ? (
            <span className="text-sm tabular-nums text-text-secondary">
              {dauer_minuten} Min
            </span>
          ) : (
            <span className="text-sm text-text-secondary">–</span>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              role="switch"
              aria-checked={aktiv}
              aria-label={aktiv ? "Skill deaktivieren" : "Skill aktivieren"}
              disabled={pending}
              onClick={toggleAktiv}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                aktiv ? "bg-primary" : "bg-accent/50"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  aktiv ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>

            <Link
              href={`/skills/${id}/edit`}
              className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-accent/30 hover:text-primary"
              aria-label={`${name} bearbeiten`}
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
